"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/dates";
import { useApp } from "./AppProvider";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const ICON: Record<string, string> = {
  NEW_BOOKING: "🗓️", CANCELLED: "✖️", PICKUP: "📦", RETURN: "↩️", COMPLETED: "✅", EXTENDED: "➕",
  DISPUTE: "⚠️", MESSAGE: "💬", REMINDER: "⏰", OVERDUE: "⏰", BONUS: "🎁", REQUEST_OFFER: "🙋", HANDOVER: "📸", ADMIN: "🛡️",
};

// Дзвіночок у хедері: останні сповіщення, позначення прочитаними
export const NotificationBell = () => {
  const { user, stats, refreshStats } = useApp();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const unread = stats?.unreadNotifications ?? 0;

  useEffect(() => {
    if (!open) return;
    api<{ items: Notification[] }>("/api/notifications")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;

  const markAll = async () => {
    await api("/api/notifications", { method: "PATCH", json: {} }).catch(() => {});
    setItems((prev) => prev?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? null);
    refreshStats();
  };

  const openItem = async (n: Notification) => {
    setOpen(false);
    if (!n.readAt) {
      await api("/api/notifications", { method: "PATCH", json: { ids: [n.id] } }).catch(() => {});
      refreshStats();
    }
  };

  return (
    <div className="dbju-bell" ref={box}>
      <button
        type="button"
        className="dbju-round-icon-btn"
        title="Сповіщення"
        aria-label={unread ? `Сповіщення: ${unread} непрочитаних` : "Сповіщення"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative" }}
      >
        <span aria-hidden style={{ fontSize: "18px" }}>🔔</span>
        {unread > 0 && (
          <span className="dbju-badge-count" style={{ position: "absolute", top: "-4px", right: "-4px" }}>{unread > 99 ? "99+" : unread}</span>
        )}
      </button>
      {open && (
        <div className="dbju-bell-panel" role="dialog" aria-label="Сповіщення">
          <div className="dbju-bell-head">
            <strong>Сповіщення</strong>
            {unread > 0 && (
              <button type="button" onClick={markAll}>Прочитати всі</button>
            )}
          </div>
          <div className="dbju-bell-list">
            {!items ? (
              <p className="dbju-bell-empty">Завантаження…</p>
            ) : items.length === 0 ? (
              <p className="dbju-bell-empty">Поки що сповіщень немає. Тут з&apos;являться бронювання, повідомлення й нагадування.</p>
            ) : (
              items.map((n) => {
                const content = (
                  <>
                    <span className="dbju-bell-icon" aria-hidden>{ICON[n.type] ?? "🔔"}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="dbju-bell-title">{n.title}</span>
                      {n.body && <span className="dbju-bell-body">{n.body}</span>}
                      <span className="dbju-bell-time">{formatDateTime(n.createdAt)}</span>
                    </span>
                    {!n.readAt && <span className="dbju-bell-dot" aria-label="непрочитане" />}
                  </>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} className={`dbju-bell-item ${n.readAt ? "" : "unread"}`} onClick={() => openItem(n)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id} className={`dbju-bell-item ${n.readAt ? "" : "unread"}`} onClick={() => openItem(n)}>
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
