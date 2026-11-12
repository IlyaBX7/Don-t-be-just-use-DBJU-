"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "../../components/Footer/Footer";
import { ProductCard } from "../../components/ProductCard/ProductCard";
import { BookingModal } from "../../components/BookingModal";
import { useApp } from "../../components/AppProvider";
import { LoginRequired, PageLoading, EmptyState, ErrorBox } from "../../components/LoginRequired";
import { api } from "../../lib/api";
import type { Product } from "../../types/product";

export default function FavoritesPage() {
  const { user, loading: authLoading, favoriteIds } = useApp();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Product | null>(null);

  useEffect(() => {
    if (!user) return;
    api<Product[]>("/api/favorites")
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, [user]);

  // Товар зникає зі списку одразу після зняття сердечка
  const visible = products?.filter((p) => favoriteIds.has(p.id)) ?? null;

  if (authLoading) return <PageLoading />;

  return (
    <>
      <div className="dbju-page-container">
        <h1 className="dbju-main-title" style={{ fontSize: "34px", marginBottom: "20px" }}>Список бажань</h1>

        {!user ? (
          <LoginRequired title="Увійдіть, щоб бачити обране" text="Додавайте речі в обране сердечком на картці — вони збережуться у вашому акаунті." />
        ) : error ? (
          <ErrorBox message={error} />
        ) : !visible ? (
          <PageLoading />
        ) : visible.length === 0 ? (
          <EmptyState icon="🤍" title="Тут поки порожньо" text="Натисніть сердечко на картці товару, щоб зберегти його.">
            <Link href="/#catalog" className="dbju-btn-primary">До каталогу</Link>
          </EmptyState>
        ) : (
          <div className="dbju-product-grid">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} onBookClick={setBooking} />
            ))}
          </div>
        )}
      </div>

      {booking && <BookingModal product={booking} onClose={() => setBooking(null)} />}
      <Footer />
    </>
  );
}
