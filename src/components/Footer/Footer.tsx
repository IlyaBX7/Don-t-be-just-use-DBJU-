import React from "react";
import Link from "next/link";
import { ShieldCheckIcon, CheckIcon } from "../Icons";
import { CATEGORY_LIST } from "../../lib/categories";

export const Footer = () => {
  return (
    <footer className="dbju-footer">
      <div className="dbju-footer-container">
        {/* Brand Col */}
        <div className="dbju-footer-brand">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="dbju-logo-pill">DBJU</div>
            <span style={{ fontWeight: "800", fontSize: "16px" }}>Don&apos;t Buy, Just Use</span>
          </div>

          <p className="dbju-footer-desc">
            Українська платформа шерингу та оренди речей нового покоління. 
            Орендуйте в сусідів, забирайте самі або кур&apos;єром та заробляйте на речах, 
            що лежать удома без діла.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="dbju-diia-badge">
              <CheckIcon size={12} />
              <span>Верифікація через Дію</span>
            </div>
            <div className="dbju-diia-badge" style={{ background: "#EEF2F6", color: "#334155" }}>
              <ShieldCheckIcon size={12} />
              <span>Захист до 20 000 ₴</span>
            </div>
          </div>
        </div>

        {/* Links Col 1: Каталог */}
        <div className="dbju-footer-col">
          <h4 className="dbju-footer-title">Каталог</h4>
          <ul className="dbju-footer-links">
            {CATEGORY_LIST.filter((c) => c.featured).map((c) => (
              <li key={c.key}><Link href={`/catalog?cat=${c.key}`}>{c.longLabel}</Link></li>
            ))}
            <li><Link href="/catalog">Усі категорії →</Link></li>
          </ul>
        </div>

        {/* Links Col 2: Як це працює */}
        <div className="dbju-footer-col">
          <h4 className="dbju-footer-title">Сервіс</h4>
          <ul className="dbju-footer-links">
            <li><Link href="/rentals">Мої оренди</Link></li>
            <li><Link href="/profile/listings">Мої оголошення</Link></li>
            <li><Link href="/requests">Запити на речі</Link></li>
            <li><Link href="/profile/referrals">Запросіть друзів</Link></li>
            <li><Link href="/help#how-it-works">Як працює оренда</Link></li>
            <li><Link href="/help#insurance">Програма захисту DBJU</Link></li>
            <li><Link href="/help#ai-photo">Фотозвіт повернення</Link></li>
            <li><Link href="/help#rent-out">Як здати свою річ</Link></li>
          </ul>
        </div>

        {/* Links Col 3: Довіра та підтримка */}
        <div className="dbju-footer-col">
          <h4 className="dbju-footer-title">Підтримка</h4>
          <ul className="dbju-footer-links">
            <li><a href="mailto:support@dbju.ua">support@dbju.ua</a></li>
            <li><Link href="/help#faq">Часті запитання (FAQ)</Link></li>
            <li><Link href="/legal/terms">Правила користування</Link></li>
            <li><Link href="/legal/privacy">Політика конфіденційності</Link></li>
          </ul>
        </div>
      </div>

      <div className="dbju-footer-bottom">
        <div>© 2026 DBJU. Не купуй. Користуйся. Всі права захищено.</div>
        <div style={{ display: "flex", gap: "16px" }}>
          <span>Підтримка 24/7</span>
        </div>
      </div>
    </footer>
  );
};
