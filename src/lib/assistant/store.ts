import crypto from "crypto";
import type Anthropic from "@anthropic-ai/sdk";
import type { Content } from "@google/genai";
import type { ProductCardData } from "./tools";
import type { AssistantProvider } from "./types";

// Розмови з помічником зберігаються на сервері, в пам'яті процесу, і лише ДОПОВНЮЮТЬСЯ:
// повна відповідь моделі (разом з блоками міркувань) повертається в історію без змін —
// так вимагає Claude Opus 5.5 («preserved thinking»), і так добре працює кеш промптів.
// Після перезапуску сервера розмови зникають — помічник просто почне нову.

export interface Conversation {
  id: string;
  provider: AssistantProvider; // розмова прив'язана до постачальника, на якому почалася
  messages: Anthropic.Beta.BetaMessageParam[]; // історія для Claude
  geminiContents: Content[]; // історія для Gemini
  userTurns: number;
  cards: Map<string, ProductCardData>; // товари, які інструменти вже повертали
  busy: boolean;
  updatedAt: number;
}

const TTL_MS = 2 * 60 * 60 * 1000; // 2 години без активності
const MAX_CONVERSATIONS = 1000;
export const MAX_USER_TURNS = 30;

const g = globalThis as unknown as {
  dbjuAssistant?: Map<string, Conversation>;
};
const conversations = (g.dbjuAssistant ??= new Map());

function cleanup() {
  const now = Date.now();
  for (const [id, c] of conversations) if (now - c.updatedAt > TTL_MS) conversations.delete(id);
  while (conversations.size > MAX_CONVERSATIONS) {
    const oldest = [...conversations.values()].sort((a, b) => a.updatedAt - b.updatedAt)[0];
    conversations.delete(oldest.id);
  }
}

export function getConversation(id: unknown): Conversation | null {
  cleanup();
  return typeof id === "string" ? conversations.get(id) ?? null : null;
}

export function createConversation(provider: AssistantProvider): Conversation {
  cleanup();
  const c: Conversation = {
    id: crypto.randomBytes(16).toString("hex"),
    provider,
    messages: [],
    geminiContents: [],
    userTurns: 0,
    cards: new Map(),
    busy: false,
    updatedAt: Date.now(),
  };
  conversations.set(c.id, c);
  return c;
}
