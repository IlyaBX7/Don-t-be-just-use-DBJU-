import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompt";
import { TOOLS, TOOL_STATUS, runTool } from "./tools";
import type { Conversation } from "./store";
import type { TurnContext } from "./types";

// Помічник на Claude (платний, основний варіант). Потокова відповідь + цикл інструментів.

const MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export function anthropicError(e: unknown): string | null {
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return "Помічник ще не налаштований: немає доступу до ШІ. Зверніться до адміністратора сайту.";
  }
  if (e instanceof Anthropic.RateLimitError) return "Зараз забагато запитів до помічника. Спробуйте за хвилину.";
  if (e instanceof Anthropic.APIConnectionError) return "Не вдалося з'єднатися з ШІ. Перевірте інтернет і спробуйте ще раз.";
  if (e instanceof Anthropic.APIError && (e.status ?? 0) >= 500) return "ШІ тимчасово недоступний. Спробуйте трохи згодом.";
  if (e instanceof Anthropic.AnthropicError && /api ?key|credential|auth/i.test(e.message)) {
    return "Помічник ще не налаштований: не вказано ключ ШІ (ANTHROPIC_API_KEY).";
  }
  return null;
}

export async function runAnthropicTurn(conv: Conversation, ctx: TurnContext): Promise<string> {
  const { send, maxSteps } = ctx;
  conv.messages.push({
    role: "user",
    content: [
      { type: "text", text: ctx.contextText },
      { type: "text", text: ctx.message },
    ],
  });

  let fullText = "";
  let jsonRetries = 0;

  for (let step = 0; step < maxSteps; step++) {
    const apiStream = getClient().beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      // Якщо модель відхилить запит, API саме передасть його резервній моделі
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // Чат і пошук по каталогу — проста робота: низьке зусилля = швидше й дешевше
      output_config: { effort: "low" },
      cache_control: { type: "ephemeral" },
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: conv.messages,
    });

    let message: Anthropic.Beta.BetaMessage;
    try {
      let separated = false;
      for await (const event of apiStream) {
        if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
          send({ type: "status", text: TOOL_STATUS[event.content_block.name] ?? "Шукаю…" });
        } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          // Новий шматок тексту після виклику інструмента — з нового абзацу
          if (!separated && fullText && !fullText.endsWith("\n")) {
            fullText += "\n\n";
            send({ type: "text", text: "\n\n" });
          }
          separated = true;
          fullText += event.delta.text;
          send({ type: "text", text: event.delta.text });
        }
      }
      message = await apiStream.finalMessage();
      jsonRetries = 0;
    } catch (e) {
      // Повторюємо лише нерозбірний JSON вхідних даних інструмента; помилки API — далі
      if (e instanceof Anthropic.APIError || !(e instanceof Anthropic.AnthropicError) || jsonRetries++ >= 2) throw e;
      continue;
    }

    if (message.stop_reason === "refusal") {
      if (!fullText) {
        fullText = "На жаль, з цим запитом я допомогти не можу. Спитайте мене про оренду речей на DBJU.";
        send({ type: "text", text: fullText });
      }
      break;
    }

    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (message.stop_reason === "max_tokens" && toolUses.length) throw new Error("tool input truncated by max_tokens");

    // Повна відповідь моделі — в історію без змін (thinking/fallback-блоки теж)
    conv.messages.push({ role: "assistant", content: message.content });
    if (message.stop_reason !== "tool_use" || toolUses.length === 0) break;

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const t of toolUses) {
      const out = await runTool(t.name, t.input, { isPlus: ctx.isPlus });
      for (const card of out.cards ?? []) conv.cards.set(card.id, card);
      results.push({ type: "tool_result", tool_use_id: t.id, content: out.content, ...(out.isError && { is_error: true }) });
    }
    // Усі результати — одним повідомленням (так модель і далі робить паралельні виклики)
    conv.messages.push({ role: "user", content: results });

    if (step === maxSteps - 1) {
      const tail = (fullText ? "\n\n" : "") + "Я зібрав багато варіантів — уточніть, будь ласка, що саме шукаєте, і я підберу точніше.";
      fullText += tail;
      send({ type: "text", text: tail });
    }
  }
  return fullText;
}
