"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../components/AdminShell";
import { useApp } from "../../components/AppProvider";
import { ErrorBox } from "../../components/LoginRequired";
import { api } from "../../lib/api";

interface Overview {
  users: number; blocked: number; listings: number; hidden: number; openReports: number;
  contested: number; openDisputes: number; overdue: number; activeRentals: number;
}

export default function AdminHome() {
  const { user } = useApp();
  const [d, setD] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user?.role === "ADMIN") api<Overview>("/api/admin/overview").then(setD).catch((e) => setError(e.message));
  }, [user]);

  const tiles = d
    ? [
        { label: "Суперечки на розгляд", value: d.contested, href: "/admin/disputes", alert: d.contested > 0 },
        { label: "Нові скарги", value: d.openReports, href: "/admin/reports", alert: d.openReports > 0 },
        { label: "Прострочені повернення", value: d.overdue, href: "/admin/disputes", alert: d.overdue > 0 },
        { label: "Суперечки: чекають орендаря", value: d.openDisputes, href: "/admin/disputes" },
        { label: "Активні оренди", value: d.activeRentals, href: "/admin/finance" },
        { label: "Оголошень (приховано)", value: `${d.listings} (${d.hidden})`, href: "/admin/listings" },
        { label: "Користувачів (заблоковано)", value: `${d.users} (${d.blocked})`, href: "/admin/users" },
      ]
    : [];

  return (
    <AdminShell title="Огляд">
      {error && <ErrorBox message={error} />}
      <div className="dbju-kpi-row" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="dbju-kpi" style={t.alert ? { borderColor: "#FCA5A5", background: "#FEF2F2" } : undefined}>
            <span className="dbju-kpi-label">{t.label}</span>
            <strong className="dbju-kpi-value">{t.value}</strong>
            {t.alert && <span className="dbju-kpi-delta bad">▲ потребує уваги</span>}
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
