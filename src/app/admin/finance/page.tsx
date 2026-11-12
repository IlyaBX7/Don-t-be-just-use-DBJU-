"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "../../../components/Icons";
import { Footer } from "../../../components/Footer/Footer";
import { useApp } from "../../../components/AppProvider";
import { LoginRequired, PageLoading, ErrorBox, EmptyState } from "../../../components/LoginRequired";
import { api } from "../../../lib/api";
import { MONTHS_NOM } from "../../../lib/dates";
import {
  ACQUIRING_RATE,
  DELIVERY_OPTIONS,
  FIXED_COSTS_MONTHLY,
  INSURANCE_FUND_RATE,
  OWNER_COMMISSION_RATE,
  SERVICE_FEE_RATE,
  SINGLE_TAX_RATE,
  SUPPORT_COST_PER_ORDER,
  breakEvenOrders,
  quote,
  unitEconomics,
} from "../../../lib/pricing";

interface MonthTotals {
  month: string;
  orders: number;
  gmv: number;
  paidByRenters: number;
  serviceFees: number;
  ownerCommissions: number;
  revenue: number;
  ownerPayouts: number;
  delivery: number;
  acquiring: number;
  insurance: number;
  support: number;
  tax: number;
  margin: number;
  fixedCosts: number;
  profit: number;
}

interface FinanceData {
  month: string;
  isCurrentMonth: boolean;
  totals: MonthTotals;
  previous: MonthTotals;
  trend: MonthTotals[];
  perOrder: { gmv: number; revenue: number; margin: number } | null;
  breakEven: { fixedCosts: number; ordersNeeded: number | null; basedOn: "actual" | "model"; marginPerOrder: number };
  pipeline: { orders: number; gmv: number; revenue: number };
}

const uah = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(Math.round(n)).toLocaleString("uk-UA")} ₴`;
const num = (n: number) => Math.round(n).toLocaleString("uk-UA");
const pct = (r: number) => `${(r * 100).toLocaleString("uk-UA", { maximumFractionDigits: 1 })}%`;
const monthName = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTHS_NOM[mm - 1]} ${y}`;
};

function Delta({ now, before, goodWhenUp = true, money = true }: { now: number; before: number; goodWhenUp?: boolean; money?: boolean }) {
  const d = now - before;
  if (d === 0) return <span className="dbju-kpi-delta flat">без змін до мин. міс.</span>;
  const good = d > 0 === goodWhenUp;
  return (
    <span className={`dbju-kpi-delta ${good ? "good" : "bad"}`}>
      {d > 0 ? "▲" : "▼"} {money ? uah(Math.abs(d)) : num(Math.abs(d))} до мин. міс.
    </span>
  );
}

