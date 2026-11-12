"use client";

import React, { useState } from "react";
import { api } from "../lib/api";
import { REPORT_REASONS } from "../lib/reports";
import { useApp } from "./AppProvider";
import { ErrorBox } from "./LoginRequired";

// «Поскаржитися» на оголошення або користувача
export const ReportButton = ({ productId, userId, label = "Поскаржитися" }: { productId?: string; userId?: string; label?: string }) => {
  const { user, openAuth } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && (user.id === userId)) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/reports", { method: "POST", json: { productId, userId, reason, details } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося надіслати скаргу");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="dbju-report-link"
        onClick={() => (user ? setOpen(true) : openAuth("LOGIN"))}
      >
        ⚑ {label}
      </button>
      {open && (
        <div className="dbju-booking-modal-overlay" onClick={() => setOpen(false)}>
          <div className="dbju-booking-modal" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "20px", fontWeight: 900 }}>{productId ? "Скарга на оголошення" : "Скарга на користувача"}</h3>
            {done ? (
              <>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Дякуємо! Модератор DBJU перевірить скаргу найближчим часом.</p>
                <button type="button" className="dbju-btn-primary" onClick={() => setOpen(false)}>Готово</button>
              </>
            ) : (
              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(REPORT_REASONS).map(([k, v]) => (
                  <label key={k} className="dbju-filter-check">
                    <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k)} required />
                    {v}
                  </label>
                ))}
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Деталі (необов'язково)"
                  className="dbju-form-input"
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                />
                {error && <ErrorBox message={error} />}
                <button type="submit" className="dbju-btn-primary" disabled={busy || !reason}>
                  {busy ? "Надсилаємо…" : "Надіслати скаргу"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
