"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";

// Нижня панель навігації на телефоні (на широких екранах прихована — там є меню в хедері)
const ITEMS = [
  { href: "/catalog", icon: "🔎", label: "Каталог", match: (p: string) => p === "/" || p.startsWith("/catalog") || p.startsWith("/product") },
  { href: "/rentals", icon: "📦", label: "Оренди", match: (p: string) => p.startsWith("/rentals") },
  { href: "/rent-out", icon: "➕", label: "Здати", match: (p: string) => p.startsWith("/rent-out") },
  { href: "/requests", icon: "🙋", label: "Запити", match: (p: string) => p.startsWith("/requests") },
  { href: "/profile", icon: "👤", label: "Профіль", match: (p: string) => p.startsWith("/profile") || p.startsWith("/admin") },
];

export const MobileNav = () => {
  const pathname = usePathname() ?? "/";
  const { stats } = useApp();
  return (
    <nav className="dbju-mobile-nav" aria-label="Основне меню">
      {ITEMS.map((it) => {
        const badge = it.href === "/rentals" ? stats?.activeRentals : it.href === "/profile" ? stats?.ownerActionNeeded : 0;
        return (
          <Link key={it.href} href={it.href} className={it.match(pathname) ? "active" : ""} aria-current={it.match(pathname) ? "page" : undefined}>
            <span className="dbju-mobile-nav-icon" aria-hidden>
              {it.icon}
              {badge ? <span className="dbju-mobile-nav-badge">{badge}</span> : null}
            </span>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
