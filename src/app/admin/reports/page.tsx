"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../../components/AdminShell";
import { useApp } from "../../../components/AppProvider";
import { EmptyState, ErrorBox } from "../../../components/LoginRequired";
import { api } from "../../../lib/api";

interface AdminReport {
  id: string; targetType: "PRODUCT" | "USER"; reasonLabel: string; details: string | null; status: string;
  adminNote: string | null; createdAt: string;
  reporter: { id: string; name: string };
  targetUser: { id: string; name: string; blockedAt: string | null } | null;
  product: { id: string; name: string; status: string } | null;
}

export default function AdminReports() {
  const { user } = useApp();
  const [status, setStatus] = useState("OPEN");
  const [rows, setRows] = useState<AdminReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api<AdminReport[]>(`/api/admin/reports?status=${status}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    }
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження даних з API
    if (user?.role === "ADMIN") load();
  }, [user, load]);

  const close = async (r: AdminReport, s: "RESOLVED" | "DISMISSED") => {
    const note = window.prompt(s === "RESOLVED" ? "Що зроблено? (напр., оголошення приховано)" : "Чому відхилено?", "") ?? "";
    try {
      await api(`/api/admin/reports/${r.id}`, { method: "PATCH", json: { status: s, note } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    }
  };
  const hideProduct = async (r: AdminReport) => {
    if (!r.product) return;
    await api(`/api/products/${r.product.id}`, { method: "PATCH", json: { status: "HIDDEN" } }).catch((e) => setError(e.message));
    load();
  };

  return (
    <AdminShell title="Скарги">
      <div className="dbju-rentals-tabs">
        {[["OPEN", "Нові"], ["RESOLVED", "Вирішені"], ["DISMISSED", "Відхилені"]].map(([k, l]) => (
          <button key={k} type="button" className={`dbju-rentals-tab-btn ${status === k ? "active" : ""}`} onClick={() => setStatus(k)}>{l}</button>
        ))}
      </div>
      {error && <ErrorBox message={error} />}
      {rows?.length === 0 ? (
        <EmptyState icon="✅" title="Скарг немає" text="Тут з'являтимуться скарги користувачів на оголошення та інших користувачів." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rows?.map((r) => (
            <div key={r.id} className="dbju-review-card">
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span className="dbju-status-pill cancelled">{r.reasonLabel}</span>
                <span className="dbju-settings-hint" style={{ margin: 0 }}>
                  від <Link href={`/users/${r.reporter.id}`}>{r.reporter.name}</Link> · {new Date(r.createdAt).toLocaleString("uk-UA")}
                </span>
              </div>
              <div style={{ fontSize: "14px" }}>
                {r.product ? (
                  <>Оголошення: <Link href={`/product/${r.product.id}`} style={{ fontWeight: 800 }}>{r.product.name}</Link>{r.product.status === "HIDDEN" && " (приховано)"} · </>
                ) : null}
                Користувач: {r.targetUser ? <Link href={`/users/${r.targetUser.id}`} style={{ fontWeight: 800 }}>{r.targetUser.name}</Link> : "—"}
                {r.targetUser?.blockedAt && " (заблокований)"}
              </div>
              {r.details && <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{r.details}</p>}
              {r.adminNote && <p className="dbju-settings-hint" style={{ margin: 0 }}>Нотатка: {r.adminNote}</p>}
              {r.status === "OPEN" && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {r.product && r.product.status !== "HIDDEN" && <button type="button" className="dbju-btn-small danger" onClick={() => hideProduct(r)}>Сховати оголошення</button>}
                  {r.targetUser && <Link href="/admin/users" className="dbju-btn-small">До користувачів (блокування)</Link>}
                  <button type="button" className="dbju-btn-small primary" onClick={() => close(r, "RESOLVED")}>Вирішено</button>
                  <button type="button" className="dbju-btn-small" onClick={() => close(r, "DISMISSED")}>Відхилити</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
