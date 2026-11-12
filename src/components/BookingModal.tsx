"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "../types/product";
import { api } from "../lib/api";
import { addDays, daysInclusive, formatRange, MONTHS_NOM, parseISODate } from "../lib/dates";
import { DELIVERY_OPTIONS, SERVICE_FEE_RATE, pluralDays, quote, type DeliveryMethod } from "../lib/pricing";
import { useApp } from "./AppProvider";
import { ErrorBox } from "./LoginRequired";
import { isRentedNow, rentalLongLabel, rentalShortLabel } from "../lib/rentalStatus";
import {
  ArrowLeftIcon,
  UserIcon,
  ScooterIcon,
  ShieldCheckIcon,
  CheckIcon
} from "./Icons";

interface BookingModalProps {
  product: Product;
  onClose: () => void;
  initialDays?: number;
}

interface Range {
  start: string;
  end: string;
}

const MAX_AHEAD_DAYS = 90;
const MAX_DAYS = 30;

function isBooked(day: string, booked: Range[]) {
  return booked.some((r) => day >= r.start && day <= r.end);
}

function rangeIsFree(start: string, end: string, booked: Range[]) {
  return !booked.some((r) => r.start <= end && r.end >= start);
}

// Перший вільний проміжок потрібної довжини, починаючи з сьогодні
function firstFreeRange(today: string, days: number, booked: Range[]): Range | null {
  for (let i = 0; i <= MAX_AHEAD_DAYS; i++) {
    const start = addDays(today, i);
    const end = addDays(start, days - 1);
    if (rangeIsFree(start, end, booked)) return { start, end };
  }
  return null;
}

