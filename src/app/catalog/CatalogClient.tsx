"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { BookingModal } from "../../components/BookingModal";
import { Footer } from "../../components/Footer/Footer";
import { CategoryIcon } from "../../components/CategoryIcon";
import { EmptyState, ErrorBox } from "../../components/LoginRequired";
import { SearchIcon } from "../../components/Icons";
import { api } from "../../lib/api";
import { CATEGORY_BY_KEY, CATEGORY_LIST } from "../../lib/categories";
import { formatDay, todayISO, addDays } from "../../lib/dates";
import type { Product } from "../../types/product";

export interface CatalogFilters {
  cat: string;
  q: string;
  minPrice: string;
  maxPrice: string;
  from: string;
  to: string;
  available: boolean;
  verified: boolean;
  minRating: string;
  city: string;
  sort: string;
}

interface SearchResult {
  items: Product[];
  total: number;
  page: number;
  pages: number;
  categoryCounts: Record<string, number>;
  allCount: number;
  priceMin: number;
  priceMax: number;
  cities: { city: string; count: number }[];
}

const DEFAULTS: CatalogFilters = {
  cat: "all",
  q: "",
  minPrice: "",
  maxPrice: "",
  from: "",
  to: "",
  available: false,
  verified: false,
  minRating: "",
  city: "",
  sort: "new",
};

const SORT_OPTIONS = [
  { key: "new", label: "Спочатку нові" },
  { key: "cheap", label: "Спочатку дешевші" },
  { key: "expensive", label: "Спочатку дорожчі" },
  { key: "popular", label: "Найпопулярніші" },
  { key: "rating", label: "За рейтингом власника" },
];

