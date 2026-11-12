import type { NextRequest } from "next/server";
import { getCurrentUser } from "../../../lib/session";
import { todayISO } from "../../../lib/dates";
import { isPlusFor, type ProductCardData } from "../../../lib/assistant/tools";
import { MAX_USER_TURNS, createConversation, getConversation } from "../../../lib/assistant/store";
import { clientIp, hit } from "../../../lib/rateLimit";
import { currentProvider, type TurnContext } from "../../../lib/assistant/types";
import { anthropicError, runAnthropicTurn } from "../../../lib/assistant/anthropic";
import { geminiError, runGeminiTurn } from "../../../lib/assistant/gemini";

// POST /api/assistant { conversationId?, message } → потік NDJSON-подій:
//   {type:"conversation", id, provider} · {type:"status", text} · {type:"text", text}
//   {type:"products", items} · {type:"error", message} · {type:"done"}
// Постачальник ШІ — з .env: AI_PROVIDER="gemini" (тест, безкоштовно) або Claude за замовчуванням.

const MAX_STEPS = 6; // скільки разів поспіль модель може викликати інструменти за одну відповідь
const MAX_MESSAGE_CHARS = 1000;
const WEEKDAYS = ["неділя", "понеділок", "вівторок", "середа", "четвер", "пʼятниця", "субота"];


export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const json = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });

  if (!message) return json(400, "Напишіть питання");
  if (message.length > MAX_MESSAGE_CHARS) return json(400, `Повідомлення задовге (до ${MAX_MESSAGE_CHARS} символів)`);
  if (!(await hit(`assistant:${clientIp(req.headers)}`, 40, 60 * 60 * 1000))) {
    return json(429, "Ви надіслали багато повідомлень. Спробуйте пізніше.");
  }

  const provider = currentProvider();
  let conv = getConversation(body?.conversationId);
  // Змінили постачальника в .env — історії несумісні, починаємо нову розмову
  if (!conv || conv.provider !== provider) conv = createConversation(provider);
  if (conv.busy) return json(409, "Помічник ще відповідає на попереднє повідомлення");
  if (conv.userTurns >= MAX_USER_TURNS) return json(409, "Розмова задовга — почніть нову (кнопка «Нова розмова»)");

  const user = await getCurrentUser();
  const isPlus = isPlusFor(user);
  const today = todayISO();
  const weekday = WEEKDAYS[new Date(today + "T12:00:00Z").getUTCDay()];
  // Змінний контекст — у повідомленні користувача, а не в системному промпті
  const contextText = `[Контекст сайту: сьогодні ${today} (${weekday}); ${
    user ? `користувач увійшов${isPlus ? ", DBJU+ активна" : ""}` : "користувач не увійшов"
  }]`;

  conv.busy = true;
  conv.userTurns++;
  conv.updatedAt = Date.now();

  const conversation = conv;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const send = (obj: unknown) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        } catch {
          open = false; // користувач закрив вікно — дорахуємо і збережемо відповідь без відправки
        }
      };

      send({ type: "conversation", id: conversation.id, provider });
      const ctx: TurnContext = { message, contextText, isPlus, maxSteps: MAX_STEPS, send };

      try {
        const fullText = provider === "gemini" ? await runGeminiTurn(conversation, ctx) : await runAnthropicTurn(conversation, ctx);

        // Картки товарів, на які помічник дав посилання
        const ids = [...new Set([...fullText.matchAll(/\/product\/([A-Za-z0-9-]{1,64})/g)].map((m) => m[1]))];
        const items = ids.map((id) => conversation.cards.get(id)).filter((c): c is ProductCardData => Boolean(c));
        if (items.length) send({ type: "products", items: items.slice(0, 6) });
      } catch (e) {
        console.error("Помилка помічника:", e);
        const friendly = provider === "gemini" ? geminiError(e) : anthropicError(e);
        send({ type: "error", message: friendly ?? "Щось пішло не так. Спробуйте ще раз." });
      } finally {
        conversation.busy = false;
        conversation.updatedAt = Date.now();
        send({ type: "done" });
        if (open) {
          try {
            controller.close();
          } catch {
            // вже закрито
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
