"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "../components/ProductCard/ProductCard";
import { BookingModal } from "../components/BookingModal";
import { Footer } from "../components/Footer/Footer";
import { Product } from "../types/product";
import { ShieldCheckIcon, UserIcon, BoxIcon } from "../components/Icons";
import { CategoryPromoCard } from "../components/CategoryPromoCard";
import { CategoryIcon } from "../components/CategoryIcon";
import { CATEGORY_LIST } from "../lib/categories";

interface HomeProps {
  initialCategory: string;
  initialQuery: string;
}

// На головній показуємо не більше 8 речей — решта в каталозі /catalog
const HOME_LIMIT = 8;

export default function HomeClient({ initialCategory, initialQuery }: HomeProps) {
  const router = useRouter();
  // Category filter: "all" or specific category
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // Booking modal product state
  const [selectedProductForBooking, setSelectedProductForBooking] = useState<Product | null>(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const pickTile = (cat: string) => {
    setSelectedCategory(cat);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  // Товари з бази даних
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Не вдалося завантажити товари");
        setProducts(data);
      })
      .catch((err) => setProductsError(err.message))
      .finally(() => setProductsLoading(false));
  }, []);

  const catalogHref = (() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("cat", selectedCategory);
    if (searchQuery) params.set("q", searchQuery);
    const qs = params.toString();
    return qs ? `/catalog?${qs}` : "/catalog";
  })();

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "all" || p.categoryKey === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <>
      <div className="dbju-page-container">
        {/* HERO SECTION (Screen 1 Fidelity: "Не купуй. Користуйся.") */}
        <section className="dbju-hero-section">
          <div className="dbju-hero-left">
            <div className="dbju-hero-badge">
              <div className="dbju-logo-pill">DBJU</div>
              <span className="dbju-slogan">Don&apos;t Buy, Just Use</span>
            </div>

            <h1 className="dbju-hero-title">
              Не купуй.<br />
              <span className="dbju-lime-highlight">Користуйся.</span>
            </h1>

            <p className="dbju-hero-subtitle">
              Орендуй потрібні речі на день, тиждень чи місяць — і заробляй на тих, що лежать удома без діла.
            </p>

            <div className="dbju-trust-list">
              <div className="dbju-trust-item">
                <div className="dbju-trust-icon-box">
                  <ShieldCheckIcon size={20} />
                </div>
                <span>Кожна оренда під захистом DBJU (до 20 000 ₴)</span>
              </div>

              <div className="dbju-trust-item">
                <div className="dbju-trust-icon-box">
                  <UserIcon size={20} />
                </div>
                <span>100% перевірка користувачів через Дію</span>
              </div>

              <div className="dbju-trust-item">
                <div className="dbju-trust-icon-box">
                  <BoxIcon size={20} />
                </div>
                <span>Самовивіз у власника або кур&apos;єр до дверей</span>
              </div>
            </div>

            <div className="dbju-hero-actions">
              <a href="#catalog" className="dbju-btn-primary">
                Почати оренду
              </a>
              <Link href="/rent-out" className="dbju-btn-secondary">
                Здати свою річ
              </Link>
            </div>
          </div>

            {/* Hero Right: основні категорії */}
            <div className="dbju-hero-grid">
              {CATEGORY_LIST.filter((c) => c.featured).map((c) => (
                <div
                  key={c.key}
                  className="dbju-pastel-tile"
                  style={{ background: c.accent }}
                  onClick={() => pickTile(c.key)}
                  title={`Категорія ${c.longLabel}`}
                >
                  <CategoryIcon categoryKey={c.key} size={56} />
                  <span className="dbju-pastel-tile-label">{c.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* MAIN CATALOG & DISCOVERY SECTION (Screen 2 Fidelity: "Що орендуємо?") */}
          <section id="catalog" style={{ scrollMarginTop: "90px" }}>
            <div className="dbju-section-header">
              <h2 className="dbju-main-title">Що орендуємо?</h2>
            </div>

            {searchQuery && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "15px", fontWeight: 700 }}>
                  Результати пошуку «{searchQuery}»
                </span>
                <button
                  type="button"
                  className="dbju-btn-small"
                  onClick={() => { setSearchQuery(""); router.push("/#catalog"); }}
                >
                  Скинути пошук ✕
                </button>
              </div>
            )}

            {/* Horizontal Category Selector Chips */}
            <div className="dbju-category-chips">
              <button 
                type="button" 
                className={`dbju-category-chip ${selectedCategory === "all" ? "active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                <span>Усі категорії</span>
              </button>

              {CATEGORY_LIST.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`dbju-category-chip ${selectedCategory === c.key ? "active" : ""}`}
                  onClick={() => setSelectedCategory(c.key)}
                  title={c.longLabel}
                >
                  <CategoryIcon categoryKey={c.key} size={18} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Інформаційна картка обраної категорії */}
            <CategoryPromoCard
              category={selectedCategory}
              products={productsLoading || productsError ? null : products}
              onShowItems={() => {
                setSearchQuery("");
                document.getElementById("nearby")?.scrollIntoView({ behavior: "smooth" });
              }}
            />

            {/* Сітка товарів */}
            <div id="nearby" style={{ scrollMarginTop: "90px" }}>
              <div className="dbju-nearby-header">
                <h3 className="dbju-nearby-title">
                  {selectedCategory === "all" ? "Усі речі" : CATEGORY_LIST.find((c) => c.key === selectedCategory)?.longLabel}
                </h3>
              </div>

              {productsLoading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                  Завантажуємо товари...
                </div>
              ) : productsError ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#FFFFFF", borderRadius: "var(--radius-xl)", color: "#B91C1C" }}>
                  {productsError}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#FFFFFF", borderRadius: "var(--radius-xl)" }}>
                  <p style={{ fontSize: "16px", color: "var(--text-muted)" }}>
                    За вашим запитом нічого не знайдено в обраній категорії.
                  </p>
                  <button 
                    type="button" 
                    className="dbju-btn-secondary" 
                    style={{ marginTop: "16px" }}
                    onClick={() => { setSelectedCategory("all"); setSearchQuery(""); router.push("/#catalog"); }}
                  >
                    Скинути фільтри
                  </button>
                </div>
              ) : (
                <div className="dbju-product-grid">
                  {filteredProducts.slice(0, HOME_LIMIT).map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onBookClick={(p) => setSelectedProductForBooking(p)}
                    />
                  ))}
                </div>
              )}

              {!productsLoading && !productsError && filteredProducts.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                  <Link href={catalogHref} className="dbju-btn-secondary" style={{ padding: "14px 28px", fontSize: "15px" }}>
                    {filteredProducts.length > HOME_LIMIT
                      ? `Переглянути усі товари (${filteredProducts.length}) →`
                      : "Відкрити каталог з фільтрами →"}
                  </Link>
                </div>
              )}
            </div>

            {/* How DBJU Works 24/7 Section */}
            <div 
              id="how-it-works"
              style={{
                marginTop: "64px",
                background: "#FFFFFF",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border-subtle)",
                padding: "48px 36px",
                textAlign: "center"
              }}
            >
              <h2 style={{ fontSize: "28px", fontWeight: "900", marginBottom: "8px" }}>
                Як працює оренда в DBJU?
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "600px", margin: "0 auto 36px" }}>
                Три прості кроки — від бронювання до повернення застави.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", textAlign: "left" }}>
                <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-canvas)" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--brand-green)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", marginBottom: "16px" }}>
                    1
                  </div>
                  <h4 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "6px" }}>
                    Бронювання та Дія
                  </h4>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Обираєте річ і дати. Особу верифіковано через Дію, застава лише тимчасово блокується на картці.
                  </p>
                </div>

                <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-canvas)" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--brand-green)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", marginBottom: "16px" }}>
                    2
                  </div>
                  <h4 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "6px" }}>
                    Отримання
                  </h4>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Забираєте річ у власника або замовляєте кур&apos;єра до дверей. Код замовлення — у розділі «Мої оренди».
                  </p>
                </div>

                <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-canvas)" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--brand-green)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", marginBottom: "16px" }}>
                    3
                  </div>
                  <h4 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "6px" }}>
                    Повернення з фотозвітом
                  </h4>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Повертаєте річ і робите фото. Власник підтверджує стан — і застава автоматично розблоковується.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

      {/* Booking Checkout Modal (Screen 4) */}
      {selectedProductForBooking && (
        <BookingModal
          product={selectedProductForBooking}
          onClose={() => setSelectedProductForBooking(null)}
        />
      )}

      <Footer />
    </>
  );
}
