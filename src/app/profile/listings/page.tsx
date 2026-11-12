"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PlusCircleIcon } from "../../../components/Icons";
import { Footer } from "../../../components/Footer/Footer";
import { useApp } from "../../../components/AppProvider";
import { LoginRequired, PageLoading, EmptyState, ErrorBox } from "../../../components/LoginRequired";
import { ProductThumb } from "../../../components/ProductThumb";
import { BookingStatusPill, DELIVERY_LABEL } from "../../../components/BookingStatus";
import { ReviewModal } from "../../../components/Reviews";
import { PhotoPicker, PhotoStrip } from "../../../components/PhotoPicker";
import { BookingChat } from "../../../components/BookingChat";
import { api } from "../../../lib/api";
import { formatDateTime, formatRange } from "../../../lib/dates";
import { pluralDays } from "../../../lib/pricing";
import type { Product } from "../../../types/product";
import type { Booking } from "../../../types/booking";

type Tab = "REQUESTS" | "LISTINGS" | "HISTORY";

export default function MyListingsPage() {
  const { user, loading: authLoading, refreshStats } = useApp();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("REQUESTS");

  const load = useCallback(async () => {
    try {
      const [p, b] = await Promise.all([
        api<Product[]>("/api/products?owner=me"),
        api<Booking[]>("/api/bookings?role=owner"),
      ]);
      setProducts(p);
      setBookings(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити дані");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження даних з API
    if (user) load();
  }, [user, load]);

  const activeBookings = (bookings ?? []).filter((b) => ["PAID", "PICKED_UP", "RETURNED", "DISPUTED"].includes(b.status));
  const historyBookings = (bookings ?? []).filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED").reverse();
  const needAction = activeBookings.filter((b) => b.status === "RETURNED").length;

  const replaceBooking = (b: Booking) => {
    setBookings((prev) => prev?.map((x) => (x.id === b.id ? b : x)) ?? null);
    refreshStats();
    load(); // оновлюємо статуси та лічильники товарів
  };

  if (authLoading) return <PageLoading />;

  return (
    <>
      <div className="dbju-page-container" style={{ maxWidth: "900px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Link href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
            <ArrowLeftIcon size={16} />
            <span>Профіль</span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div>
            <h1 className="dbju-main-title" style={{ fontSize: "34px" }}>Мої оголошення</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginTop: "4px" }}>
              Бронювання ваших речей, підтвердження повернень та керування оголошеннями
            </p>
          </div>
          {user && (
            <Link href="/rent-out" className="dbju-btn-primary">
              <PlusCircleIcon size={16} />
              <span>Додати річ</span>
            </Link>
          )}
        </div>

        {!user ? (
          <LoginRequired title="Увійдіть, щоб керувати оголошеннями" text="Тут ви бачите бронювання своїх речей і підтверджуєте їх повернення." />
        ) : error ? (
          <ErrorBox message={error} />
        ) : !products || !bookings ? (
          <PageLoading />
        ) : (
          <>
            <div className="dbju-rentals-tabs">
              <button type="button" className={`dbju-rentals-tab-btn ${tab === "REQUESTS" ? "active" : ""}`} onClick={() => setTab("REQUESTS")}>
                Бронювання{activeBookings.length > 0 && ` · ${activeBookings.length}`}
                {needAction > 0 && " ⚠️"}
              </button>
              <button type="button" className={`dbju-rentals-tab-btn ${tab === "LISTINGS" ? "active" : ""}`} onClick={() => setTab("LISTINGS")}>
                Оголошення · {products.length}
              </button>
              <button type="button" className={`dbju-rentals-tab-btn ${tab === "HISTORY" ? "active" : ""}`} onClick={() => setTab("HISTORY")}>
                Історія
              </button>
            </div>

            {tab === "REQUESTS" &&
              (activeBookings.length === 0 ? (
                <EmptyState icon="📭" title="Активних бронювань немає" text="Коли хтось забронює вашу річ, бронювання з'явиться тут." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {activeBookings.map((b) => (
                    <OwnerBookingCard key={b.id} booking={b} onUpdate={replaceBooking} />
                  ))}
                </div>
              ))}

            {tab === "LISTINGS" &&
              (products.length === 0 ? (
                <EmptyState icon="🧰" title="У вас ще немає оголошень" text="Здайте річ, яка лежить без діла, і заробляйте на ній.">
                  <Link href="/rent-out" className="dbju-btn-primary">Здати річ</Link>
                </EmptyState>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {products.map((p) => (
                    <ListingRow
                      key={p.id}
                      product={p}
                      onChanged={(np) => setProducts((prev) => prev?.map((x) => (x.id === np.id ? np : x)) ?? null)}
                      onDeleted={() => {
                        setProducts((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
                        refreshStats();
                      }}
                    />
                  ))}
                </div>
              ))}

            {tab === "HISTORY" &&
              (historyBookings.length === 0 ? (
                <EmptyState icon="📦" title="Історія порожня" text="Тут з'являться завершені та скасовані оренди ваших речей." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {historyBookings.map((b) => (
                    <OwnerHistoryCard key={b.id} booking={b} onReviewed={load} />
                  ))}
                </div>
              ))}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

function OwnerHistoryCard({ booking: b, onReviewed }: { booking: Booking; onReviewed: () => void }) {
  const [reviewing, setReviewing] = useState(false);
  const canReview = b.status === "COMPLETED" && !b.reviewedByOwner;
  return (
    <>
      <div className="dbju-list-card">
        <div className="dbju-list-thumb" style={{ background: b.product.accentColor }}>
          <ProductThumb image={b.product.image} categoryKey={b.product.categoryKey} iconSize={28} />
        </div>
        <div style={{ flex: 1, minWidth: "180px" }}>
          <div style={{ fontWeight: 800 }}>{b.product.name}</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            <Link href={`/users/${b.renter.id}`} style={{ fontWeight: 700, color: "var(--text-secondary)" }}>{b.renter.name}</Link>
            {" · "}{formatRange(b.startDate, b.endDate)} · {b.code}
            {b.status === "COMPLETED" && b.reviewedByOwner && " · ✓ відгук залишено"}
          </div>
        </div>
        <div style={{ fontWeight: 800 }} title={b.status === "COMPLETED" ? `Оренда ${b.rentAmount} ₴ − комісія ${b.ownerCommission} ₴` : undefined}>
          {b.status === "COMPLETED" ? `+${b.ownerPayout + b.ownerCompensation} ₴` : "—"}
        </div>
        <BookingStatusPill status={b.status} />
        {canReview && (
          <button type="button" className="dbju-btn-small primary" onClick={() => setReviewing(true)}>
            ★ Відгук про орендаря
          </button>
        )}
      </div>
      {reviewing && (
        <ReviewModal
          bookingId={b.id}
          targetName={b.renter.name}
          aboutRole="RENTER"
          onClose={() => setReviewing(false)}
          onDone={onReviewed}
        />
      )}
    </>
  );
}

function OwnerBookingCard({ booking: b, onUpdate }: { booking: Booking; onUpdate: (b: Booking) => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [handover, setHandover] = useState<string[]>([]);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [claim, setClaim] = useState({ reason: "", amount: "", photos: [] as string[] });

  const act = async (action: string, confirmText?: string, extra: Record<string, unknown> = {}) => {
    if (confirmText && !window.confirm(confirmText)) return false;
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api<Booking>(`/api/bookings/${b.id}`, { method: "PATCH", json: { action, note, ...extra } }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const maxClaim = b.depositAmount + 20000;

  return (
    <div className="dbju-active-rental-card" style={{ gap: "14px" }}>
      <div className="dbju-active-item-header">
        <div className="dbju-active-item-icon" style={{ background: b.product.accentColor, position: "relative", overflow: "hidden" }}>
          <ProductThumb image={b.product.image} categoryKey={b.product.categoryKey} iconSize={30} />
        </div>
        <div>
          <Link href={`/product/${b.product.id}`}>
            <h2 className="dbju-active-item-title" style={{ fontSize: "18px" }}>{b.product.name}</h2>
          </Link>
          <div className="dbju-active-item-sub">
            {formatRange(b.startDate, b.endDate)} · {b.days} {pluralDays(b.days)} · ви отримаєте{" "}
            <strong>{b.ownerPayout} ₴</strong>
            <span style={{ color: "var(--text-muted)" }}> (оренда {b.rentAmount} ₴ − комісія DBJU {b.ownerCommission} ₴)</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            Орендар: <Link href={`/users/${b.renter.id}`} style={{ fontWeight: 800, textDecoration: "underline" }}>{b.renter.name}</Link>
            {b.renter.phone && ` · ${b.renter.phone}`} · {DELIVERY_LABEL[b.deliveryMethod]}
            {b.deliveryMethod === "COURIER" && b.deliveryAddress && ` (${b.deliveryAddress})`}
          </div>
          <button type="button" className="dbju-btn-small" style={{ marginTop: "6px", padding: "4px 10px", fontSize: "12px" }} onClick={() => setChatOpen(true)}>
            💬 Написати орендарю
            {b.unreadMessages > 0 && <span className="dbju-unread-dot">{b.unreadMessages}</span>}
          </button>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <BookingStatusPill status={b.status} />
        </div>
      </div>

      <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
        Код замовлення: <strong>{b.code}</strong> · оплачено {formatDateTime(b.paidAt)}
        {b.pickedUpAt && ` · отримано ${formatDateTime(b.pickedUpAt)}`}
        {b.returnedAt && ` · повернено ${formatDateTime(b.returnedAt)}`}
      </div>

      {/* Фото стану «до» і «після» — порівняйте перед підтвердженням */}
      {(b.handoverPhotos.length > 0 || b.pickupPhotos.length > 0 || b.returnPhoto) && (
        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
          <PhotoStrip title="Ваші фото при передачі" photos={b.handoverPhotos} />
          <PhotoStrip title="Фото орендаря при отриманні" photos={b.pickupPhotos} />
          <PhotoStrip title="Фотозвіт повернення" photos={b.returnPhoto ? [b.returnPhoto] : []} />
        </div>
      )}

      {b.status === "PAID" && b.handoverPhotos.length === 0 && (
        <div className="dbju-ai-notice" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <span>📸 Перед передачею сфотографуйте стан речі — це ваш доказ, якщо при поверненні знайдуться пошкодження.</span>
          <PhotoPicker value={handover} onChange={setHandover} max={4} kind="report" label="Фото стану" />
          {handover.length > 0 && (
            <button type="button" className="dbju-btn-small primary" style={{ alignSelf: "flex-start" }} disabled={busy} onClick={() => act("handover", undefined, { photos: handover })}>
              Зберегти фото стану
            </button>
          )}
        </div>
      )}

      {b.status === "RETURNED" && !disputeOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontWeight: 800 }}>Перевірте стан речі: порівняйте фото при отриманні й поверненні</div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Коментар для орендаря (необов'язково)"
            className="dbju-form-input"
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" className="dbju-btn-primary" disabled={busy} onClick={() => act("complete")}>
              Підтвердити — річ у порядку
            </button>
            <button type="button" className="dbju-btn-small danger" disabled={busy} onClick={() => setDisputeOpen(true)}>
              Є пошкодження
            </button>
          </div>
        </div>
      )}

      {b.status === "RETURNED" && disputeOpen && (
        <div className="dbju-dispute-box">
          <strong>Повідомити про пошкодження</strong>
          <span style={{ fontSize: "13px" }}>
            Збиток покривається із застави ({b.depositAmount} ₴), а якщо її не вистачає — зі страхового фонду DBJU (до 20 000 ₴).
            Орендар може погодитися або оскаржити — тоді рішення ухвалить адміністратор за фото «до/після».
          </span>
          <textarea
            value={claim.reason}
            onChange={(e) => setClaim((c) => ({ ...c, reason: e.target.value }))}
            rows={3}
            maxLength={3000}
            placeholder="Що саме пошкоджено і як це сталося, на вашу думку"
            className="dbju-form-input"
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
          <label className="dbju-filter-label" style={{ color: "inherit" }}>
            Сума компенсації, ₴ (до {maxClaim})
            <input type="number" min={1} max={maxClaim} value={claim.amount} onChange={(e) => setClaim((c) => ({ ...c, amount: e.target.value }))} className="dbju-form-input" style={{ maxWidth: "200px" }} />
          </label>
          <PhotoPicker value={claim.photos} onChange={(photos) => setClaim((c) => ({ ...c, photos }))} max={6} kind="report" label="Фото пошкодження" />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="dbju-btn-small danger"
              disabled={busy || claim.reason.trim().length < 10 || !claim.amount || claim.photos.length === 0}
              onClick={async () => {
                if (await act("dispute", undefined, { reason: claim.reason, claimAmount: Number(claim.amount), photos: claim.photos })) setDisputeOpen(false);
              }}
            >
              Надіслати орендарю
            </button>
            <button type="button" className="dbju-btn-small" disabled={busy} onClick={() => setDisputeOpen(false)}>Скасувати</button>
          </div>
        </div>
      )}

      {b.status === "DISPUTED" && b.dispute && (
        <div className="dbju-dispute-box">
          <strong>Суперечка: ви просите {b.dispute.claimAmount} ₴</strong>
          <span>
            {b.dispute.status === "OPEN"
              ? "Чекаємо відповіді орендаря."
              : `Орендар оскаржив: «${b.dispute.renterResponse}». Рішення ухвалить адміністратор DBJU.`}
          </span>
          <PhotoStrip title="Фото пошкодження" photos={b.dispute.photos} />
        </div>
      )}

      {b.status === "PAID" && (
        <button
          type="button"
          className="dbju-btn-small danger"
          style={{ alignSelf: "flex-start" }}
          disabled={busy}
          onClick={() => act("cancel", "Відхилити бронювання? Орендар отримає повне повернення коштів.")}
        >
          Відхилити бронювання
        </button>
      )}

      {b.status === "PICKED_UP" && (
        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Річ у орендаря. Очікуємо повернення до {formatRange(b.endDate, b.endDate)}.</div>
      )}

      {error && <ErrorBox message={error} />}

      {chatOpen && (
        <BookingChat
          bookingId={b.id}
          title={`${b.product.name} · ${formatRange(b.startDate, b.endDate)}`}
          otherName={b.renter.name}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}

function ListingRow({
  product: p,
  onChanged,
  onDeleted,
}: {
  product: Product;
  onChanged: (p: Product) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleHidden = async () => {
    setBusy(true);
    setError(null);
    try {
      onChanged(
        await api<Product>(`/api/products/${p.id}`, {
          method: "PATCH",
          json: { status: p.status === "HIDDEN" ? "AVAILABLE" : "HIDDEN" },
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Видалити «${p.name}» назавжди?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
      setBusy(false);
    }
  };

  return (
    <div className="dbju-list-card">
      <div className="dbju-list-thumb" style={{ background: p.accentColor }}>
        <ProductThumb image={p.images[0]} categoryKey={p.categoryKey} iconSize={28} />
      </div>
      <div style={{ flex: 1, minWidth: "180px" }}>
        <Link href={`/product/${p.id}`} style={{ fontSize: "16px", fontWeight: 800 }}>{p.name}</Link>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          {p.category} · {p.rentalPricePerDay} ₴ / доба · {p.rentalCount} оренд · {p.location}
        </div>
      </div>
      {p.status === "HIDDEN" ? (
        <span className="dbju-status-pill hidden">Приховано</span>
      ) : p.status === "RENTED" ? (
        <span className="dbju-status-pill picked">В оренді</span>
      ) : (
        <span className="dbju-status-pill paid">Активне</span>
      )}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Link href={`/rent-out?edit=${p.id}`} className="dbju-btn-small">Редагувати</Link>
        <button type="button" className="dbju-btn-small" disabled={busy} onClick={toggleHidden}>
          {p.status === "HIDDEN" ? "Показати" : "Сховати"}
        </button>
        <button type="button" className="dbju-btn-small danger" disabled={busy} onClick={remove}>Видалити</button>
      </div>
      {error && <div style={{ width: "100%" }}><ErrorBox message={error} /></div>}
    </div>
  );
}
