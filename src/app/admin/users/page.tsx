"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../../components/AdminShell";
import { useApp } from "../../../components/AppProvider";
import { ErrorBox } from "../../../components/LoginRequired";
import { api } from "../../../lib/api";

interface AdminUser {
  id: string; name: string; email: string; phone: string | null; role: string; isVerified: boolean;
  rating: number; reviewsCount: number; blockedAt: string | null; blockedReason: string | null;
  createdAt: string; lastLoginAt: string | null;
  _count: { products: number; rentals: number; reportsAgainst: number };
}

export default function AdminUsers() {
  const { user } = useApp();
  const [q, setQ] = useState("");
  const [onlyBlocked, setOnlyBlocked] = useState(false);
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ q, ...(onlyBlocked ? { filter: "blocked" } : {}) });
      setRows(await api<AdminUser[]>(`/api/admin/users?${qs}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    }
  }, [q, onlyBlocked]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [user, load]);

  const act = async (u: AdminUser, action: "block" | "unblock") => {
    let reason = "";
    if (action === "block") {
      const r = window.prompt(`Заблокувати ${u.name}? Причина (бачить лише адмін):`, "");
      if (r === null) return;
      reason = r;
    }
    try {
      const res = await api<{ activeBookings?: number }>(`/api/admin/users/${u.id}`, { method: "PATCH", json: { action, reason } });
      if (res.activeBookings) window.alert(`Увага: у користувача ${res.activeBookings} активних оренд — перевірте їх.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    }
  };

  return (
    <AdminShell title="Користувачі">
      <div className="dbju-finance-controls">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук: ім'я, email, телефон" className="dbju-form-input" style={{ maxWidth: "340px" }} />
        <label className="dbju-filter-check"><input type="checkbox" checked={onlyBlocked} onChange={(e) => setOnlyBlocked(e.target.checked)} /> Лише заблоковані</label>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="dbju-table-wrap">
        <table className="dbju-finance-table dbju-admin-table">
          <thead><tr><th>Користувач</th><th>Контакти</th><th>Оголош.</th><th>Оренд</th><th>Скарг</th><th>Статус</th><th></th></tr></thead>
          <tbody>
            {rows?.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link href={`/users/${u.id}`} style={{ fontWeight: 800, color: "var(--text-primary)" }}>{u.name}</Link>
                  <div className="dbju-settings-hint" style={{ margin: 0 }}>
                    {u.role === "ADMIN" ? "адмін · " : ""}{u.isVerified ? "ДІЯ ✓ · " : ""}з {new Date(u.createdAt).toLocaleDateString("uk-UA")}
                  </div>
                </td>
                <td>{u.email}<div className="dbju-settings-hint" style={{ margin: 0 }}>{u.phone ?? "—"}</div></td>
                <td>{u._count.products}</td>
                <td>{u._count.rentals}</td>
                <td style={u._count.reportsAgainst ? { color: "#B91C1C", fontWeight: 800 } : undefined}>{u._count.reportsAgainst}</td>
                <td>{u.blockedAt ? <span className="dbju-status-pill cancelled" title={u.blockedReason ?? ""}>Заблоковано</span> : <span className="dbju-status-pill picked">Активний</span>}</td>
                <td>
                  {u.role !== "ADMIN" && (u.blockedAt ? (
                    <button type="button" className="dbju-btn-small" onClick={() => act(u, "unblock")}>Розблокувати</button>
                  ) : (
                    <button type="button" className="dbju-btn-small danger" onClick={() => act(u, "block")}>Заблокувати</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
