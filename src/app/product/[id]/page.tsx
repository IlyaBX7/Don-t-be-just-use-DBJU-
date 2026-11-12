"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Product } from "../../../types/product";
import { ProductThumb } from "../../../components/ProductThumb";
import { FavoriteButton } from "../../../components/FavoriteButton";
import { useApp } from "../../../components/AppProvider";
import { Avatar } from "../../../components/Avatar";
import { ProductReviews, Stars, pluralReviews, ratingText, type ProductReviewsData } from "../../../components/Reviews";
import { isRentedNow, rentalLongLabel, rentalShortLabel } from "../../../lib/rentalStatus";
import { BookingModal } from "../../../components/BookingModal";
import { Footer } from "../../../components/Footer/Footer";
import { 
  ArrowLeftIcon, 
  LocationPinIcon, 
  ScalesIcon, 
  ShieldCheckIcon, 
  BoxIcon, 
  CheckIcon 
} from "../../../components/Icons";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(3); // 1, 3, or 7 days
  const [activeImage, setActiveImage] = useState(0);
  const { user } = useApp();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [reviews, setReviews] = useState<ProductReviewsData | null>(null);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/products/${encodeURIComponent(productId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Товар не знайдено");
        setProduct(data);
      })
      .catch((err) => setLoadError(err.message));
    fetch(`/api/products/${encodeURIComponent(productId)}/reviews`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setReviews(data))
      .catch(() => {});
  }, [productId]);

  if (!product) {
    return (
      <>
        <div className="dbju-page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
          {loadError ? (
            <>
              <h1 style={{ fontSize: "24px", fontWeight: "900", marginBottom: "12px" }}>{loadError}</h1>
              <Link href="/" className="dbju-btn-primary">Повернутися до каталогу</Link>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Завантажуємо товар...</p>
          )}
        </div>
        <Footer />
      </>
    );
  }

  // Price calculations based on selected duration
  let activePrice = product.rentalPricePerDay;
  if (selectedDuration === 3 && product.pricingTiers?.threeDays) {
    activePrice = product.pricingTiers.threeDays;
  } else if (selectedDuration === 7 && product.pricingTiers?.week) {
    activePrice = product.pricingTiers.week;
  }

  return (
    <>
      <div className="dbju-page-container">
        {/* Breadcrumb / Back */}
        <div style={{ marginBottom: "20px" }}>
          <Link 
            href="/" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px", 
              fontSize: "14px", 
              fontWeight: "700", 
              color: "var(--text-secondary)" 
            }}
          >
            <ArrowLeftIcon size={16} />
            <span>Назад до каталогу</span>
          </Link>
        </div>

        {/* 2-Column Responsive Detail Layout */}
        <div className="dbju-detail-layout">
          {/* Left Column: Gallery (Screen 3) */}
          <div className="dbju-detail-gallery-column">
            <div 
              className="dbju-gallery-card" 
              style={{ backgroundColor: product.accentColor, overflow: "hidden" }}
            >
              <ProductThumb
                image={product.images[activeImage]}
                categoryKey={product.categoryKey}
                iconSize={110}
                alt={product.name}
              />

              <Link href="/" className="dbju-gallery-back-btn" title="Назад">
                <ArrowLeftIcon size={20} />
              </Link>

              <FavoriteButton productId={product.id} className="dbju-gallery-heart-btn" size={20} />

              {product.images.length > 1 && (
                <span className="dbju-gallery-counter">{activeImage + 1} / {product.images.length}</span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                {product.images.map((img, idx) => (
                  <button
                    type="button"
                    key={img}
                    onClick={() => setActiveImage(idx)}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "14px",
                      background: product.accentColor,
                      position: "relative",
                      overflow: "hidden",
                      border: idx === activeImage ? "2px solid var(--brand-green)" : "1px solid var(--border-subtle)",
                      opacity: idx === activeImage ? 1 : 0.65
                    }}
                    aria-label={`Фото ${idx + 1}`}
                  >
                    <ProductThumb image={img} categoryKey={product.categoryKey} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information, Owner, Pricing, Safeguards */}
          <div className="dbju-detail-content">
            <div>
              <h1 className="dbju-detail-title">{product.name}</h1>
              {reviews && reviews.count > 0 && (
                <a href="#reviews" className="dbju-title-rating">
                  <Stars value={reviews.average} /> <strong>{reviews.average.toFixed(1)}</strong>
                  <span>· {reviews.count} {pluralReviews(reviews.count)} орендарів</span>
                </a>
              )}
              <div className="dbju-detail-location" style={{ marginTop: "8px" }}>
                <LocationPinIcon size={18} color="var(--brand-green)" />
                <span>
                  {product.location} · самовивіз або кур&apos;єр
                </span>
              </div>
            </div>

            {isRentedNow(product) && (
              <div className="dbju-rented-banner">
                <strong>🔒 {rentalShortLabel(product)}</strong>
                <span>{rentalLongLabel(product)}</span>
                {user?.id !== product.ownerId && (
                  <span>Додайте річ в обране ♡, щоб не загубити її.</span>
                )}
              </div>
            )}
            {product.status === "HIDDEN" && (
              <div className="dbju-ai-notice" style={{ marginTop: 0 }}>
                Оголошення приховане і не показується в каталозі.
              </div>
            )}

            {/* Owner Trust Card with Diia verification */}
            <Link href={`/users/${product.ownerId}`} className="dbju-owner-card dbju-owner-card-link" title="Переглянути профіль і всі речі власника">
              <div className="dbju-owner-left">
                <Avatar className="dbju-owner-avatar-lg" name={product.ownerName} initials={product.ownerInitials} url={product.ownerAvatarUrl} />
                <div>
                  <div className="dbju-owner-name">{product.ownerName}</div>
                  <div className="dbju-owner-stats">
                    {ratingText(product.ownerRating, product.reviewsCount)} · {product.rentalCount} оренд цієї речі
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand-green)", marginTop: "2px" }}>
                    Профіль та всі речі власника →
                  </div>
                </div>
              </div>

              {product.verifiedByDiia && (
                <div className="dbju-diia-badge" style={{ padding: "4px 10px", fontSize: "12px" }}>
                  <CheckIcon size={12} />
                  <span>ДІЯ ✓</span>
                </div>
              )}
            </Link>

            {/* Pricing Duration Selector */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                Оберіть тривалість оренди:
              </label>

              <div className="dbju-pricing-tiers">
                {/* 1 доба */}
                <div 
                  className={`dbju-pricing-tier-card ${selectedDuration === 1 ? "selected" : ""}`}
                  onClick={() => setSelectedDuration(1)}
                >
                  <span className="dbju-tier-label">1 доба</span>
                  <span className="dbju-tier-price">{product.pricingTiers.oneDay} ₴</span>
                </div>

                {/* 3 доби */}
                <div 
                  className={`dbju-pricing-tier-card ${selectedDuration === 3 ? "selected" : ""}`}
                  onClick={() => setSelectedDuration(3)}
                >
                  <span className="dbju-tier-label">3 доби</span>
                  <span className="dbju-tier-price">{product.pricingTiers.threeDays} ₴</span>
                </div>

                {/* Тиждень */}
                <div 
                  className={`dbju-pricing-tier-card ${selectedDuration === 7 ? "selected" : ""}`}
                  onClick={() => setSelectedDuration(7)}
                >
                  <span className="dbju-tier-label">Тиждень</span>
                  <span className="dbju-tier-price">{product.pricingTiers.week} ₴</span>
                </div>
              </div>
            </div>

            {/* "Оренда чи купівля?" Comparison Card */}
            <div className="dbju-compare-card">
              <div className="dbju-compare-header">
                <ScalesIcon size={22} color="var(--brand-green)" />
                <span>Оренда чи купівля?</span>
              </div>

              <div className="dbju-compare-cols">
                <div>
                  <div className="dbju-compare-col-label">Купити новий</div>
                  <div className="dbju-compare-col-val">
                    {product.marketBuyPrice ? `≈ ${product.marketBuyPrice.toLocaleString("uk-UA")} ₴` : "—"}
                  </div>
                </div>

                <div>
                  <div className="dbju-compare-col-label">Оренда на 3 доби</div>
                  <div className="dbju-compare-col-val" style={{ color: "var(--brand-green)" }}>
                    {product.pricingTiers.threeDays} ₴
                  </div>
                </div>
              </div>

              <div className="dbju-lime-banner">
                Сподобалось? {product.buybackRebatePercent}% оплаченої оренди зарахуємо в ціну, якщо вирішите викупити річ у власника.
              </div>
            </div>

            {/* Safeguards & What's Included */}
            <div className="dbju-safeguards-list">
              <div className="dbju-safeguard-row">
                <ShieldCheckIcon size={20} color="var(--brand-green)" style={{ flexShrink: 0 }} />
                <span>
                  Застава {product.depositAmount} ₴ — лише тимчасово блокується на вашій картці
                </span>
              </div>

              {product.includedKit && product.includedKit.length > 0 && (
                <div className="dbju-safeguard-row" style={{ alignItems: "flex-start" }}>
                  <BoxIcon size={20} color="var(--brand-green)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>У комплекті: </strong>
                    <span>{product.includedKit.join(", ")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginTop: "8px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>Опис</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", fontSize: "15px" }}>
                {product.description}
              </p>
            </div>

            {/* Features Specs */}
            {Object.keys(product.features).length > 0 && (
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>Характеристики</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {Object.entries(product.features).map(([key, val]) => (
                    <div 
                      key={key} 
                      style={{ 
                        background: "#FFFFFF", 
                        padding: "10px 14px", 
                        borderRadius: "12px", 
                        border: "1px solid var(--border-subtle)",
                        fontSize: "13px"
                      }}
                    >
                      <span style={{ color: "var(--text-muted)", display: "block" }}>{key}</span>
                      <strong style={{ color: "var(--text-primary)" }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Sticky Checkout Action Bar (Screen 3) */}
            <div className="dbju-bottom-cta-bar">
              <div className="dbju-cta-price-block">
                <span className="dbju-cta-sub">
                  {selectedDuration === 1 ? "за добу" : `за ${selectedDuration} діб`}
                </span>
                <span className="dbju-cta-main-price">
                  {activePrice} ₴
                </span>
              </div>

              {user?.id === product.ownerId ? (
                <Link
                  href="/profile/listings"
                  className="dbju-btn-primary"
                  style={{ padding: "16px 36px", fontSize: "17px", borderRadius: "var(--radius-lg)" }}
                >
                  Керувати оголошенням
                </Link>
              ) : (
                <button 
                  type="button" 
                  className="dbju-btn-primary"
                  style={{ padding: "16px 36px", fontSize: "17px", borderRadius: "var(--radius-lg)", ...(isRentedNow(product) ? { opacity: 0.55, cursor: "not-allowed" } : {}) }}
                  onClick={() => !isRentedNow(product) && setShowBookingModal(true)}
                  disabled={isRentedNow(product)}
                >
                  {isRentedNow(product) ? rentalShortLabel(product) : "Обрати дати"}
                </button>
              )}
            </div>
          </div>
        </div>
        {reviews && <ProductReviews data={reviews} ownerId={product.ownerId} />}
      </div>

      {/* Booking Checkout Modal (Screen 4) */}
      {showBookingModal && (
        <BookingModal
          product={product}
          initialDays={selectedDuration}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      <Footer />
    </>
  );
}
