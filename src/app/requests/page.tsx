"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "../../components/Footer/Footer";
import { useApp } from "../../components/AppProvider";
import { Avatar } from "../../components/Avatar";
import { ProductThumb } from "../../components/ProductThumb";
import { EmptyState, ErrorBox, PageLoading } from "../../components/LoginRequired";
import { api } from "../../lib/api";
import { CATEGORY_BY_KEY, CATEGORY_LIST } from "../../lib/categories";
import { formatRange, todayISO } from "../../lib/dates";
import type { Product } from "../../types/product";

interface ItemRequest {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  categoryLabel: string | null;
  city: string | null;
  maxPricePerDay: number | null;
  neededFrom: string | null;
  neededTo: string | null;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  author: { id: string; name: string; avatar: string; avatarUrl: string | null; isVerified: boolean };
  offers: {
    id: string;
    message: string | null;
    createdAt: string;
    owner: { id: string; name: string };
    product: { id: string; name: string; pricePerDay: number; image: string | null; categoryKey: string; hidden: boolean };
  }[];
}

export default function RequestsPage() {
  const { user, openAuth } = useApp();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [cat, setCat] = useState("");
  const [items, setItems] = useState<ItemRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (tab === "mine") qs.set("mine", "1");
      if (cat) qs.set("cat", cat);
      setItems(await api<ItemRequest[]>(`/api/requests?${qs}`));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося завантажити запити");
    }
  }, [tab, cat]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження даних з API
    load();
  }, [load]);

  // Посилання зі сповіщення: /requests?open=ID — відкриваємо «Мої» і підсвічуємо
  useEffect(() => {
    const open = new URLSearchParams(window.location.search).get("open");
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- читання параметра з адреси після монтування
      setHighlight(open);
      setTab("mine");
    }
  }, []);

  const replace = (r: ItemRequest) => setItems((prev) => prev?.map((x) => (x.id === r.id ? r : x)) ?? null);

  return (
    <>
      <div className="dbju-page-container" style={{ maxWidth: "900px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div>
            <h1 className="dbju-main-title" style={{ fontSize: "34px" }}>Запити на речі</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginTop: "4px", maxWidth: "560px" }}>
              Не знайшли потрібну річ у каталозі? Напишіть, що шукаєте, — власники запропонують свої оголошення.
              А якщо у вас є щось із цього списку — здайте це й заробляйте.
            </p>
          </div>
          <button type="button" className="dbju-btn-primary" onClick={() => (user ? setCreating(true) : openAuth("LOGIN"))}>
            + Створити запит
          </button>
        </div>

        <div className="dbju-rentals-tabs">
          <button type="button" className={`dbju-rentals-tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>Усі запити</button>
          {user && (
            <button type="button" className={`dbju-rentals-tab-btn ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>Мої запити</button>
          )}
        </div>

        <div style={{ marginBottom: "16px", maxWidth: "260px" }}>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="dbju-form-input" aria-label="Категорія">
            <option value="">Усі категорії</option>
            {CATEGORY_LIST.map((c) => (
              <option key={c.key} value={c.key}>{c.longLabel}</option>
            ))}
          </select>
        </div>

        {creating && (
          <CreateRequest
            onClose={() => setCreating(false)}
            onCreated={(r) => {
              setCreating(false);
              setTab("mine");
              setItems((prev) => [r, ...(prev ?? [])]);
            }}
          />
        )}

        {error ? (
          <ErrorBox message={error} />
        ) : !items ? (
          <PageLoading />
        ) : items.length === 0 ? (
          <EmptyState
            icon="🙋"
            title={tab === "mine" ? "У вас ще немає запитів" : "Поки що запитів немає"}
            text="Створіть перший запит — власники побачать, що вам потрібно."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {items.map((r) => (
              <RequestCard key={r.id} r={r} highlight={highlight === r.id} onChange={replace} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

function RequestCard({ r, highlight, onChange }: { r: ItemRequest; highlight: boolean; onChange: (r: ItemRequest) => void }) {
  const { user, openAuth } = useApp();
  const [offering, setOffering] = useState(false);
  const [myProducts, setMyProducts] = useState<Product[] | null>(null);
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthor = user?.id === r.author.id;

  const startOffer = async () => {
    if (!user) return openAuth("LOGIN");
    setOffering(true);
    if (!myProducts) {
      const list = await api<Product[]>("/api/products?owner=me").catch(() => []);
      setMyProducts(list.filter((p) => p.status !== "HIDDEN"));
    }
  };

  const sendOffer = async () => {
    setBusy(true);
    setError(null);
    try {
      onChange(await api<ItemRequest>(`/api/requests/${r.id}`, { method: "POST", json: { productId, message } }));
      setOffering(false);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    setBusy(true);
    try {
      onChange(await api<ItemRequest>(`/api/requests/${r.id}`, { method: "PATCH", json: { status: r.status === "OPEN" ? "CLOSED" : "OPEN" } }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dbju-review-card" style={highlight ? { borderColor: "var(--brand-green)", boxShadow: "0 0 0 2px var(--brand-green-light)" } : undefined}>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <Link href={`/users/${r.author.id}`}>
          <Avatar className="dbju-user-avatar" name={r.author.name} initials={r.author.avatar} url={r.author.avatarUrl} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: "16px" }}>
            {r.title} {r.status === "CLOSED" && <span className="dbju-status-pill completed">Закрито</span>}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            <Link href={`/users/${r.author.id}`} style={{ fontWeight: 700, color: "var(--text-secondary)" }}>{r.author.name}</Link>
            {r.author.isVerified && " · ДІЯ ✓"} · {new Date(r.createdAt).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })}
          </div>
        </div>
      </div>
      {r.description && <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-line" }}>{r.description}</p>}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {r.categoryLabel && <span className="dbju-promo-tag" style={{ color: "var(--text-secondary)", background: "var(--bg-canvas)", borderColor: "var(--border-subtle)" }}>{r.categoryLabel}</span>}
        {r.city && <span className="dbju-promo-tag" style={{ color: "var(--text-secondary)", background: "var(--bg-canvas)", borderColor: "var(--border-subtle)" }}>📍 {r.city}</span>}
        {r.maxPricePerDay && <span className="dbju-promo-tag" style={{ color: "var(--text-secondary)", background: "var(--bg-canvas)", borderColor: "var(--border-subtle)" }}>до {r.maxPricePerDay} ₴/доба</span>}
        {r.neededFrom && (
          <span className="dbju-promo-tag" style={{ color: "var(--text-secondary)", background: "var(--bg-canvas)", borderColor: "var(--border-subtle)" }}>
            🗓 {formatRange(r.neededFrom, r.neededTo ?? r.neededFrom)}
          </span>
        )}
      </div>

      {r.offers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div className="dbju-photo-strip-title">Пропозиції власників · {r.offers.length}</div>
          {r.offers.map((o) => (
            <Link key={o.id} href={`/product/${o.product.id}`} className="dbju-chat-product">
              <div className="dbju-chat-product-thumb" style={{ background: CATEGORY_BY_KEY[o.product.categoryKey as keyof typeof CATEGORY_BY_KEY]?.accent }}>
                <ProductThumb image={o.product.image} categoryKey={o.product.categoryKey} iconSize={22} alt={o.product.name} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="dbju-chat-product-name">{o.product.name}</div>
                <div className="dbju-chat-product-meta">
                  {o.product.pricePerDay} ₴ / доба · {o.owner.name}
                  {o.message ? ` · «${o.message}»` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {isAuthor ? (
          <button type="button" className="dbju-btn-small" disabled={busy} onClick={toggle}>
            {r.status === "OPEN" ? "Закрити запит (знайшов)" : "Відкрити знову"}
          </button>
        ) : (
          r.status === "OPEN" && !offering && (
            <button type="button" className="dbju-btn-small primary" onClick={startOffer}>У мене є така річ</button>
          )
        )}
      </div>

      {offering && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
          {!myProducts ? (
            <span className="dbju-settings-hint">Завантаження ваших оголошень…</span>
          ) : myProducts.length === 0 ? (
            <span style={{ fontSize: "14px" }}>
              У вас ще немає активних оголошень. <Link href={`/rent-out${r.category ? `?category=${r.category}` : ""}`} style={{ color: "var(--brand-green)", fontWeight: 700 }}>Здайте цю річ →</Link>
            </span>
          ) : (
            <>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="dbju-form-input">
                <option value="">Оберіть своє оголошення</option>
                {myProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.rentalPricePerDay} ₴/доба</option>
                ))}
              </select>
              <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="Коментар (необов'язково)" className="dbju-form-input" />
              {error && <ErrorBox message={error} />}
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="dbju-btn-small primary" disabled={busy || !productId} onClick={sendOffer}>Запропонувати</button>
                <button type="button" className="dbju-btn-small" onClick={() => setOffering(false)}>Скасувати</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CreateRequest({ onClose, onCreated }: { onClose: () => void; onCreated: (r: ItemRequest) => void }) {
  const [f, setF] = useState({ title: "", description: "", category: "", city: "", maxPricePerDay: "", neededFrom: "", neededTo: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onCreated(await api<ItemRequest>("/api/requests", { method: "POST", json: f }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося створити запит");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="dbju-help-section" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
      <h2 style={{ fontSize: "20px" }}>Новий запит</h2>
      <input value={f.title} onChange={set("title")} required maxLength={150} placeholder="Що шукаєте? Напр.: генератор на вихідні" className="dbju-form-input" />
      <textarea value={f.description} onChange={set("description")} rows={3} maxLength={1000} placeholder="Деталі: для чого, які вимоги" className="dbju-form-input" style={{ resize: "vertical", fontFamily: "inherit" }} />
      <div className="dbju-settings-grid">
        <select value={f.category} onChange={set("category")} className="dbju-form-input" aria-label="Категорія">
          <option value="">Категорія (необов&apos;язково)</option>
          {CATEGORY_LIST.map((c) => (
            <option key={c.key} value={c.key}>{c.longLabel}</option>
          ))}
        </select>
        <input value={f.city} onChange={set("city")} maxLength={80} placeholder="Місто" className="dbju-form-input" />
        <input type="number" min={1} value={f.maxPricePerDay} onChange={set("maxPricePerDay")} placeholder="Бюджет, ₴/доба" className="dbju-form-input" />
        <div style={{ display: "flex", gap: "6px" }}>
          <input type="date" min={todayISO()} value={f.neededFrom} onChange={set("neededFrom")} className="dbju-form-input" aria-label="Потрібно з" />
          <input type="date" min={f.neededFrom || todayISO()} value={f.neededTo} onChange={set("neededTo")} className="dbju-form-input" aria-label="Потрібно до" />
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="submit" className="dbju-btn-primary" disabled={busy}>{busy ? "Зачекайте…" : "Опублікувати запит"}</button>
        <button type="button" className="dbju-btn-secondary" onClick={onClose}>Скасувати</button>
      </div>
    </form>
  );
}
