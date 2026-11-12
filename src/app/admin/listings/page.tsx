"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../../components/AdminShell";
import { useApp } from "../../../components/AppProvider";
import { ErrorBox } from "../../../components/LoginRequired";
import { ProductThumb } from "../../../components/ProductThumb";
import { api } from "../../../lib/api";
import type { Product } from "../../../types/product";

type AdminProduct = Product & { openReports: number; ownerBlocked: boolean };

export default function AdminListings() {
  const { user } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [reported, setReported] = useState(false);
  const [rows, setRows] = useState<AdminProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ q, ...(status ? { status } : {}), ...(reported ? { reported: "1" } : {}) });
      setRows(await api<AdminProduct[]>(`/api/admin/listings?${qs}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    }
  }, [q, status, reported]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [user, load]);

  const toggle = async (p: AdminProduct) => {
    try {
      await api(`/api/products/${p.id}`, { method: "PATCH", json: { status: p.status === "HIDDEN" ? "AVAILABLE" : "HIDDEN" } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    }
  };
  const remove = async (p: AdminProduct) => {
    if (!window.confirm(`Видалити «${p.name}» назавжди?`)) return;
    try {
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    }
  };

  return (
    <AdminShell title="Оголошення">
      <div className="dbju-finance-controls">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук: назва, опис, власник" className="dbju-form-input" style={{ maxWidth: "320px" }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="dbju-form-input" style={{ maxWidth: "200px" }}>
          <option value="">Усі статуси</option>
          <option value="AVAILABLE">Активні</option>
          <option value="RENTED">В оренді</option>
          <option value="HIDDEN">Приховані</option>
        </select>
        <label className="dbju-filter-check"><input type="checkbox" checked={reported} onChange={(e) => setReported(e.target.checked)} /> Зі скаргами</label>
      </div>
      {error && <ErrorBox message={error} />}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {rows?.map((p) => (
          <div key={p.id} className="dbju-list-card">
            <div className="dbju-list-thumb" style={{ background: p.accentColor }}>
              <ProductThumb image={p.images[0]} categoryKey={p.categoryKey} iconSize={26} />
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <Link href={`/product/${p.id}`} style={{ fontWeight: 800 }}>{p.name}</Link>
              <div className="dbju-settings-hint" style={{ margin: 0 }}>
                {p.category} · {p.rentalPricePerDay} ₴/доба · {p.location} · власник <Link href={`/users/${p.ownerId}`}>{p.ownerName}</Link>
                {p.ownerBlocked && " (заблокований)"}
              </div>
            </div>
            {p.openReports > 0 && <span className="dbju-status-pill cancelled">Скарг: {p.openReports}</span>}
            <span className={`dbju-status-pill ${p.status === "HIDDEN" ? "hidden" : p.status === "RENTED" ? "picked" : "paid"}`}>
              {p.status === "HIDDEN" ? "Приховано" : p.status === "RENTED" ? "В оренді" : "Активне"}
            </span>
            <button type="button" className="dbju-btn-small" onClick={() => toggle(p)}>{p.status === "HIDDEN" ? "Показати" : "Сховати"}</button>
            <button type="button" className="dbju-btn-small danger" onClick={() => remove(p)}>Видалити</button>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
