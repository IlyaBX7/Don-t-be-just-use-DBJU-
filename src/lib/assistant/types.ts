// Спільні типи для постачальників ШІ помічника

export type AssistantProvider = "anthropic" | "gemini";

export interface TurnContext {
  message: string; // питання користувача
  contextText: string; // змінний контекст: дата, чи увійшов користувач
  isPlus: boolean;
  maxSteps: number;
  send: (event: unknown) => void;
}

// Постачальник обирається в .env: AI_PROVIDER="gemini" для тестів (безкоштовний тариф), інакше — Claude
export function currentProvider(): AssistantProvider {
  return process.env.AI_PROVIDER === "gemini" ? "gemini" : "anthropic";
}