export default function FinancePage() {
  const { user, loading } = useApp();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [fixed, setFixed] = useState(String(FIXED_COSTS_MONTHLY));
  const [data, setData] = useState<FinanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    const t = setTimeout(() => {
      api<FinanceData>(`/api/admin/finance?month=${month}&fixed=${Number(fixed) || 0}`)
        .then((d) => {
          setData(d);
          setError(null);
        })
        .catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(t);
  }, [user, month, fixed]);

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="dbju-page-container" style={{ maxWidth: "1100px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Link href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
            <ArrowLeftIcon size={16} />
            <span>Профіль</span>
          </Link>
        </div>
        <h1 className="dbju-main-title" style={{ fontSize: "34px" }}>Фінанси платформи</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", margin: "4px 0 20px" }}>
          Розрахунок за фінансовою моделлю DBJU: комісія {pct(SERVICE_FEE_RATE)} з орендаря + {pct(OWNER_COMMISSION_RATE)} з власника.
          Враховуються лише завершені оренди.
        </p>

        {!user ? (
          <LoginRequired title="Увійдіть як адміністратор" text="Ця сторінка доступна лише адміністраторам DBJU." />
        ) : user.role !== "ADMIN" ? (
          <EmptyState icon="🔒" title="Доступ лише для адміністратора" text="Ця сторінка показує фінанси всієї платформи." />
        ) : (
          <>
            <div className="dbju-finance-controls">
              <label className="dbju-filter-label">
                Місяць
                <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="dbju-form-input" />
              </label>
              <label className="dbju-filter-label">
                Постійні витрати, ₴/міс
                <input type="number" min={0} step={1000} value={fixed} onChange={(e) => setFixed(e.target.value)} className="dbju-form-input" />
              </label>
            </div>

            {error && <ErrorBox message={error} />}
            {!data ? (
              <PageLoading />
            ) : (
              <FinanceReport data={data} />
            )}

            <DealCalculator />
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

function FinanceReport({ data }: { data: FinanceData }) {
  const t = data.totals;
  const p = data.previous;
  const be = data.breakEven;
  const progress = be.ordersNeeded ? Math.min(t.orders / be.ordersNeeded, 1) : 0;
  const reached = be.ordersNeeded !== null && t.orders >= be.ordersNeeded;
  const profitability = t.revenue > 0 ? t.profit / t.revenue : null;
  const per = (v: number) => (t.orders ? uah(v / t.orders) : "—");

  return (
    <>
      {/* Ключові показники */}
      <div className="dbju-kpi-row">
        <div className="dbju-kpi">
          <span className="dbju-kpi-label">Завершених оренд</span>
          <strong className="dbju-kpi-value">{num(t.orders)}</strong>
          <Delta now={t.orders} before={p.orders} money={false} />
        </div>
        <div className="dbju-kpi">
          <span className="dbju-kpi-label">Оборот оренд (GMV)</span>
          <strong className="dbju-kpi-value">{uah(t.gmv)}</strong>
          <Delta now={t.gmv} before={p.gmv} />
        </div>
        <div className="dbju-kpi">
          <span className="dbju-kpi-label">Дохід DBJU</span>
          <strong className="dbju-kpi-value">{uah(t.revenue)}</strong>
          <Delta now={t.revenue} before={p.revenue} />
        </div>
        <div className="dbju-kpi">
          <span className="dbju-kpi-label">Маржинальний дохід</span>
          <strong className="dbju-kpi-value">{uah(t.margin)}</strong>
          <Delta now={t.margin} before={p.margin} />
        </div>
        <div className="dbju-kpi">
          <span className="dbju-kpi-label">Прибуток</span>
          <strong className="dbju-kpi-value">{uah(t.profit)}</strong>
          <span className="dbju-kpi-delta flat">
            {profitability !== null ? `рентабельність ${pct(profitability)}` : "доходу ще немає"}
          </span>
        </div>
      </div>

      {/* Точка беззбитковості */}
      <section className="dbju-help-section dbju-finance-section">
        <h2>Точка беззбитковості · {monthName(data.month)}</h2>
        <p>
          Постійні витрати {uah(be.fixedCosts)} / маржа {uah(be.marginPerOrder)} з замовлення
          {be.basedOn === "model" ? " (за моделлю — фактичних замовлень ще немає)" : " (фактична середня за місяць)"}
          {" = "}
          <strong>{be.ordersNeeded !== null ? `${num(be.ordersNeeded)} замовлень на місяць` : "недосяжна: маржа ≤ 0"}</strong>
          {be.ordersNeeded !== null && ` (≈ ${num(be.ordersNeeded / 30)} на день)`}.
        </p>
        <div
          className="dbju-meter"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={be.ordersNeeded ?? 0}
          aria-valuenow={t.orders}
          aria-label="Прогрес до точки беззбитковості"
        >
          <div className="dbju-meter-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px", flexWrap: "wrap", gap: "6px" }}>
          <span>{num(t.orders)} з {be.ordersNeeded !== null ? num(be.ordersNeeded) : "—"} ({pct(progress)})</span>
          <span>
            {reached
              ? "✅ Беззбитковість досягнута"
              : be.ordersNeeded !== null
                ? `Ще ${num(be.ordersNeeded - t.orders)} замовлень до беззбитковості`
                : ""}
          </span>
        </div>
        {data.pipeline.orders > 0 && (
          <p className="dbju-settings-hint" style={{ marginTop: "10px" }}>
            В роботі ще {data.pipeline.orders} оплачених оренд на {uah(data.pipeline.gmv)} — потенційний дохід DBJU {uah(data.pipeline.revenue)} після їх завершення.
          </p>
        )}
      </section>

      {/* Юніт-економіка */}
      <section className="dbju-help-section dbju-finance-section">
        <h2>Дохід і змінні витрати</h2>
        <div className="dbju-table-wrap">
          <table className="dbju-finance-table">
            <thead>
              <tr><th>Стаття</th><th>Як рахується</th><th>За місяць</th><th>На 1 замовлення</th></tr>
            </thead>
            <tbody>
              <tr><td>Сервісні збори орендарів</td><td>{pct(SERVICE_FEE_RATE)} від оренди</td><td>{uah(t.serviceFees)}</td><td>{per(t.serviceFees)}</td></tr>
              <tr><td>Комісії з власників</td><td>{pct(OWNER_COMMISSION_RATE)} від оренди</td><td>{uah(t.ownerCommissions)}</td><td>{per(t.ownerCommissions)}</td></tr>
              <tr className="strong"><td>Дохід платформи</td><td>збори + комісії</td><td>{uah(t.revenue)}</td><td>{per(t.revenue)}</td></tr>
              <tr><td>Еквайринг</td><td>{pct(ACQUIRING_RATE)} від сплаченого орендарем</td><td>−{uah(t.acquiring)}</td><td>{t.orders ? `−${per(t.acquiring)}` : "—"}</td></tr>
              <tr><td>Страховий фонд</td><td>{pct(INSURANCE_FUND_RATE)} від оренди</td><td>−{uah(t.insurance)}</td><td>{t.orders ? `−${per(t.insurance)}` : "—"}</td></tr>
              <tr><td>Підтримка клієнтів</td><td>{SUPPORT_COST_PER_ORDER} ₴ за замовлення</td><td>−{uah(t.support)}</td><td>{t.orders ? `−${per(t.support)}` : "—"}</td></tr>
              <tr><td>Єдиний податок (ФОП 3 гр.)</td><td>{pct(SINGLE_TAX_RATE)} від доходу</td><td>−{uah(t.tax)}</td><td>{t.orders ? `−${per(t.tax)}` : "—"}</td></tr>
              <tr className="strong"><td>Маржинальний дохід</td><td></td><td>{uah(t.margin)}</td><td>{per(t.margin)}</td></tr>
              <tr><td>Постійні витрати</td><td>за місяць</td><td>−{uah(t.fixedCosts)}</td><td></td></tr>
              <tr className="strong"><td>Прибуток</td><td></td><td>{uah(t.profit)}</td><td></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Рух грошей */}
      <section className="dbju-help-section dbju-finance-section">
        <h2>Рух грошей</h2>
        <div className="dbju-table-wrap">
          <table className="dbju-finance-table">
            <tbody>
              <tr className="strong"><td>Сплатили орендарі</td><td>{uah(t.paidByRenters)}</td></tr>
              <tr><td>· з них оренда (GMV)</td><td>{uah(t.gmv)}</td></tr>
              <tr><td>· з них сервісні збори</td><td>{uah(t.serviceFees)}</td></tr>
              <tr><td>· з них доставка кур&apos;єром (без комісії)</td><td>{uah(t.delivery)}</td></tr>
              <tr className="strong"><td>Нараховано власникам (оренда − {pct(OWNER_COMMISSION_RATE)})</td><td>{uah(t.ownerPayouts)}</td></tr>
              <tr className="strong"><td>Залишилось платформі (збори + комісії)</td><td>{uah(t.revenue)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Динаміка */}
      <section className="dbju-help-section dbju-finance-section">
        <h2>Останні 6 місяців</h2>
        <div className="dbju-table-wrap">
          <table className="dbju-finance-table">
            <thead>
              <tr><th>Місяць</th><th>Замовлень</th><th>GMV</th><th>Дохід DBJU</th><th>Маржинальний дохід</th><th>Прибуток</th></tr>
            </thead>
            <tbody>
              {data.trend.map((m) => (
                <tr key={m.month} className={m.month === data.month ? "strong" : ""}>
                  <td>{monthName(m.month)}</td>
                  <td>{num(m.orders)}</td>
                  <td>{uah(m.gmv)}</td>
                  <td>{uah(m.revenue)}</td>
                  <td>{uah(m.margin)}</td>
                  <td>{uah(m.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// Калькулятор однієї угоди: таблиці 2.1 і 3.1 для будь-яких цифр
function DealCalculator() {
  const [price, setPrice] = useState("300");
  const [days, setDays] = useState("3");
  const [courier, setCourier] = useState(false);
  const [plus, setPlus] = useState(false);

  const r = useMemo(() => {
    const pd = Math.max(0, Math.round(Number(price) || 0));
    const d = Math.min(30, Math.max(1, Math.round(Number(days) || 1)));
    const q = quote({ pricePerDay: pd }, d, courier ? "COURIER" : "PICKUP", plus);
    const u = unitEconomics(q.rentAmount, q.platformRevenue, q.totalAmount);
    return { q, u, be: breakEvenOrders(FIXED_COSTS_MONTHLY, u.margin) };
  }, [price, days, courier, plus]);

  return (
    <section className="dbju-help-section dbju-finance-section" style={{ marginTop: "16px" }}>
      <h2>Калькулятор угоди</h2>
      <p className="dbju-settings-hint">За замовчуванням — середнє замовлення з моделі: 300 ₴/добу × 3 доби.</p>
      <div className="dbju-finance-controls">
        <label className="dbju-filter-label">Ціна за добу, ₴<input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="dbju-form-input" /></label>
        <label className="dbju-filter-label">Діб<input type="number" min={1} max={30} value={days} onChange={(e) => setDays(e.target.value)} className="dbju-form-input" /></label>
        <label className="dbju-filter-check"><input type="checkbox" checked={courier} onChange={(e) => setCourier(e.target.checked)} /> Кур&apos;єр ({DELIVERY_OPTIONS.COURIER.cost} ₴)</label>
        <label className="dbju-filter-check"><input type="checkbox" checked={plus} onChange={(e) => setPlus(e.target.checked)} /> Орендар з DBJU+</label>
      </div>
      <div className="dbju-calc-grid">
        <table className="dbju-finance-table">
          <caption>Хто скільки сплачує і отримує</caption>
          <tbody>
            <tr><td>Оренда (GMV)</td><td>{uah(r.q.rentAmount)}</td></tr>
            <tr><td>Сервісний збір орендаря ({plus ? "DBJU+: 0%" : pct(SERVICE_FEE_RATE)})</td><td>+{uah(r.q.serviceFee)}</td></tr>
            {courier && <tr><td>Кур&apos;єр</td><td>+{uah(r.q.deliveryCost)}</td></tr>}
            <tr className="strong"><td>Сплачує орендар</td><td>{uah(r.q.totalAmount)}</td></tr>
            <tr><td>Комісія з власника ({pct(OWNER_COMMISSION_RATE)})</td><td>−{uah(r.q.ownerCommission)}</td></tr>
            <tr className="strong"><td>Отримує власник</td><td>{uah(r.q.ownerPayout)}</td></tr>
            <tr className="strong"><td>Дохід DBJU</td><td>{uah(r.q.platformRevenue)}</td></tr>
          </tbody>
        </table>
        <table className="dbju-finance-table">
          <caption>Юніт-економіка для DBJU</caption>
          <tbody>
            <tr><td>Дохід платформи</td><td>{uah(r.u.revenue)}</td></tr>
            <tr><td>Еквайринг ({pct(ACQUIRING_RATE)} від {uah(r.q.totalAmount)})</td><td>−{uah(r.u.acquiring)}</td></tr>
            <tr><td>Страховий фонд ({pct(INSURANCE_FUND_RATE)})</td><td>−{uah(r.u.insurance)}</td></tr>
            <tr><td>Підтримка клієнтів</td><td>−{uah(r.u.support)}</td></tr>
            <tr><td>Єдиний податок ({pct(SINGLE_TAX_RATE)})</td><td>−{uah(r.u.tax)}</td></tr>
            <tr className="strong"><td>Маржинальний дохід</td><td>{uah(r.u.margin)}</td></tr>
            <tr><td>Беззбитковість при {uah(FIXED_COSTS_MONTHLY)}/міс</td><td>{r.be !== null ? `${num(r.be)} замовл.` : "недосяжна"}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