function toQuery(f: CatalogFilters, extra?: Record<string, string>): string {
  const p = new URLSearchParams();
  if (f.cat !== "all") p.set("cat", f.cat);
  if (f.q) p.set("q", f.q);
  if (f.minPrice) p.set("minPrice", f.minPrice);
  if (f.maxPrice) p.set("maxPrice", f.maxPrice);
  if (f.from) p.set("from", f.from);
  if (f.from && f.to) p.set("to", f.to);
  if (f.available) p.set("available", "1");
  if (f.verified) p.set("verified", "1");
  if (f.minRating) p.set("minRating", f.minRating);
  if (f.city) p.set("city", f.city);
  if (f.sort !== "new") p.set("sort", f.sort);
  for (const [k, v] of Object.entries(extra ?? {})) p.set(k, v);
  return p.toString();
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export default function CatalogClient({ initial }: { initial: CatalogFilters }) {
  const [filters, setFilters] = useState<CatalogFilters>(initial);
  // Текстові поля застосовуються з невеликою затримкою, щоб не робити запит на кожну літеру
  const [draft, setDraft] = useState({ q: initial.q, minPrice: initial.minPrice, maxPrice: initial.maxPrice });
  const [result, setResult] = useState<SearchResult | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [booking, setBooking] = useState<Product | null>(null);
  const requestId = useRef(0);
  const today = todayISO();

  const update = useCallback((patch: Partial<CatalogFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  // Затримка для тексту та ціни
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) =>
        f.q === draft.q.trim() && f.minPrice === draft.minPrice && f.maxPrice === draft.maxPrice
          ? f
          : { ...f, q: draft.q.trim(), minPrice: draft.minPrice, maxPrice: draft.maxPrice }
      );
    }, 400);
    return () => clearTimeout(t);
  }, [draft]);

  // Запит до API + синхронізація адреси сторінки
  useEffect(() => {
    const qs = toQuery(filters);
    // Оновлюємо адресу без перезавантаження та без запиту до сервера
    window.history.replaceState(null, "", qs ? `/catalog?${qs}` : "/catalog");
    const id = ++requestId.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- стан завантаження для запиту до API
    setLoading(true);
    setError(null);
    api<SearchResult>(`/api/products/search?${toQuery(filters, { page: "1" })}`)
      .then((r) => {
        if (id !== requestId.current) return; // відповідь на застарілий запит
        setResult(r);
        setItems(r.items);
      })
      .catch((err) => id === requestId.current && setError(err.message))
      .finally(() => id === requestId.current && setLoading(false));
  }, [filters]);

  const loadMore = async () => {
    if (!result) return;
    setLoadingMore(true);
    try {
      const r = await api<SearchResult>(`/api/products/search?${toQuery(filters, { page: String(result.page + 1) })}`);
      setResult(r);
      setItems((prev) => [...prev, ...r.items.filter((p) => !prev.some((x) => x.id === p.id))]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoadingMore(false);
    }
  };

  const reset = () => {
    setDraft({ q: "", minPrice: "", maxPrice: "" });
    setFilters({ ...DEFAULTS, cat: filters.cat });
  };

  // Активні фільтри у вигляді «таблеток» з хрестиком
  const chips: { label: string; clear: () => void }[] = [];
  if (filters.q) chips.push({ label: `«${filters.q}»`, clear: () => { setDraft((d) => ({ ...d, q: "" })); update({ q: "" }); } });
  if (filters.minPrice || filters.maxPrice) {
    chips.push({
      label: `${filters.minPrice || "0"}–${filters.maxPrice || "∞"} ₴/доба`,
      clear: () => { setDraft((d) => ({ ...d, minPrice: "", maxPrice: "" })); update({ minPrice: "", maxPrice: "" }); },
    });
  }
  if (filters.from) {
    chips.push({
      label: `вільно ${filters.to && filters.to !== filters.from ? `${formatDay(filters.from)} – ${formatDay(filters.to)}` : formatDay(filters.from)}`,
      clear: () => update({ from: "", to: "" }),
    });
  }
  if (filters.city) chips.push({ label: `📍 ${filters.city}`, clear: () => update({ city: "" }) });
  if (filters.available) chips.push({ label: "доступні зараз", clear: () => update({ available: false }) });
  if (filters.verified) chips.push({ label: "перевірені через Дію", clear: () => update({ verified: false }) });
  if (filters.minRating) chips.push({ label: `рейтинг від ${filters.minRating}★`, clear: () => update({ minRating: "" }) });

  const catLabel = filters.cat === "all" ? "Усі речі" : CATEGORY_BY_KEY[filters.cat as keyof typeof CATEGORY_BY_KEY]?.longLabel;

  return (
    <>
      <div className="dbju-page-container">
        <div className="dbju-catalog-head">
          <div>
            <h1 className="dbju-main-title" style={{ fontSize: "34px" }}>{catLabel}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginTop: "4px" }}>
              {result ? `Знайдено ${result.total} ${plural(result.total, "річ", "речі", "речей")}` : "Пошук..."}
            </p>
          </div>
          <form className="dbju-search-box dbju-catalog-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <SearchIcon size={18} className="dbju-search-icon" />
            <input
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              placeholder="Пошук у каталозі..."
              className="dbju-search-input"
              aria-label="Пошук у каталозі"
            />
          </form>
        </div>

        {/* Категорії з кількістю речей */}
        <div className="dbju-category-chips" style={{ marginBottom: "20px" }}>
          <button type="button" className={`dbju-category-chip ${filters.cat === "all" ? "active" : ""}`} onClick={() => update({ cat: "all" })}>
            <span>Усі{result ? ` · ${result.allCount}` : ""}</span>
          </button>
          {CATEGORY_LIST.map((c) => {
            const n = result?.categoryCounts[c.key] ?? 0;
            return (
              <button
                key={c.key}
                type="button"
                className={`dbju-category-chip ${filters.cat === c.key ? "active" : ""}`}
                onClick={() => update({ cat: c.key })}
                style={result && n === 0 && filters.cat !== c.key ? { opacity: 0.5 } : undefined}
              >
                <CategoryIcon categoryKey={c.key} size={16} />
                <span>{c.label}{result ? ` · ${n}` : ""}</span>
              </button>
            );
          })}
        </div>

        <div className="dbju-catalog-layout">
          {/* Фільтри */}
          <aside className={`dbju-catalog-filters ${showFilters ? "open" : ""}`}>
            <div className="dbju-filter-group">
              <div className="dbju-filter-title">Місто</div>
              <select value={filters.city} onChange={(e) => update({ city: e.target.value })} className="dbju-form-input" aria-label="Місто">
                <option value="">Усі міста</option>
                {filters.city && !result?.cities.some((c) => c.city === filters.city) && (
                  <option value={filters.city}>{filters.city}</option>
                )}
                {result?.cities.map((c) => (
                  <option key={c.city} value={c.city}>{c.city} · {c.count}</option>
                ))}
              </select>
            </div>

            <div className="dbju-filter-group">
              <div className="dbju-filter-title">Ціна за добу, ₴</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draft.minPrice}
                  onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value.replace(/\D/g, "") }))}
                  placeholder={result ? `від ${result.priceMin}` : "від"}
                  className="dbju-form-input"
                  aria-label="Мінімальна ціна"
                />
                <span>–</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draft.maxPrice}
                  onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value.replace(/\D/g, "") }))}
                  placeholder={result ? `до ${result.priceMax}` : "до"}
                  className="dbju-form-input"
                  aria-label="Максимальна ціна"
                />
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                {[
                  ["", "200", "до 200"],
                  ["200", "500", "200–500"],
                  ["500", "", "від 500"],
                ].map(([a, b, l]) => (
                  <button
                    key={l}
                    type="button"
                    className="dbju-btn-small"
                    style={{ padding: "4px 10px", fontSize: "12px" }}
                    onClick={() => setDraft((d) => ({ ...d, minPrice: a, maxPrice: b }))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="dbju-filter-group">
              <div className="dbju-filter-title">Вільно на дати</div>
              <label className="dbju-filter-label">
                Отримати
                <input
                  type="date"
                  min={today}
                  max={addDays(today, 90)}
                  value={filters.from}
                  onChange={(e) => {
                    const from = e.target.value;
                    update({ from, to: filters.to && filters.to < from ? from : filters.to });
                  }}
                  className="dbju-form-input"
                />
              </label>
              <label className="dbju-filter-label">
                Повернути
                <input
                  type="date"
                  min={filters.from || today}
                  max={addDays(today, 120)}
                  value={filters.to}
                  disabled={!filters.from}
                  onChange={(e) => update({ to: e.target.value })}
                  className="dbju-form-input"
                />
              </label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button type="button" className="dbju-btn-small" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => update({ from: today, to: today })}>
                  Сьогодні
                </button>
                <button
                  type="button"
                  className="dbju-btn-small"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  onClick={() => {
                    // найближчі субота–неділя
                    const d = new Date(today + "T00:00:00Z").getUTCDay();
                    const toSat = (6 - d + 7) % 7;
                    const sat = addDays(today, toSat);
                    update({ from: sat, to: addDays(sat, 1) });
                  }}
                >
                  Вихідні
                </button>
              </div>
            </div>

            <div className="dbju-filter-group">
              <div className="dbju-filter-title">Наявність і довіра</div>
              <label className="dbju-filter-check">
                <input type="checkbox" checked={filters.available} onChange={(e) => update({ available: e.target.checked })} />
                Лише доступні зараз (не в оренді)
              </label>
              <label className="dbju-filter-check">
                <input type="checkbox" checked={filters.verified} onChange={(e) => update({ verified: e.target.checked })} />
                Власник підтверджений через Дію
              </label>
            </div>

            <div className="dbju-filter-group">
              <div className="dbju-filter-title">Рейтинг власника</div>
              {[
                ["", "Будь-який"],
                ["3", "★ 3 і вище"],
                ["4", "★ 4 і вище"],
                ["5", "★ 5"],
              ].map(([v, l]) => (
                <label key={l} className="dbju-filter-check">
                  <input type="radio" name="minRating" checked={filters.minRating === v} onChange={() => update({ minRating: v })} />
                  {l}
                </label>
              ))}
            </div>

            <button type="button" className="dbju-btn-small" onClick={reset} style={{ width: "100%" }}>
              Скинути фільтри
            </button>
          </aside>

          {/* Результати */}
          <div>
            <div className="dbju-catalog-toolbar">
              <button type="button" className="dbju-btn-small dbju-filters-toggle" onClick={() => setShowFilters((v) => !v)}>
                {showFilters ? "Сховати фільтри" : `Фільтри${chips.length ? ` · ${chips.length}` : ""}`}
              </button>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
                {chips.map((c) => (
                  <button key={c.label} type="button" className="dbju-filter-chip" onClick={c.clear} title="Прибрати фільтр">
                    {c.label} ✕
                  </button>
                ))}
              </div>
              <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })} className="dbju-form-input dbju-sort-select" aria-label="Сортування">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>

            {error && <ErrorBox message={error} />}

            {loading && !result ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>Завантажуємо товари...</div>
            ) : items.length === 0 ? (
              <EmptyState icon="🔍" title="Нічого не знайдено" text="Спробуйте змінити або скинути фільтри.">
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  {chips.length > 0 && <button type="button" className="dbju-btn-secondary" onClick={reset}>Скинути фільтри</button>}
                  <Link href={filters.cat !== "all" ? `/rent-out?category=${filters.cat}` : "/rent-out"} className="dbju-btn-primary">Здати свою річ</Link>
                </div>
              </EmptyState>
            ) : (
              <div style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}>
                <div className="dbju-product-grid dbju-catalog-grid">
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} onBookClick={setBooking} />
                  ))}
                </div>
                {result && result.page < result.pages && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                    <button type="button" className="dbju-btn-secondary" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? "Завантаження..." : `Показати ще (${result.total - items.length})`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {booking && <BookingModal product={booking} onClose={() => setBooking(null)} />}
      <Footer />
    </>
  );
}
