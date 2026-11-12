import { ApiError, GoogleGenAI, ThinkingLevel, type Content, type FunctionDeclaration } from "@google/genai";
import { SYSTEM_PROMPT } from "./prompt";
import { TOOLS, TOOL_STATUS, runTool } from "./tools";
import type { Conversation } from "./store";
import type { TurnContext } from "./types";

// Помічник на Google Gemini — для тестів на безкоштовному тарифі.
// Документація: aistudio.google.com/docs/function-calling (generateContent) і /docs/thought-signatures.
//   - модель отримує ті самі інструменти й системний промпт, що й Claude;
//   - відповідь моделі (candidates[0].content) додається в історію БЕЗ ЗМІН — так SDK зберігає
//     thought signatures, без яких Gemini 3 відхиляє наступний запит (4xx);
//   - результати всіх викликів одного кроку — одним повідомленням role:"user", у тому ж порядку, з тим самим id.
// Відповідь приходить цілою (не по словах): потокова передача разом з викликом функцій у документації не описана.

// Основна модель і запасні: безкоштовний тариф часто відповідає 503 «high demand» на популярній моделі
const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MODELS = [...new Set([PRIMARY_MODEL, "gemini-3.6-flash", "gemini-3.5-flash-lite"])];
const RETRY_DELAYS_MS = [800, 2000]; // повтори на тій самій моделі перед переходом на запасну
const REQUEST_TIMEOUT_MS = 20_000;
// Модель, що не відповіла, пропускаємо кілька хвилин — щоб кожна нова відповідь не чекала на неї знову
const COOLDOWN_MS = 3 * 60 * 1000;
const gCool = globalThis as unknown as { dbjuGeminiCooldown?: Map<string, number> };
const cooldown = (gCool.dbjuGeminiCooldown ??= new Map());
const firstHealthyModel = () => {
  const i = MODELS.findIndex((m) => (cooldown.get(m) ?? 0) < Date.now());
  return i === -1 ? 0 : i;
};

const isTimeout = (e: unknown) => e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError" || /timed? ?out|abort/i.test(e.message));
const isOverloaded = (e: unknown) =>
  (e instanceof ApiError && (e.status === 503 || e.status === 500 || e.status === 504)) || isTimeout(e);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiConfigError();
  // Власні повтори SDK (до 5 спроб з паузами до 60 с) вимкнено — повторюємо самі й переходимо на запасну модель,
  // а тайм-аут не дає чату «висіти», якщо Google не відповідає
  return (client ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS, retryOptions: { attempts: 1 } } }));
}

class GeminiConfigError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not set");
  }
}

// Ті самі описи інструментів, що й для Claude: JSON-схема передається як parametersJsonSchema
const FUNCTION_DECLARATIONS: FunctionDeclaration[] = TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  parametersJsonSchema: t.input_schema,
}));

export function geminiError(e: unknown): string | null {
  if (isTimeout(e)) return "Gemini не відповів вчасно (тестовий режим). Спробуйте ще раз за хвилину.";
  if (e instanceof GeminiConfigError) return "Помічник ще не налаштований: не вказано ключ Gemini (GEMINI_API_KEY).";
  if (e instanceof ApiError) {
    if (e.status === 429) {
      return "Вичерпано безкоштовний ліміт запитів до ШІ (тестовий режим). Спробуйте за хвилину або завтра.";
    }
    if (e.status === 503 || e.status === 504) {
      return "Усі безкоштовні моделі Gemini зараз перевантажені. Спробуйте за кілька хвилин.";
    }
    if (e.status === 400 && /api key/i.test(e.message)) return "Ключ Gemini недійсний. Перевірте GEMINI_API_KEY.";
    if (e.status === 401 || e.status === 403) return "Помічник ще не налаштований: ключ Gemini недійсний або без доступу.";
    if (e.status >= 500) return "ШІ тимчасово недоступний. Спробуйте трохи згодом.";
  }
  return null;
}

export async function runGeminiTurn(conv: Conversation, ctx: TurnContext): Promise<string> {
  const { send, maxSteps } = ctx;
  const ai = getClient();
  const contents: Content[] = conv.geminiContents;
  contents.push({ role: "user", parts: [{ text: ctx.contextText }, { text: ctx.message }] });

  // Модель обирається на всю відповідь: підписи міркувань (thought signatures) прив'язані до моделі,
  // тому переходимо на запасну насамперед на першому кроці, ще до викликів інструментів
  let modelIndex = firstHealthyModel();

  const generate = async (firstStep: boolean) => {
    for (;;) {
      const model = MODELS[modelIndex];
      for (let attempt = 0; ; attempt++) {
        try {
          const result = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
              // Підбір з каталогу не потребує глибоких міркувань — так відповідь у рази швидша
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          cooldown.delete(model);
          return result;
        } catch (e) {
          if (!isOverloaded(e)) throw e;
          // На першому кроці не чекаємо довго — одразу пробуємо запасну модель
          if (!firstStep && attempt < RETRY_DELAYS_MS.length) {
            await sleep(RETRY_DELAYS_MS[attempt]);
            continue;
          }
          cooldown.set(model, Date.now() + COOLDOWN_MS);
          if (modelIndex >= MODELS.length - 1) throw e;
          console.warn(`Gemini: модель ${model} перевантажена, перемикаюся на ${MODELS[modelIndex + 1]}`);
          modelIndex++;
          if (firstStep) send({ type: "status", text: "Модель перевантажена, пробую іншу…" });
          break;
        }
      }
    }
  };

  for (let step = 0; step < maxSteps; step++) {
    const response = await generate(step === 0);

    const modelContent = response.candidates?.[0]?.content;
    if (!modelContent) {
      // Відповідь заблокована фільтрами безпеки або порожня
      const text = "На жаль, з цим запитом я допомогти не можу. Спитайте мене про оренду речей на DBJU.";
      send({ type: "text", text });
      return text;
    }
    // Повний вміст відповіді — в історію без змін (thought signatures)
    contents.push(modelContent);

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      const text = response.text?.trim() || "Не вдалося сформулювати відповідь. Спробуйте перефразувати питання.";
      send({ type: "text", text });
      return text;
    }

    for (const c of calls) send({ type: "status", text: TOOL_STATUS[c.name ?? ""] ?? "Шукаю…" });

    const parts: NonNullable<Content["parts"]> = [];
    for (const c of calls) {
      const out = await runTool(c.name ?? "", c.args ?? {}, { isPlus: ctx.isPlus });
      for (const card of out.cards ?? []) conv.cards.set(card.id, card);
      let payload: Record<string, unknown>;
      try {
        payload = out.isError ? { error: JSON.parse(out.content) } : { result: JSON.parse(out.content) };
      } catch {
        payload = { result: out.content };
      }
      parts.push({ functionResponse: { id: c.id, name: c.name, response: payload } });
    }
    contents.push({ role: "user", parts });
  }

  const text = "Я зібрав багато варіантів — уточніть, будь ласка, що саме шукаєте, і я підберу точніше.";
  send({ type: "text", text });
  return text;
}
