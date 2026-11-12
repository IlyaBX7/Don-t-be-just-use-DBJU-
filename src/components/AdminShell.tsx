"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer/Footer";
import { useApp } from "./AppProvider";
import { EmptyState, LoginRequired, PageLoading } from "./LoginRequired";

const NAV = [
  { href: "/admin", label: "Огляд" },
  { href: "/admin/disputes", label: "Суперечки" },
  { href: "/admin/reports", label: "Скарги" },
  { href: "/admin/listings", label: "Оголошення" },
  { href: "/admin/users", label: "Користувачі" },
  { href: "/admin/finance", label: "Фінанси" },
];

// Оболонка адмін-панелі: перевірка ролі та меню розділів
export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, loading } = useApp();
  const pathname = usePathname();
  if (loading) return <PageLoading />;
  return (
    <>
      <div className="dbju-page-container" style={{ maxWidth: "1100px" }}>
        <div className="dbju-admin-head">
          <span className="dbju-step-badge">АДМІН-ПАНЕЛЬ</span>
          <h1 className="dbju-main-title" style={{ fontSize: "30px" }}>{title}</h1>
        </div>
        {!user ? (
          <LoginRequired title="Увійдіть як адміністратор" text="Ця сторінка доступна лише адміністраторам DBJU." />
        ) : user.role !== "ADMIN" ? (
          <EmptyState icon="🔒" title="Доступ лише для адміністратора" text="Ця сторінка керує всією платформою." />
        ) : (
          <>
            <nav className="dbju-admin-nav">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={pathname === n.href ? "active" : ""}>{n.label}</Link>
              ))}
            </nav>
            {children}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
