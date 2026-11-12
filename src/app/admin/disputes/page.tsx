"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../../components/AdminShell";
import { useApp } from "../../../components/AppProvider";
import { EmptyState, ErrorBox } from "../../../components/LoginRequired";
import { PhotoStrip } from "../../../components/PhotoPicker";
import { api } from "../../../lib/api";
import { formatDateTime, formatRange } from "../../../lib/dates";
import type { Booking } from "../../../types/booking";

const INSURANCE_LIMIT = 20000;

export default function AdminDisputes() {
  const { user } = useApp();
  const [status, setStatus] = useState("CONTESTED");
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api<Booking[]>(`/api/admin/disputes?status=${status}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    }
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження даних з API
    if (user?.role === "ADMIN") load();
  }, [user, load]);

  return (
    <AdminShell title="Суперечки">
      <div className="dbju-rentals-tabs">
        {[["CONTESTED", "На розгляд"], ["OPEN", "Чекають орендаря"], ["RESOLVED", "Вирішені"]].map(([k, l]) => (
          <button key={k} type="button" className={`dbju-rentals-tab-btn ${status === k ? "active" : ""}`} onClick={() => setStatus(k)}>{l}</button>
        ))}
      </div>
      {error && <ErrorBox message={error} />}
      {rows?.length === 0 ? (
        <EmptyState icon="🤝" title="Суперечок немає" text="Тут з'являються випадки, коли орендар не згоден з претензією власника." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {rows?.map((b) => <DisputeCard key={b.id} b={b} onDone={load} />)}
        </div>
      )}
    </AdminShell>
  );
}

function DisputeCard({ b, onDone }: { b: Booking; onDone: () => void }) {
  const d = b.dispute!;
  const [amount, setAmount] = useState(String(d.claimAmount));
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sum = Math.max(0, Math.round(Number(amount) || 0));
  const fromDeposit = Math.min(sum, b.depositAmount);
  const fromFund = Math.min(Math.max(0, sum - b.depositAmount), INSURANCE_LIMIT);

  const resolve = async () => {
    if (!window.confirm(`Ухвалити рішення: компенсація ${sum} ₴?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/disputes/${b.id}`, { method: "PATCH", json: { amount: sum, resolution: text } });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dbju-active-rental-card" style={{ gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div>
          <Link href={`/product/${b.product.id}`} style={{ fontWeight: 900, fontSize: "17px" }}>{b.product.name}</Link>
          <div className="dbju-settings-hint" style={{ margin: 0 }}>
            {formatRange(b.startDate, b.endDate)} · {b.code} · власник <Link href={`/users/${b.owner.id}`}>{b.owner.name}</Link> · орендар <Link href={`/users/${b.renter.id}`}>{b.renter.name}</Link>
          </div>
        </div>
        <strong>Претензія: {d.claimAmount} ₴ · застава {b.depositAmount} ₴</strong>
      </div>
      <div className="dbju-dispute-box">
        <strong>Власник ({formatDateTime(d.createdAt)}):</strong>
        <span style={{ whiteSpace: "pre-line" }}>{d.reason}</span>
        <PhotoStrip title="Фото пошкодження" photos={d.photos} />
      </div>
      {d.renterResponse && (
        <div className="dbju-dispute-box resolved">
          <strong>Орендар:</strong>
          <span style={{ whiteSpace: "pre-line" }}>{d.renterResponse}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
        <PhotoStrip title="Власник при передачі" photos={b.handoverPhotos} />
        <PhotoStrip title="Орендар при отриманні" photos={b.pickupPhotos} />
        <PhotoStrip title="Фотозвіт повернення" photos={b.returnPhoto ? [b.returnPhoto] : []} />
      </div>
      {d.status === "RESOLVED" ? (
        <div className="dbju-dispute-box resolved">
          <strong>Рішення: {d.awardedFromDeposit + d.awardedFromFund} ₴</strong>
          <span>Із застави {d.awardedFromDeposit} ₴, страховий фонд {d.awardedFromFund} ₴. {d.resolution}</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <label className="dbju-filter-label">
              Компенсація власнику, ₴
              <input type="number" min={0} max={d.claimAmount} value={amount} onChange={(e) => setAmount(e.target.value)} className="dbju-form-input" style={{ maxWidth: "160px" }} />
            </label>
            <span className="dbju-settings-hint" style={{ margin: 0 }}>
              із застави {fromDeposit} ₴ · страховий фонд {fromFund} ₴ · орендарю повернеться {b.depositAmount - fromDeposit} ₴
            </span>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Пояснення рішення (бачать обидві сторони)" className="dbju-form-input" style={{ resize: "vertical", fontFamily: "inherit" }} />
          {error && <ErrorBox message={error} />}
          <button type="button" className="dbju-btn-primary" style={{ alignSelf: "flex-start" }} disabled={busy || text.trim().length < 5 || d.status !== "CONTESTED"} onClick={resolve}>
            {d.status === "CONTESTED" ? "Ухвалити рішення" : "Чекаємо відповіді орендаря"}
          </button>
        </div>
      )}
    </div>
  );
}
