"use client";

import React from "react";
import Link from "next/link";
import { CategoryIcon } from "./CategoryIcon";
import { SparkleIcon } from "./Icons";
import { ALL_CATEGORIES_PROMO, CATEGORY_PROMOS, isCategoryKey } from "../lib/categories";
import type { Product } from "../types/product";

interface Props {
  category: string; // "all" або ключ категорії
  products: Product[] | null; // увесь каталог (null — ще завантажується)
  onShowItems: () => void;
}

function pluralItems(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "річ";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "речі";
  return "речей";
}

// Інформаційна картка над каталогом: що можна знайти в обраній категорії
export const CategoryPromoCard = ({ category, products, onShowItems }: Props) => {
  const key = isCategoryKey(category) ? category : null;
  const promo = key ? CATEGORY_PROMOS[key] : ALL_CATEGORIES_PROMO;

  const items = products ? (key ? products.filter((p) => p.categoryKey === key) : products) : null;
  const count = items?.length ?? 0;
  const minPrice = items && count > 0 ? Math.min(...items.map((p) => p.rentalPricePerDay)) : null;
  const rentOutHref = key ? `/rent-out?category=${key}` : "/rent-out";

  return (
    <div className="dbju-promo-card" key={category}>
      <div className="dbju-promo-content">
        <span className="dbju-promo-badge">{promo.badge.toUpperCase()}</span>
        <h3 className="dbju-promo-title">{promo.title}</h3>
        <p className="dbju-promo-desc">{promo.text}</p>

        <div className="dbju-promo-tags" aria-label="Що тут орендують">
          {promo.examples.map((e) => (
            <span key={e} className="dbju-promo-tag">{e}</span>
          ))}
        </div>

        {items && (
          <p className="dbju-promo-stats">
            {count > 0 ? (
              <>
                Зараз доступно <strong>{count} {pluralItems(count)}</strong>
                {minPrice !== null && <> · від <strong>{minPrice} ₴ / доба</strong></>}
              </>
            ) : (
              <>Тут поки немає жодної речі — станьте першим, хто здасть річ у цій категорії.</>
            )}
          </p>
        )}

        <div className="dbju-promo-actions">
          {count > 0 ? (
            <button
              type="button"
              onClick={onShowItems}
              className="dbju-btn-primary"
              style={{ background: "var(--brand-lime)", color: "#111A14", padding: "12px 24px" }}
            >
              Переглянути {count} {pluralItems(count)}
            </button>
          ) : (
            <Link
              href={rentOutHref}
              className="dbju-btn-primary"
              style={{ background: "var(--brand-lime)", color: "#111A14", padding: "12px 24px" }}
            >
              Здати першу річ
            </Link>
          )}
          {count > 0 && (
            <Link href={rentOutHref} className="dbju-promo-link">
              Маєте таку річ? Здайте її і заробляйте →
            </Link>
          )}
        </div>
      </div>

      <div className="dbju-promo-graphic">
        {key ? <CategoryIcon categoryKey={key} size={48} /> : <SparkleIcon size={44} />}
      </div>
    </div>
  );
};
