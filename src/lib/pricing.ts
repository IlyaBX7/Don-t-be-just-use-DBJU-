// Фінансова модель DBJU (див. «Фінансова модель стартапу DBJU», розділи 2–5).
// Використовується і в браузері (показ ціни), і на сервері (фактичні суми), тому без серверних імпортів.
//
//   Власник встановлює ціну оренди (GMV).
//   Орендар платить:   оренда + сервісний збір 5% (+ кур'єр, якщо обрав)
//   Власник отримує:   оренда − комісія 15%
//   Дохід DBJU:        5% + 15% = 20% від оренди
//   Застава лише блокується на картці і не входить у розрахунок.

export type DeliveryMethod = "PICKUP" | "COURIER";

// --- Комісії (розділ 2) ---
export const SERVICE_FEE_RATE = 0.05; // сервісний збір з орендаря
export const OWNER_COMMISSION_RATE = 0.15; // комісія з власника
export const PLATFORM_RATE = SERVICE_FEE_RATE + OWNER_COMMISSION_RATE; // 20%

// --- Змінні витрати платформи на замовлення (розділ 3) ---
export const ACQUIRING_RATE = 0.025; // еквайринг, від суми, яку сплачує орендар
export const INSURANCE_FUND_RATE = 0.03; // відрахування до страхового фонду, від вартості оренди
export const SUPPORT_COST_PER_ORDER = 10; // підтримка клієнтів, грн у середньому
export const SINGLE_TAX_RATE = 0.05; // єдиний податок ФОП 3 групи, від доходу платформи

// --- Постійні витрати (розділ 4), грн/міс ---
export const FIXED_COSTS_MONTHLY = 180_000;

// --- Доставка: окрема послуга, без комісії платформи ---
export const DELIVERY_OPTIONS: Record<DeliveryMethod, { title: string; cost: number }> = {
  PICKUP: { title: "Самовивіз", cost: 0 },
  COURIER: { title: "Кур'єр", cost: 120 },
};

// --- DBJU+: орендар не сплачує сервісний збір (платформа відмовляється від своїх 5%) ---
export const PLUS_PRICE = 99;

export interface PriceInput {
  pricePerDay: number;
  price3Days?: number | null;
  priceWeek?: number | null;
}

// Гроші рахуємо в цілих гривнях; відсотки округлюємо до гривні
const pct = (amount: number, rate: number) => Math.round(amount * rate);

// Вартість самої оренди за N діб з урахуванням пакетних тарифів власника
export function rentCost(p: PriceInput, days: number): number {
  if (days >= 7 && p.priceWeek) return Math.round((p.priceWeek / 7) * days);
  if (days >= 3 && p.price3Days) return Math.round((p.price3Days / 3) * days);
  return p.pricePerDay * days;
}

// Розподіл грошей за орендою (таблиця 2.1)
export interface Split {
  rentAmount: number; // вартість оренди (GMV), встановлена власником
  serviceFee: number; // + сервісний збір орендаря (5%, з DBJU+ — 0)
  ownerCommission: number; // − комісія з власника (15%)
  ownerPayout: number; // отримує власник
  platformRevenue: number; // дохід DBJU
}

export function splitRent(rentAmount: number, isPlus: boolean): Split {
  const serviceFee = isPlus ? 0 : pct(rentAmount, SERVICE_FEE_RATE);
  const ownerCommission = pct(rentAmount, OWNER_COMMISSION_RATE);
  return {
    rentAmount,
    serviceFee,
    ownerCommission,
    ownerPayout: rentAmount - ownerCommission,
    platformRevenue: serviceFee + ownerCommission,
  };
}

export interface Quote extends Split {
  deliveryCost: number;
  totalAmount: number; // сплачує орендар: оренда + сервісний збір + доставка
  plusSaving: number; // скільки орендар зекономив завдяки DBJU+
}

export function quote(p: PriceInput, days: number, delivery: DeliveryMethod, isPlus: boolean): Quote {
  const rentAmount = rentCost(p, days);
  const split = splitRent(rentAmount, isPlus);
  const deliveryCost = DELIVERY_OPTIONS[delivery].cost;
  return {
    ...split,
    deliveryCost,
    totalAmount: rentAmount + split.serviceFee + deliveryCost,
    plusSaving: isPlus ? pct(rentAmount, SERVICE_FEE_RATE) : 0,
  };
}

// Юніт-економіка одного замовлення (таблиця 3.1).
// paidByRenter — сума, з якої береться еквайринг (оренда + збір + доставка).
export interface UnitEconomics {
  revenue: number;
  acquiring: number;
  insurance: number;
  support: number;
  tax: number;
  margin: number;
}

export function unitEconomics(rentAmount: number, platformRevenue: number, paidByRenter: number): UnitEconomics {
  const acquiring = pct(paidByRenter, ACQUIRING_RATE);
  const insurance = pct(rentAmount, INSURANCE_FUND_RATE);
  const support = SUPPORT_COST_PER_ORDER;
  const tax = pct(platformRevenue, SINGLE_TAX_RATE);
  return {
    revenue: platformRevenue,
    acquiring,
    insurance,
    support,
    tax,
    margin: platformRevenue - acquiring - insurance - support - tax,
  };
}

// Точка беззбитковості: постійні витрати / маржинальний дохід з замовлення (розділ 5)
export function breakEvenOrders(fixedCosts: number, marginPerOrder: number): number | null {
  return marginPerOrder > 0 ? Math.ceil(fixedCosts / marginPerOrder) : null;
}

export function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "доба";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "доби";
  return "діб";
}
