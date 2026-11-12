"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductThumb } from "./ProductThumb";
import { formatDay } from "../lib/dates";

interface ProductCard {
  id: string;
  name: string;
  pricePerDay: number;
  categoryKey: string;
  accentColor: string;
  image: string | null;
  location: string;
  rentedUntil: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  status?: string | null;
  products?: ProductCard[];
  error?: boolean;
}

const STORAGE_KEY = "dbju-assistant";
const SUGGESTIONS = [
  "Що взяти в похід на вихідні?",
  "Потрібен перфоратор до 200 ₴ на добу",
  "Скільки коштуватиме оренда на 3 дні?",
  "Як працює застава?",
];
const WELCOME: ChatMessage = {
  role: "assistant",
  text: "Привіт! Я помічник DBJU 👋 Підберу потрібну річ, підкажу, що знадобиться для справи, і порахую вартість оренди. Що шукаєте?",
};

/* ---------- Міні-Markdown: абзаци, списки, **жирний**, внутрішні посилання ---------- */

function renderInline(text: string, onNavigate: () => void, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(<strong key={`${keyBase}-b${i++}`}>{m[1]}</strong>);
    } else {
      const href = m[3];
      // Лише внутрішні посилання сайту — зовнішні показуємо як текст
      if (/^\/(?!\/)[\w\-/?=&%.#]*$/.test(href)) {
        out.push(
          <Link key={`${keyBase}-l${i++}`} href={href} onClick={onNavigate} className="dbju-chat-link">
            {m[2]}
          </Link>
        );
      } else {
        out.push(m[2]);
      }
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Markdown({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      const k = `p${blocks.length}`;
      blocks.push(<p key={k}>{renderInline(para.join(" "), onNavigate, k)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const k = `l${blocks.length}`;
      const items = list.items.map((it, j) => <li key={j}>{renderInline(it, onNavigate, `${k}-${j}`)}</li>);
      blocks.push(list.ordered ? <ol key={k}>{items}</ol> : <ul key={k}>{items}</ul>);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1].replace(/^#+\s*/, ""));
    } else if (!line) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.replace(/^#+\s*/, ""));
    }
  }
  flushPara();
  flushList();
  return <>{blocks}</>;
}

/* ---------- Віджет ---------- */

export const AssistantWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const restored = useRef(false);

  // Розмова переживає перехід між сторінками (віджет у layout) і оновлення вкладки (sessionStorage)
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved?.messages?.length) {
        setMessages(saved.messages);
        setConversationId(saved.conversationId ?? null);
      }
    } catch {
      // сховище недоступне — починаємо з нуля
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current || busy) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: messages.slice(-40), conversationId }));
    } catch {
      // ігноруємо
    }
  }, [messages, conversationId, busy]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const updateLast = (fn: (m: ChatMessage) => ChatMessage) =>
    setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      setInput("");
      setBusy(true);
      setMessages((prev) => [...prev, { role: "user", text: q }, { role: "assistant", text: "", status: "Думаю…" }]);

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message: q }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Помічник зараз недоступний");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            const ev = JSON.parse(line);
            if (ev.type === "conversation") {
              setConversationId(ev.id);
              setProvider(ev.provider ?? null);
            }
            else if (ev.type === "status") updateLast((m) => ({ ...m, status: ev.text }));
            else if (ev.type === "text") updateLast((m) => ({ ...m, text: m.text + ev.text, status: null }));
            else if (ev.type === "products") updateLast((m) => ({ ...m, products: ev.items }));
            else if (ev.type === "error") updateLast((m) => ({ ...m, text: m.text ? `${m.text}\n\n${ev.message}` : ev.message, error: true, status: null }));
          }
        }
        updateLast((m) => ({ ...m, status: null, text: m.text || "Не вдалося отримати відповідь. Спробуйте ще раз.", error: m.error || !m.text }));
      } catch (e) {
        updateLast((m) => ({ ...m, status: null, error: true, text: e instanceof Error ? e.message : "Помічник зараз недоступний" }));
        if (e instanceof Error && /задовга/.test(e.message)) setConversationId(null);
      } finally {
        setBusy(false);
      }
    },
    [busy, conversationId]
  );

  const reset = () => {
    if (busy) return;
    setMessages([WELCOME]);
    setConversationId(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ігноруємо
    }
  };

  // На телефоні панель на весь екран — закриваємо при переході за посиланням
  const onNavigate = () => {
    if (window.matchMedia("(max-width: 600px)").matches) setOpen(false);
  };

  const onlyWelcome = messages.length === 1;

  return (
    <>
      {open && (
        <section className="dbju-chat-panel" role="dialog" aria-label="Помічник DBJU">
          <header className="dbju-chat-head">
            <div className="dbju-chat-avatar" aria-hidden>✦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="dbju-chat-title">Помічник DBJU</div>
              <div className="dbju-chat-sub">
                {busy ? "друкує…" : provider === "gemini" ? "Тестовий режим · Google Gemini" : "ШІ · підбір речей і розрахунки"}
              </div>
            </div>
            {!onlyWelcome && (
              <button type="button" className="dbju-chat-head-btn" onClick={reset} disabled={busy} title="Почати нову розмову">
                Нова розмова
              </button>
            )}
            <button type="button" className="dbju-chat-head-btn" onClick={() => setOpen(false)} aria-label="Закрити помічника">
              ✕
            </button>
          </header>

          <div className="dbju-chat-list" ref={listRef} aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`dbju-chat-msg ${m.role} ${m.error ? "error" : ""}`}>
                {m.role === "assistant" ? (
                  <>
                    {m.text && (
                      <div className="dbju-chat-bubble">
                        <Markdown text={m.text} onNavigate={onNavigate} />
                      </div>
                    )}
                    {m.status && (
                      <div className="dbju-chat-status">
                        <span className="dbju-chat-dots" aria-hidden><i /><i /><i /></span>
                        {m.status}
                      </div>
                    )}
                    {m.products && m.products.length > 0 && (
                      <div className="dbju-chat-products">
                        {m.products.map((p) => (
                          <Link key={p.id} href={`/product/${p.id}`} className="dbju-chat-product" onClick={onNavigate}>
                            <div className="dbju-chat-product-thumb" style={{ background: p.accentColor }}>
                              <ProductThumb image={p.image} categoryKey={p.categoryKey} iconSize={22} alt={p.name} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div className="dbju-chat-product-name">{p.name}</div>
                              <div className="dbju-chat-product-meta">
                                {p.pricePerDay} ₴ / доба
                                {p.rentedUntil ? ` · 🔒 до ${formatDay(p.rentedUntil)}` : ""}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="dbju-chat-bubble">{m.text}</div>
                )}
              </div>
            ))}

            {onlyWelcome && (
              <div className="dbju-chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} disabled={busy}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="dbju-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Наприклад: намет на 4 людей на вихідні"
              aria-label="Повідомлення помічнику"
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Надіслати">
              ➤
            </button>
          </form>
          <div className="dbju-chat-note">
            {provider === "gemini"
              ? "Тестовий режим: відповідає Google Gemini (безкоштовний тариф), розмови можуть використовуватися Google. Не пишіть особисті дані."
              : "Відповіді генерує ШІ — точні умови дивіться на сторінці речі."}
          </div>
        </section>
      )}

      <button
        type="button"
        className={`dbju-chat-fab ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Закрити помічника" : "Відкрити ШІ-помічника"}
      >
        <span className="dbju-chat-fab-ring" aria-hidden />
        <span className="dbju-chat-fab-icon" aria-hidden>{open ? "✕" : "✦"}</span>
        {!open && <span className="dbju-chat-fab-label">Помічник ШІ</span>}
      </button>
    </>
  );
};
