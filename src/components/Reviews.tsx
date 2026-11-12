"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { Avatar } from "./Avatar";
import { ErrorBox } from "./LoginRequired";
import type { ApiReview } from "../lib/reviews";

export function pluralReviews(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "відгук";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "відгуки";
  return "відгуків";
}

// «★ 4.8 · 12 відгуків» або «Ще немає відгуків»
export function ratingText(rating: number, count: number): string {
  return count > 0 ? `★ ${rating.toFixed(1)} · ${count} ${pluralReviews(count)}` : "Ще немає відгуків";
}

export const Stars = ({ value, size = 16 }: { value: number; size?: number }) => (
  <span aria-label={`${value} з 5`} style={{ fontSize: size, letterSpacing: "1px", whiteSpace: "nowrap" }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} style={{ color: i <= Math.round(value) ? "#F59E0B" : "#D1D5DB" }}>★</span>
    ))}
  </span>
);

export const ReviewCard = ({ review, hideProduct = false }: { review: ApiReview; hideProduct?: boolean }) => (
  <div className="dbju-review-card">
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <Link href={`/users/${review.author.id}`}>
        <Avatar className="dbju-user-avatar" name={review.author.name} initials={review.author.avatar} url={review.author.avatarUrl} />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/users/${review.author.id}`} style={{ fontWeight: 800 }}>{review.author.name}</Link>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {new Date(review.createdAt).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
          {" · "}
          {review.targetRole === "OWNER" ? "як власник" : "як орендар"}
        </div>
      </div>
      <Stars value={review.rating} />
    </div>
    {review.text && <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.55 }}>{review.text}</p>}
    {review.product && !hideProduct && (
      <Link href={`/product/${review.product.id}`} style={{ fontSize: "12px", color: "var(--brand-green)", fontWeight: 700 }}>
        Оренда: {review.product.name} →
      </Link>
    )}
  </div>
);

// Вікно «Залишити відгук» після завершеної оренди
export function ReviewModal({
  bookingId,
  targetName,
  aboutRole,
  onClose,
  onDone,
}: {
  bookingId: string;
  targetName: string;
  aboutRole: "OWNER" | "RENTER";
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/reviews", { method: "POST", json: { bookingId, rating, text } });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося зберегти відгук");
    } finally {
      setBusy(false);
    }
  };

  const labels = ["", "Погано", "Так собі", "Нормально", "Добре", "Чудово"];
  const shown = hover || rating;

  return (
    <div className="dbju-booking-modal-overlay" onClick={onClose}>
      <div className="dbju-booking-modal" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: "20px", fontWeight: 900 }}>Відгук про {aboutRole === "OWNER" ? "власника" : "орендаря"}</h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Як пройшла оренда з <strong>{targetName}</strong>? Відгук побачать усі на сторінці користувача.
        </p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }} onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i} з 5`}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                style={{ fontSize: "34px", lineHeight: 1, color: i <= shown ? "#F59E0B" : "#D1D5DB", background: "none", padding: 0 }}
              >
                ★
              </button>
            ))}
            <span style={{ fontWeight: 700, fontSize: "14px" }}>{labels[shown]}</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder={aboutRole === "OWNER" ? "Річ відповідала опису? Чи легко було домовитися?" : "Повернув річ вчасно і в гарному стані?"}
            className="dbju-form-input"
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
          {error && <ErrorBox message={error} />}
          <button type="submit" className="dbju-btn-primary" disabled={busy}>
            {busy ? "Збереження..." : "Опублікувати відгук"}
          </button>
        </form>
      </div>
    </div>
  );
}

export interface ProductReviewsData {
  items: ApiReview[];
  count: number;
  average: number;
  distribution: Record<number, number>;
}

// Блок «Відгуки орендарів» на сторінці товару
export const ProductReviews = ({ data, ownerId }: { data: ProductReviewsData; ownerId: string }) => {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? data.items : data.items.slice(0, 4);
  return (
    <section id="reviews" className="dbju-product-reviews">
      <h2 style={{ fontSize: "24px", fontWeight: 900 }}>
        Відгуки орендарів{data.count > 0 && <span style={{ color: "var(--text-muted)", fontWeight: 700 }}> · {data.count}</span>}
      </h2>

      {data.count === 0 ? (
        <div className="dbju-review-card" style={{ alignItems: "flex-start" }}>
          <strong>Цю річ ще ніхто не оцінив</strong>
          <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Відгуки з&apos;являються після завершених оренд. Подивіться, що пишуть про{" "}
            <Link href={`/users/${ownerId}`} style={{ color: "var(--brand-green)", fontWeight: 700 }}>власника</Link>.
          </span>
        </div>
      ) : (
        <div className="dbju-product-reviews-layout">
          <div className="dbju-review-summary-box">
            <div className="dbju-review-big">{data.average.toFixed(1)}</div>
            <Stars value={data.average} size={20} />
            <div className="dbju-settings-hint" style={{ margin: 0 }}>{data.count} {pluralReviews(data.count)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px", width: "100%" }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const n = data.distribution[star] ?? 0;
                return (
                  <div key={star} className="dbju-review-bar-row">
                    <span>{star}★</span>
                    <div className="dbju-review-bar">
                      <div style={{ width: `${data.count ? (n / data.count) * 100 : 0}%` }} />
                    </div>
                    <span>{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
            {shown.map((r) => (
              <ReviewCard key={r.id} review={r} hideProduct />
            ))}
            {data.items.length > 4 && (
              <button type="button" className="dbju-btn-small" style={{ alignSelf: "flex-start" }} onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Згорнути" : `Показати всі відгуки (${data.items.length})`}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