export const BookingModal = ({ product, onClose, initialDays }: BookingModalProps) => {
  const router = useRouter();
  const { user, isPlus, openAuth, refreshStats } = useApp();

  const [today, setToday] = useState<string | null>(null);
  const [rental, setRental] = useState<{ rentedUntil: string | null; rentalPhase: "IN_USE" | "RETURNING" | null }>({
    rentedUntil: product.rentedUntil,
    rentalPhase: product.rentalPhase,
  });
  const [booked, setBooked] = useState<Range[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PICKUP");
  const [courierAddress, setCourierAddress] = useState("");

  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Зайняті дати з бази
  useEffect(() => {
    api<{ today: string; booked: Range[]; rentedUntil: string | null; rentalPhase: "IN_USE" | "RETURNING" | null }>(`/api/products/${product.id}/availability`)
      .then((data) => {
        setToday(data.today);
        setRental({ rentedUntil: data.rentedUntil, rentalPhase: data.rentalPhase });
        setBooked(data.booked);
        const len = Math.max(initialDays ?? product.minRentDays, product.minRentDays);
        const free = firstFreeRange(data.today, len, data.booked);
        if (free) {
          setStartDate(free.start);
          setEndDate(free.end);
          const s = parseISODate(free.start);
          const t = parseISODate(data.today);
          setMonthOffset((s.getUTCFullYear() - t.getUTCFullYear()) * 12 + s.getUTCMonth() - t.getUTCMonth());
        }
      })
      .catch(() => setError("Не вдалося завантажити календар"));
  }, [product.id, product.minRentDays, initialDays]);

  const lastBookable = today ? addDays(today, MAX_AHEAD_DAYS) : null;
  const daysCount = startDate && endDate ? daysInclusive(startDate, endDate) : 0;

  const prices = useMemo(
    () =>
      quote(
        {
          pricePerDay: product.rentalPricePerDay,
          price3Days: product.pricingTiers.threeDays,
          priceWeek: product.pricingTiers.week,
        },
        Math.max(daysCount, 1),
        deliveryMethod,
        isPlus
      ),
    [product, daysCount, deliveryMethod, isPlus]
  );

  // Сітка місяця (тиждень з понеділка)
  const month = useMemo(() => {
    if (!today) return null;
    const t = parseISODate(today);
    const first = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + monthOffset, 1));
    const year = first.getUTCFullYear();
    const m = first.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7;
    const cells: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return { title: `${MONTHS_NOM[m]} ${year}`, cells };
  }, [today, monthOffset]);

  const maxOffset = 3;

  const handleDayClick = (day: string) => {
    setError(null);
    if (!startDate || (startDate && endDate)) {
      // Новий вибір: одразу ставимо мінімальний термін, якщо він вільний
      const minEnd = addDays(day, product.minRentDays - 1);
      if (product.minRentDays > 1 && rangeIsFree(day, minEnd, booked) && lastBookable && minEnd <= lastBookable) {
        setStartDate(day);
        setEndDate(minEnd);
      } else {
        setStartDate(day);
        setEndDate(product.minRentDays > 1 ? null : day);
      }
      return;
    }
    // Вибір дати повернення
    if (day < startDate) {
      setStartDate(day);
      setEndDate(null);
      return;
    }
    if (!rangeIsFree(startDate, day, booked)) {
      setError("У вибраному проміжку є зайняті дні");
      return;
    }
    const len = daysInclusive(startDate, day);
    if (len > MAX_DAYS) {
      setError(`Максимальний термін оренди — ${MAX_DAYS} днів`);
      return;
    }
    if (len < product.minRentDays) {
      setError(`Мінімальний термін оренди — ${product.minRentDays} дн.`);
      return;
    }
    setEndDate(day);
  };

  const handlePay = async () => {
    if (!user) {
      openAuth("LOGIN");
      return;
    }
    if (!startDate || !endDate) {
      setError("Оберіть дати отримання та повернення");
      return;
    }
    if (deliveryMethod === "COURIER" && !courierAddress.trim()) {
      setError("Вкажіть адресу доставки");
      return;
    }
    setIsPaying(true);
    setError(null);
    try {
      await api("/api/bookings", {
        method: "POST",
        json: {
          productId: product.id,
          startDate,
          endDate,
          deliveryMethod,
          deliveryAddress: courierAddress,
        },
      });
      setIsSuccess(true);
      refreshStats();
      setTimeout(() => {
        onClose();
        router.push("/rentals");
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося оформити бронювання");
      // Дати могли зайняти — оновлюємо календар
      api<{ today: string; booked: Range[] }>(`/api/products/${product.id}/availability`)
        .then((d) => setBooked(d.booked))
        .catch(() => {});
    } finally {
      setIsPaying(false);
    }
  };

  const isOwnProduct = user?.id === product.ownerId;

  const deliveryCards: { key: DeliveryMethod; icon: React.ReactNode; sub: string }[] = [
    { key: "PICKUP", icon: <UserIcon size={20} />, sub: `У власника: ${product.location}` },
    { key: "COURIER", icon: <ScooterIcon size={20} />, sub: "До дверей за 2 год" },
  ];

  return (
    <div className="dbju-booking-modal-overlay" onClick={onClose}>
      <div
        className="dbju-booking-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dbju-booking-header">
          <button
            type="button"
            className="dbju-gallery-back-btn"
            style={{ position: "static" }}
            onClick={onClose}
          >
            <ArrowLeftIcon size={20} />
          </button>
          <h2 className="dbju-booking-title">Бронювання</h2>
          <div style={{ width: 44 }} /> {/* balance spacer */}
        </div>

        <div style={{ fontSize: "14px", fontWeight: 800, textAlign: "center", marginTop: "-6px" }}>{product.name}</div>

        {isSuccess ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--brand-green)",
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px"
              }}
            >
              <CheckIcon size={32} />
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: "900", marginBottom: "8px" }}>
              Оренду успішно оформлено!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>
              Код доступу та всі етапи — у розділі <strong>«Мої оренди»</strong>.
            </p>
          </div>
        ) : isRentedNow(rental) ? (
          <div className="dbju-rented-banner" style={{ margin: "12px 0" }}>
            <strong>🔒 {rentalShortLabel(rental)}</strong>
            <span>{rentalLongLabel(rental)}</span>
            <button type="button" className="dbju-btn-secondary" style={{ alignSelf: "flex-start", marginTop: "6px" }} onClick={onClose}>
              Зрозуміло
            </button>
          </div>
        ) : isOwnProduct ? (
          <div style={{ textAlign: "center", padding: "32px 12px", color: "var(--text-secondary)" }}>
            Це ваше оголошення — орендувати власну річ не можна.
          </div>
        ) : (
          <>
            {/* Calendar widget */}
            <div className="dbju-calendar-card">
              <div className="dbju-cal-head">
                <div className="dbju-cal-nav">
                  <button type="button" disabled={monthOffset <= 0} onClick={() => setMonthOffset((m) => m - 1)} aria-label="Попередній місяць">‹</button>
                  <span className="dbju-cal-month">{month?.title ?? "…"}</span>
                  <button type="button" disabled={monthOffset >= maxOffset} onClick={() => setMonthOffset((m) => m + 1)} aria-label="Наступний місяць">›</button>
                </div>
                <span className="dbju-cal-range-text">
                  {startDate && endDate
                    ? `${formatRange(startDate, endDate)} · ${daysCount} ${pluralDays(daysCount)}`
                    : startDate
                      ? "оберіть дату повернення"
                      : "оберіть дату отримання"}
                </span>
              </div>

              <div className="dbju-cal-weekdays">
                <span>Пн</span>
                <span>Вт</span>
                <span>Ср</span>
                <span>Чт</span>
                <span>Пт</span>
                <span>Сб</span>
                <span>Нд</span>
              </div>

              <div className="dbju-cal-days">
                {month?.cells.map((day, idx) => {
                  if (!day) return <div key={`e${idx}`} className="dbju-cal-day empty" />;
                  const past = today !== null && day < today;
                  const tooFar = lastBookable !== null && day > lastBookable;
                  const busy = isBooked(day, booked);
                  const disabled = past || tooFar || busy;
                  const isStart = day === startDate;
                  const isEnd = day === endDate;
                  const inRange = startDate && endDate && day > startDate && day < endDate;

                  let dayClass = "dbju-cal-day";
                  if (busy) dayClass += " booked";
                  else if (disabled) dayClass += " disabled";
                  if (isStart || isEnd) dayClass += " selected-edge";
                  else if (inRange) dayClass += " selected-range";

                  return (
                    <div
                      key={day}
                      className={dayClass}
                      style={{ opacity: past || tooFar ? 0.35 : 1 }}
                      title={busy ? "Зайнято" : undefined}
                      onClick={() => !disabled && handleDayClick(day)}
                    >
                      {Number(day.slice(8))}
                    </div>
                  );
                })}
              </div>
              {(booked.length > 0 || product.minRentDays > 1) && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                  {booked.length > 0 && <span style={{ color: "#DC2626" }}>Закреслені дні — зайняті. </span>}
                  {product.minRentDays > 1 && <span>Мінімальний термін: {product.minRentDays} дн.</span>}
                </div>
              )}
            </div>

            {/* Delivery Method ("Як отримати") */}
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: "900", marginBottom: "12px" }}>
                Як отримати
              </h4>
              <div className="dbju-delivery-options">
                {deliveryCards.map((c) => {
                  const cost = DELIVERY_OPTIONS[c.key].cost;
                  return (
                    <div
                      key={c.key}
                      className={`dbju-delivery-card ${deliveryMethod === c.key ? "active" : ""}`}
                      onClick={() => setDeliveryMethod(c.key)}
                    >
                      <div className="dbju-delivery-left">
                        <div className="dbju-radio-circle">
                          {deliveryMethod === c.key && <div className="dbju-radio-dot" />}
                        </div>
                        {c.icon}
                        <div>
                          <div className="dbju-delivery-title">{DELIVERY_OPTIONS[c.key].title}</div>
                          <div className="dbju-delivery-sub">{c.sub}</div>
                        </div>
                      </div>
                      <div className="dbju-delivery-price">{cost} ₴</div>
                    </div>
                  );
                })}
              </div>
              {deliveryMethod === "COURIER" && (
                <input
                  type="text"
                  value={courierAddress}
                  onChange={(e) => setCourierAddress(e.target.value)}
                  placeholder="Адреса доставки: вулиця, будинок, квартира"
                  maxLength={255}
                  className="dbju-form-input"
                  style={{ marginTop: "10px", width: "100%" }}
                />
              )}
            </div>

            {/* DBJU Захист — включено в кожну оренду (страховий фонд з комісії платформи) */}
            <div className="dbju-protection-card">
              <div className="dbju-protection-left">
                <ShieldCheckIcon size={24} color="var(--brand-green)" />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "800" }}>
                    DBJU Захист включено
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Пошкодження покривається із застави, а понад неї — зі страхового фонду DBJU
                  </div>
                </div>
              </div>
              <CheckIcon size={20} color="var(--brand-green)" />
            </div>

            {/* Receipt Cost Breakdown */}
            <div className="dbju-receipt">
              <div className="dbju-receipt-row">
                <span>Оренда, {Math.max(daysCount, 1)} {pluralDays(Math.max(daysCount, 1))}</span>
                <span>{prices.rentAmount} ₴</span>
              </div>
              <div className="dbju-receipt-row">
                <span>Сервісний збір ({Math.round(SERVICE_FEE_RATE * 100)}%) · гарантія безпечної угоди</span>
                {isPlus ? (
                  <span style={{ color: "var(--brand-green)" }}>
                    <s style={{ color: "var(--text-muted)", marginRight: "6px" }}>{prices.plusSaving} ₴</s>0 ₴ з DBJU+
                  </span>
                ) : (
                  <span>{prices.serviceFee} ₴</span>
                )}
              </div>
              {deliveryMethod === "COURIER" && (
                <div className="dbju-receipt-row">
                  <span>{DELIVERY_OPTIONS.COURIER.title}</span>
                  <span>{prices.deliveryCost} ₴</span>
                </div>
              )}

              <div className="dbju-receipt-divider" />

              <div className="dbju-receipt-total">
                <span>Разом</span>
                <span>{prices.totalAmount} ₴</span>
              </div>

              <div className="dbju-deposit-note">
                Застава {product.depositAmount} ₴ лише блокується на картці і повертається після того, як власник підтвердить повернення речі.
              </div>
            </div>

            {error && <ErrorBox message={error} />}

            {/* Action Pay Button */}
            <button
              type="button"
              className="dbju-btn-primary"
              style={{ width: "100%", padding: "16px", fontSize: "17px", borderRadius: "var(--radius-lg)" }}
              onClick={handlePay}
              disabled={isPaying || !today}
            >
              {!user
                ? "Увійти, щоб забронювати"
                : isPaying
                  ? "Оплата..."
                  : startDate && endDate
                    ? `Оплатити ${prices.totalAmount} ₴`
                    : "Оберіть дати"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
