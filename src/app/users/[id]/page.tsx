"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeftIcon, CheckIcon } from "../../../components/Icons";
import { Footer } from "../../../components/Footer/Footer";
import { Avatar } from "../../../components/Avatar";
import { ProductCard } from "../../../components/ProductCard/ProductCard";
import { BookingModal } from "../../../components/BookingModal";
import { CategoryIcon } from "../../../components/CategoryIcon";
import { useApp } from "../../../components/AppProvider";
import { PageLoading, EmptyState } from "../../../components/LoginRequired";
import { ReviewCard, Stars, pluralReviews, ratingText } from "../../../components/Reviews";
import { api } from "../../../lib/api";
import { CATEGORY_BY_KEY } from "../../../lib/categories";
import type { ApiReview } from "../../../lib/reviews";
import type { Product } from "../../../types/product";

interface PublicUser {
  id: string;
  name: string;
  firstName: string;
  avatar: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  stats: {
    activeListings: number;
    completedAsOwner: number;
    completedAsRenter: number;
    ownerRating: number;
    ownerReviews: number;
    renterRating: number;
    renterReviews: number;
  };
}

type Tab = "items" | "reviews" | "about";
type ReviewFilter = "ALL" | "OWNER" | "RENTER";

export default function PublicUserPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useApp();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [reviews, setReviews] = useState<ApiReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("items");
  const [filter, setFilter] = useState<ReviewFilter>("ALL");
  const [category, setCategory] = useState<string>("all");
  const [booking, setBooking] = useState<Product | null>(null);

  useEffect(() => {
    if (!id) return;
    const enc = encodeURIComponent(id);
    Promise.all([
      api<PublicUser>(`/api/users/${enc}`),
      api<Product[]>(`/api/products?owner=${enc}`),
      api<ApiReview[]>(`/api/users/${enc}/reviews`),
    ])
      .then(([u, p, r]) => {
        setProfile(u);
        setProducts(p);
        setReviews(r);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const categories = useMemo(() => [...new Set((products ?? []).map((p) => p.categoryKey))], [products]);
  const shownProducts = (products ?? []).filter((p) => category === "all" || p.categoryKey === category);
  const shownReviews = (reviews ?? []).filter((r) => filter === "ALL" || r.targetRole === filter);

  if (error) {
    return (
      <>
        <div className="dbju-page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "12px" }}>{error}</h1>
          <Link href="/" className="dbju-btn-primary">До каталогу</Link>
        </div>
        <Footer />
      </>
    );
  }
  if (!profile || !products || !reviews) return <PageLoading />;

  const isMe = me?.id === profile.id;
  const since = new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" }).format(new Date(profile.createdAt));
  const s = profile.stats;

  return (
    <>
      <div className="dbju-page-container" style={{ maxWidth: "1100px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
            <ArrowLeftIcon size={16} />
            <span>До каталогу</span>
          </Link>
        </div>

        {/* Шапка профілю */}
        <div className="dbju-profile-header-card" style={{ marginBottom: "16px" }}>
          <div className="dbju-profile-user-left">
            <Avatar className="dbju-profile-avatar-xl" name={profile.name} initials={profile.avatar} url={profile.avatarUrl} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h1 className="dbju-profile-name">{profile.name}</h1>
                {profile.isVerified && (
                  <span className="dbju-diia-badge" style={{ padding: "3px 9px", fontSize: "12px" }}>
                    <CheckIcon size={12} />
                    <span>ДІЯ ✓</span>
                  </span>
                )}
              </div>
              <div className="dbju-profile-reputation">{ratingText(profile.rating, profile.reviewsCount)}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>На DBJU з {since}</div>
            </div>
          </div>
          {isMe && (
            <Link href="/profile/edit" className="dbju-btn-small">Редагувати профіль</Link>
          )}
        </div>

        {/* Цифри */}
        <div className="dbju-user-stats">
          <div><strong>{s.activeListings}</strong><span>оголошень</span></div>
          <div><strong>{s.completedAsOwner}</strong><span>здав в оренду</span></div>
          <div><strong>{s.completedAsRenter}</strong><span>орендував</span></div>
          <div><strong>{profile.reviewsCount}</strong><span>{pluralReviews(profile.reviewsCount)}</span></div>
        </div>

        {/* Вкладки */}
        <div className="dbju-rentals-tabs" style={{ marginTop: "20px" }}>
          <button type="button" className={`dbju-rentals-tab-btn ${tab === "items" ? "active" : ""}`} onClick={() => setTab("items")}>
            Речі · {products.length}
          </button>
          <button type="button" className={`dbju-rentals-tab-btn ${tab === "reviews" ? "active" : ""}`} onClick={() => setTab("reviews")}>
            Відгуки · {reviews.length}
          </button>
          <button type="button" className={`dbju-rentals-tab-btn ${tab === "about" ? "active" : ""}`} onClick={() => setTab("about")}>
            Про користувача
          </button>
        </div>

        {tab === "items" &&
          (products.length === 0 ? (
            <EmptyState icon="🧰" title="Оголошень поки немає" text={isMe ? "Здайте річ, яка лежить без діла." : `${profile.firstName || profile.name} ще нічого не здає в оренду.`}>
              {isMe && <Link href="/rent-out" className="dbju-btn-primary">Здати річ</Link>}
            </EmptyState>
          ) : (
            <>
              {categories.length > 1 && (
                <div className="dbju-category-chips" style={{ marginBottom: "16px" }}>
                  <button type="button" className={`dbju-category-chip ${category === "all" ? "active" : ""}`} onClick={() => setCategory("all")}>
                    Усі · {products.length}
                  </button>
                  {categories.map((c) => (
                    <button key={c} type="button" className={`dbju-category-chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
                      <CategoryIcon categoryKey={c} size={16} />
                      <span>{CATEGORY_BY_KEY[c]?.label ?? c} · {products.filter((p) => p.categoryKey === c).length}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="dbju-product-grid">
                {shownProducts.map((p) => (
                  <ProductCard key={p.id} product={p} onBookClick={isMe ? undefined : setBooking} />
                ))}
              </div>
            </>
          ))}

        {tab === "reviews" && (
          <>
            <div className="dbju-review-summary">
              <div>
                <div className="dbju-review-big">{s.ownerReviews > 0 ? s.ownerRating.toFixed(1) : "—"}</div>
                <Stars value={s.ownerRating} />
                <div className="dbju-settings-hint" style={{ margin: 0 }}>як власник · {s.ownerReviews} {pluralReviews(s.ownerReviews)}</div>
              </div>
              <div>
                <div className="dbju-review-big">{s.renterReviews > 0 ? s.renterRating.toFixed(1) : "—"}</div>
                <Stars value={s.renterRating} />
                <div className="dbju-settings-hint" style={{ margin: 0 }}>як орендар · {s.renterReviews} {pluralReviews(s.renterReviews)}</div>
              </div>
            </div>

            <div className="dbju-category-chips" style={{ margin: "16px 0" }}>
              {([
                ["ALL", `Усі · ${reviews.length}`],
                ["OWNER", `Як власник · ${s.ownerReviews}`],
                ["RENTER", `Як орендар · ${s.renterReviews}`],
              ] as [ReviewFilter, string][]).map(([key, label]) => (
                <button key={key} type="button" className={`dbju-category-chip ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>
                  {label}
                </button>
              ))}
            </div>

            {shownReviews.length === 0 ? (
              <EmptyState icon="💬" title="Відгуків поки немає" text="Відгуки з'являються після завершених оренд." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {shownReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </>
        )}

        {tab === "about" && (
          <div className="dbju-help-section" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <h2>Про себе</h2>
              <p style={{ whiteSpace: "pre-line" }}>
                {profile.bio || (isMe ? "Ви ще нічого не написали про себе." : "Користувач ще нічого не написав про себе.")}
              </p>
              {isMe && !profile.bio && (
                <Link href="/profile/edit#personal" style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-green)" }}>Додати опис →</Link>
              )}
            </div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                {profile.isVerified
                  ? `✅ Особу підтверджено через Дію${profile.verifiedAt ? ` (${new Date(profile.verifiedAt).toLocaleDateString("uk-UA")})` : ""}`
                  : "⚪ Особу ще не підтверджено через Дію"}
              </li>
              <li>📅 На DBJU з {since}</li>
              <li>📦 Успішно здав в оренду: {s.completedAsOwner}</li>
              <li>🤝 Орендував речей: {s.completedAsRenter}</li>
              {categories.length > 0 && (
                <li>🏷️ Категорії: {categories.map((c) => CATEGORY_BY_KEY[c]?.label ?? c).join(", ")}</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {booking && <BookingModal product={booking} onClose={() => setBooking(null)} />}
      <Footer />
    </>
  );
}
