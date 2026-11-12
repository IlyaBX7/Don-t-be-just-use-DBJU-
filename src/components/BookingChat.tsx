"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/dates";
import { ErrorBox } from "./LoginRequired";
import { useApp } from "./AppProvider";

interface ChatMessage {
  id: string;
  text: string;
  mine: boolean;
  createdAt: string;
  readAt: string | null;
}

// Чат орендаря і власника в межах бронювання (оновлюється кожні 8 секунд, поки відкритий)
export function BookingChat({ bookingId, title, otherName, onClose }: { bookingId: string; title: string; otherName: string; onClose: () => void }) {
  const { refreshStats } = useApp();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setMessages(await api<ChatMessage[]>(`/api/bookings/${bookingId}/messages`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося завантажити повідомлення");
    }
  }, [bookingId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження повідомлень з API
    load().then(() => refreshStats());
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load, refreshStats]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      const m = await api<ChatMessage>(`/api/bookings/${bookingId}/messages`, { method: "POST", json: { text: t } });
      setMessages((prev) => [...(prev ?? []), m]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося надіслати");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dbju-booking-modal-overlay" onClick={onClose}>
      <div className="dbju-booking-modal dbju-booking-chat" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: "18px", fontWeight: 900 }}>Чат з {otherName}</h3>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          </div>
          <button type="button" className="dbju-btn-small" onClick={onClose} aria-label="Закрити чат">✕</button>
        </div>
        <div className="dbju-booking-chat-list" ref={listRef}>
          {!messages ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Завантаження…</p>
          ) : messages.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
              Домовтеся про час і місце передачі. Не переходьте в інші месенджери й не передавайте гроші напряму — інакше захист DBJU не діятиме.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`dbju-chat-msg ${m.mine ? "user" : "assistant"}`}>
                <div className="dbju-chat-bubble" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {formatDateTime(m.createdAt)}
                  {m.mine && (m.readAt ? " · прочитано" : "")}
                </span>
              </div>
            ))
          )}
        </div>
        {error && <ErrorBox message={error} />}
        <form onSubmit={send} className="dbju-chat-form" style={{ padding: 0, border: "none" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e);
              }
            }}
            rows={2}
            placeholder="Напишіть повідомлення…"
            aria-label="Повідомлення"
          />
          <button type="submit" disabled={busy || !text.trim()} aria-label="Надіслати">➤</button>
        </form>
      </div>
    </div>
  );
}
