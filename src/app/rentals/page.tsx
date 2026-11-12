"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CameraIcon,
  CheckIcon,
  QRCodePattern,
  RefreshIcon,
  SparkleIcon,
  ShieldCheckIcon,
} from "../../components/Icons";
import { Footer } from "../../components/Footer/Footer";
import { useApp } from "../../components/AppProvider";
import { LoginRequired, PageLoading, EmptyState, ErrorBox } from "../../components/LoginRequired";
import { ProductThumb } from "../../components/ProductThumb";
import { BookingStatusPill, DELIVERY_LABEL } from "../../components/BookingStatus";
import { ReviewModal } from "../../components/Reviews";
import { api, uploadImage } from "../../lib/api";
import { daysInclusive, formatDateTime, formatDay, formatRange, todayISO } from "../../lib/dates";
import { pluralDays, rentCost } from "../../lib/pricing";
import type { Booking } from "../../types/booking";

type Tab = "ACTIVE" | "PLANNED" | "HISTORY";

function tabOf(b: Booking, today: string): Tab {
  if (b.status === "COMPLETED" || b.status === "CANCELLED") return "HISTORY";
  if (b.status === "PAID" && b.startDate > today) return "PLANNED";
  return "ACTIVE";
}

export default function RentalsPage() {
  const { user, loading: authLoading, refreshStats } = useApp();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("ACTIVE");
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  const [returnBooking, setReturnBooking] = useState<Booking | null>(null);
  const [extendBooking, setExtendBooking] = useState<Booking | null>(null);
  const today = todayISO();

  const load = useCallback(async () => {
    try {
      setBookings(await api<Booking[]>("/api/bookings?role=renter"));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Не вдалося завантажити оренди");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження даних з API
    if (user) load();
  }, [user, load]);

  const replace = (b: Booking) => {
    setBookings((prev) => prev?.map((x) => (x.id === b.id ? b : x)) ?? null);
    refreshStats();
  };

  const grouped = useMemo(() => {
    const g: Record<Tab, Booking[]> = { ACTIVE: [], PLANNED: [], HISTORY: [] };
    for (const b of bookings ?? []) g[tabOf(b, today)].push(b);
    g.HISTORY.reverse();
    return g;
  }, [bookings, today]);

  if (authLoading) return <PageLoading />;

  return (
    <>
      <div className="dbju-page-container" style={{ maxWidth: "860px" }}>
        {/* Page Title */}
        <div className="dbju-rentals-header">
          <h1 className="dbju-main-title" style={{ fontSize: "36px" }}>
            Мої оренди
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginTop: "4px" }}>
            Керуйте замовленнями, забирайте речі та здавайте фотозвіти при поверненні
          </p>
        </div>

        {!user ? (
          <LoginRequired title="Увійдіть, щоб побачити оренди" text="Тут з'являться всі ваші бронювання з кодами доступу та етапами оренди." />
        ) : loadError ? (
          <ErrorBox message={loadError} />
        ) : !bookings ? (
          <PageLoading />
        ) : (
          <>
            {/* Status Tabs */}
            <div className="dbju-rentals-tabs">
              {([
                ["ACTIVE", "Активні"],
                ["PLANNED", "Заплановані"],
                ["HISTORY", "Історія"],
              ] as [Tab, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`dbju-rentals-tab-btn ${activeTab === key ? "active" : ""}`}
                  onClick={() => setActiveTab(key)}
                >
                  {label}{grouped[key].length > 0 && ` · ${grouped[key].length}`}
                </button>
              ))}
            </div>

            {grouped[activeTab].length === 0 ? (
              <EmptyState
                icon={activeTab === "HISTORY" ? "📦" : "🗓️"}
                title={
                  activeTab === "ACTIVE"
                    ? "Активних оренд немає"
                    : activeTab === "PLANNED"
                      ? "Запланованих оренд немає"
                      : "Історія оренд порожня"
                }
                text={activeTab === "HISTORY" ? "Тут з'являтимуться завершені та скасовані оренди." : "Оберіть річ у каталозі та забронюйте її на потрібні дати."}
              >
                {activeTab !== "HISTORY" && (
                  <Link href="/#catalog" className="dbju-btn-primary">Перейти до каталогу</Link>
                )}
              </EmptyState>
            ) : activeTab === "HISTORY" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {grouped.HISTORY.map((b) => (
                  <HistoryCard key={b.id} booking={b} onReviewed={load} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {grouped[activeTab].map((b) => (
                  <RentalCard
                    key={b.id}
                    booking={b}
                    today={today}
                    onUpdate={replace}
                    onShowQr={() => setQrBooking(b)}
                    onReturn={() => setReturnBooking(b)}
                    onExtend={() => setExtendBooking(b)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {qrBooking && <QrModal booking={qrBooking} onClose={() => setQrBooking(null)} />}
      {returnBooking && (
        <ReturnModal
          booking={returnBooking}
          onClose={() => setReturnBooking(null)}
          onDone={(b) => {
            replace(b);
          }}
        />
      )}
      {extendBooking && (
        <ExtendModal
          booking={extendBooking}
          onClose={() => setExtendBooking(null)}
          onDone={(b) => {
            replace(b);
            setExtendBooking(null);
          }}
        />
      )}

      <Footer />
    </>
  );
}

/* ---------- Картка активної / запланованої оренди ---------- */

function Step({ state, name, time }: { state: "completed" | "current" | "pending"; name: string; time: string }) {
  return (
    <div className="dbju-step-row">
      <div className="dbju-step-left">
        <div className={`dbju-step-bullet ${state}`}>{state === "completed" && <CheckIcon size={14} />}</div>
        <span className="dbju-step-name" style={state === "pending" ? { color: "var(--text-muted)" } : undefined}>
          {name}
        </span>
      </div>
      <span
        className="dbju-step-time"
        style={state === "current" ? { color: "var(--brand-green)", fontWeight: 700 } : undefined}
      >
        {time}
      </span>
    </div>
  );
}

function RentalCard({
  booking: b,
  today,
  onUpdate,
  onShowQr,
  onReturn,
  onExtend,
}: {
  booking: Booking;
  today: string;
  onUpdate: (b: Booking) => void;
  onShowQr: () => void;
  onReturn: () => void;
  onExtend: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api<Booking>(`/api/bookings/${b.id}`, { method: "PATCH", json: { action } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  const daysLeft = daysInclusive(today, b.endDate);
  const overdue = b.status === "PICKED_UP" && today > b.endDate;
  const canPickup = b.status === "PAID" && today >= b.startDate;
  const placeText =
    b.deliveryMethod === "COURIER"
      ? `Кур'єр привезе за адресою: ${b.deliveryAddress}`
      : `${DELIVERY_LABEL[b.deliveryMethod]}: ${b.deliveryAddress ?? b.product.location}`;

  return (
    <div className="dbju-active-rental-card">
      {/* Item Title & Price Row */}
      <div className="dbju-active-item-header">
        <div className="dbju-active-item-icon" style={{ background: b.product.accentColor, position: "relative", overflow: "hidden" }}>
          <ProductThumb image={b.product.image} categoryKey={b.product.categoryKey} iconSize={32} />
        </div>

        <div>
          <Link href={`/product/${b.product.id}`}>
            <h2 className="dbju-active-item-title">{b.product.name}</h2>
          </Link>
          <div className="dbju-active-item-sub">
            {formatRange(b.startDate, b.endDate)} · {b.days} {pluralDays(b.days)} · {b.totalAmount} ₴
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Власник: <Link href={`/users/${b.owner.id}`} style={{ fontWeight: 700, textDecoration: "underline" }}>{b.owner.name}</Link>
            {b.owner.phone && ` · ${b.owner.phone}`}
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <BookingStatusPill status={b.status} />
          {b.protection && (
            <span className="dbju-diia-badge">
              <ShieldCheckIcon size={12} />
              <span>Захист DBJU</span>
            </span>
          )}
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="dbju-stepper">
        <Step state="completed" name="Оплачено" time={formatDateTime(b.paidAt)} />
        <Step
          state={b.pickedUpAt ? "completed" : "current"}
          name="Отримано"
          time={b.pickedUpAt ? formatDateTime(b.pickedUpAt) : `з ${formatDay(b.startDate)}`}
        />
        <Step
          state={b.returnedAt ? "completed" : b.status === "PICKED_UP" ? "current" : "pending"}
          name="Користуєтесь"
          time={
            b.status === "PICKED_UP"
              ? overdue
                ? "термін минув!"
                : `ще ${daysLeft} ${pluralDays(daysLeft)}`
              : `${b.days} ${pluralDays(b.days)}`
          }
        />
        <Step
          state={b.returnedAt ? "completed" : "pending"}
          name="Повернення + фотозвіт"
          time={b.returnedAt ? formatDateTime(b.returnedAt) : `до ${formatDay(b.endDate)}, 20:00`}
        />
        <Step
          state={b.status === "RETURNED" ? "current" : "pending"}
          name="Власник підтвердив, застава повернута"
          time={b.status === "RETURNED" ? "очікуємо" : `${b.depositAmount} ₴`}
        />
      </div>

      {/* Code box */}
      {(b.status === "PAID" || b.status === "PICKED_UP") && (
        <div className="dbju-postomat-qr-box">
          <div
            className="dbju-qr-pattern-wrap"
            style={{ cursor: "pointer" }}
            onClick={onShowQr}
            title="Натисніть для збільшення QR-коду"
          >
            <QRCodePattern size={80} />
          </div>

          <div className="dbju-postomat-qr-info">
            <h3 className="dbju-qr-title">
              {b.status === "PAID" ? "Код для отримання" : "Код для повернення"} · {b.code}
            </h3>
            <p className="dbju-qr-desc">{placeText}</p>
            <button
              type="button"
              onClick={onShowQr}
              style={{ fontSize: "13px", fontWeight: "700", color: "var(--brand-green)", textAlign: "left", marginTop: "4px" }}
            >
              Показати QR на весь екран →
            </button>
          </div>
        </div>
      )}

      {b.status === "RETURNED" && (
        <div className="dbju-ai-notice">
          <SparkleIcon size={20} color="var(--brand-green)" style={{ flexShrink: 0 }} />
          <span>
            Фотозвіт отримано. Щойно власник підтвердить стан речі, застава {b.depositAmount} ₴ автоматично
            розблокується на вашій картці.
          </span>
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {/* Action Buttons */}
      {(b.status === "PAID" || b.status === "PICKED_UP") && (
        <div className="dbju-rental-actions">
          {b.status === "PAID" && (
            <button
              type="button"
              className="dbju-btn-photoreport"
              disabled={busy || !canPickup}
              onClick={() => act("pickup")}
              title={canPickup ? undefined : `Забрати можна з ${formatDay(b.startDate)}`}
              style={!canPickup ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
            >
              <CheckIcon size={18} />
              <span>{canPickup ? "Я забрав річ" : `Забрати з ${formatDay(b.startDate)}`}</span>
            </button>
          )}

          <button type="button" className="dbju-btn-extend" onClick={onExtend} disabled={busy}>
            <RefreshIcon size={18} />
            <span>Продовжити оренду</span>
          </button>

          {b.status === "PICKED_UP" && (
            <button type="button" className="dbju-btn-photoreport" onClick={onReturn} disabled={busy}>
              <CameraIcon size={18} />
              <span>Повернути + фотозвіт</span>
            </button>
          )}
        </div>
      )}

      {b.status === "PAID" && (
        <button
          type="button"
          className="dbju-btn-small danger"
          style={{ alignSelf: "flex-start" }}
          disabled={busy}
          onClick={() => act("cancel", "Скасувати бронювання? Кошти повернуться на картку.")}
        >
          Скасувати бронювання
        </button>
      )}
    </div>
  );
}

/* ---------- Історія ---------- */

function HistoryCard({ booking: b, onReviewed }: { booking: Booking; onReviewed: () => void }) {
  const [reviewing, setReviewing] = useState(false);
  const canReview = b.status === "COMPLETED" && !b.reviewedByRenter;
  return (
    <>
    <div className="dbju-list-card">
      <div className="dbju-list-thumb" style={{ background: b.product.accentColor }}>
        <ProductThumb image={b.product.image} categoryKey={b.product.categoryKey} iconSize={28} />
      </div>
      <div style={{ flex: 1, minWidth: "180px" }}>
        <Link href={`/product/${b.product.id}`} style={{ fontSize: "16px", fontWeight: 800 }}>
          {b.product.name}
        </Link>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          {formatRange(b.startDate, b.endDate)} · {b.totalAmount} ₴ · {b.code}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Власник: <Link href={`/users/${b.owner.id}`} style={{ fontWeight: 700, color: "var(--text-secondary)" }}>{b.owner.name}</Link>
          {b.status === "COMPLETED" && b.reviewedByRenter && " · ✓ відгук залишено"}
        </div>
        {b.ownerNote && (
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Коментар власника: «{b.ownerNote}»
          </div>
        )}
      </div>
      <BookingStatusPill status={b.status} />
      {canReview && (
        <button type="button" className="dbju-btn-small primary" onClick={() => setReviewing(true)}>
          ★ Залишити відгук
        </button>
      )}
      <Link href={`/product/${b.product.id}`} className="dbju-btn-small">
        Орендувати знову
      </Link>
    </div>
    {reviewing && (
      <ReviewModal
        bookingId={b.id}
        targetName={b.owner.name}
        aboutRole="OWNER"
        onClose={() => setReviewing(false)}
        onDone={onReviewed}
      />
    )}
    </>
  );
}

/* ---------- Модалки ---------- */

function QrModal({ booking: b, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div className="dbju-booking-modal-overlay" onClick={onClose}>
      <div className="dbju-booking-modal" style={{ maxWidth: "420px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: "20px", fontWeight: "900" }}>
          {b.status === "PAID" ? "Код отримання" : "Код повернення"}
        </h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Покажіть цей код власнику або кур&apos;єру
        </p>
        <div style={{ background: "#FFFFFF", padding: "24px", borderRadius: "20px", margin: "16px auto", display: "inline-block", border: "2px solid var(--border-subtle)" }}>
          <QRCodePattern size={220} />
        </div>
        <div style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "2px", color: "var(--brand-green)" }}>{b.code}</div>
        <button type="button" className="dbju-btn-primary" style={{ width: "100%", marginTop: "16px" }} onClick={onClose}>
          Зрозуміло
        </button>
      </div>
    </div>
  );
}

function ReturnModal({ booking: b, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: (b: Booking) => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setPhoto(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити фото");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!photo) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await api<Booking>(`/api/bookings/${b.id}`, { method: "PATCH", json: { action: "return", photo } }));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dbju-booking-modal-overlay" onClick={onClose}>
      <div className="dbju-booking-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: "22px", fontWeight: "900" }}>Повернення та фотозвіт</h3>
        {done ? (
          <>
            <div style={{ background: "var(--pastel-sage)", borderRadius: "18px", padding: "24px", textAlign: "center" }}>
              <div style={{ color: "var(--brand-green)", fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>✓ Річ повернено, фотозвіт надіслано</div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Власник перевірить стан, і застава {b.depositAmount} ₴ повернеться на картку.
              </div>
            </div>
            <button type="button" className="dbju-btn-primary" style={{ width: "100%" }} onClick={onClose}>Готово</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Передайте річ власнику (або кур&apos;єру) і сфотографуйте її. Фото побачить власник, щоб підтвердити стан.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              hidden
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <div
              onClick={() => !busy && fileRef.current?.click()}
              style={{
                border: "2px dashed var(--border-strong)",
                borderRadius: "18px",
                minHeight: "180px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background: photo ? "var(--pastel-sage)" : "#FFFFFF",
                cursor: "pointer",
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Фотозвіт" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div>
                  <CameraIcon size={36} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                  <div style={{ fontSize: "15px", fontWeight: "800" }}>{busy ? "Завантаження..." : "Зробити або прикріпити фото"}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>JPG, PNG або WEBP до 5 МБ</div>
                </div>
              )}
            </div>
            {error && <ErrorBox message={error} />}
            <button type="button" className="dbju-btn-primary" style={{ width: "100%" }} disabled={!photo || busy} onClick={submit}>
              {busy ? "Зачекайте..." : "Підтвердити повернення"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ExtendModal({ booking: b, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: (b: Booking) => void }) {
  const [days, setDays] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const priceInput = b.product;
  // Орієнтовна доплата (без знижки DBJU+); точну суму рахує сервер
  const extra = (d: number) => Math.max(0, rentCost(priceInput, b.days + d) - rentCost(priceInput, b.days));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      onDone(await api<Booking>(`/api/bookings/${b.id}`, { method: "PATCH", json: { action: "extend", days } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dbju-booking-modal-overlay" onClick={onClose}>
      <div className="dbju-booking-modal" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: "20px", fontWeight: "900" }}>Продовження оренди</h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Зараз до {formatDay(b.endDate)}. Оберіть кількість додаткових днів:
        </p>
        <div style={{ display: "flex", gap: "10px", margin: "16px 0" }}>
          {[1, 2, 3, 7].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              style={{
                flex: 1,
                padding: "12px 4px",
                borderRadius: "14px",
                border: days === d ? "2px solid var(--brand-green)" : "1px solid var(--border-subtle)",
                background: days === d ? "var(--brand-green-light)" : "#FFFFFF",
                fontWeight: "800",
                fontSize: "14px",
                color: days === d ? "var(--brand-green)" : "var(--text-primary)",
              }}
            >
              +{d} {pluralDays(d)}
              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>≈ {extra(d)} ₴</div>
            </button>
          ))}
        </div>
        {error && <ErrorBox message={error} />}
        <button type="button" className="dbju-btn-primary" style={{ width: "100%" }} disabled={busy} onClick={submit}>
          {busy ? "Зачекайте..." : `Продовжити на ${days} ${pluralDays(days)}`}
        </button>
      </div>
    </div>
  );
}
