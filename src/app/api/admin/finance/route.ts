import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { FIXED_COSTS_MONTHLY, INSURANCE_FUND_RATE, breakEvenOrders, unitEconomics } from "../../../../lib/pricing";

// GET /api/admin/finance?month=YYYY-MM — фактичні фінанси платформи за місяць (лише для адміністратора).
// Рахує за фінансовою моделлю DBJU: дохід = сервісні збори + комісії власників,
// змінні витрати (еквайринг, страховий фонд, підтримка, податок) — за таблицею 3.1.

interface MonthTotals {
  month: string;
  orders: number;
  gmv: number; // вартість оренд
  paidByRenters: number; // оренда + збір + доставка
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
  bonuses: number; // бонуси реферальної програми, якими оплачено оренди (маркетинг)
  insurancePayouts: number; // виплати власникам зі страхового фонду за пошкодження
  fixedCosts: number;
  profit: number;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function totalsFor(month: string, fixedCosts: number): Promise<MonthTotals> {
  const { start, end } = monthRange(month);
  // Угода вважається завершеною, коли власник підтвердив повернення
  const rows = await prisma.booking.findMany({
    where: { status: "COMPLETED", completedAt: { gte: start, lt: end } },
    select: { rentAmount: true, serviceFee: true, ownerCommission: true, ownerPayout: true, deliveryCost: true, bonusUsed: true },
  });
  const fund = await prisma.dispute.aggregate({
    where: { status: "RESOLVED", resolvedAt: { gte: start, lt: end } },
    _sum: { awardedFromFund: true },
  });

  const t: MonthTotals = {
    month,
    orders: rows.length,
    gmv: 0,
    paidByRenters: 0,
    serviceFees: 0,
    ownerCommissions: 0,
    revenue: 0,
    ownerPayouts: 0,
    delivery: 0,
    acquiring: 0,
    insurance: 0,
    support: 0,
    tax: 0,
    margin: 0,
    bonuses: 0,
    insurancePayouts: fund._sum.awardedFromFund ?? 0,
    fixedCosts,
    profit: 0,
  };
  for (const b of rows) {
    const revenue = b.serviceFee + b.ownerCommission;
    const paid = b.rentAmount + b.serviceFee + b.deliveryCost;
    const u = unitEconomics(b.rentAmount, revenue, paid);
    t.gmv += b.rentAmount;
    t.paidByRenters += paid;
    t.serviceFees += b.serviceFee;
    t.ownerCommissions += b.ownerCommission;
    t.revenue += revenue;
    t.ownerPayouts += b.ownerPayout;
    t.delivery += b.deliveryCost;
    t.acquiring += u.acquiring;
    t.insurance += u.insurance;
    t.support += u.support;
    t.tax += u.tax;
    t.margin += u.margin;
    t.bonuses += b.bonusUsed;
  }
  t.profit = t.margin - t.bonuses - fixedCosts;
  return t;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Доступ лише для адміністратора" }, { status: 403 });

  const now = new Date();
  const current = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const param = request.nextUrl.searchParams.get("month");
  const month = param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param) ? param : current;
  // Постійні витрати: з параметра ?fixed= (для сценаріїв) або 180 000 грн/міс з моделі
  const fixedRaw = request.nextUrl.searchParams.get("fixed");
  const fixedParam = fixedRaw === null || fixedRaw === "" ? NaN : Number(fixedRaw);
  const fixedCosts = Number.isInteger(fixedParam) && fixedParam >= 0 && fixedParam <= 100_000_000 ? fixedParam : FIXED_COSTS_MONTHLY;

  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
  const trend = await Promise.all(months.map((m) => totalsFor(m, fixedCosts)));
  const totals = trend[trend.length - 1];
  const previous = trend[trend.length - 2];

  // Активні угоди — гроші вже сплачені, але ще не зароблені (річ в оренді)
  const pipeline = await prisma.booking.aggregate({
    where: { status: { in: ["PAID", "PICKED_UP", "RETURNED", "DISPUTED"] } },
    _count: true,
    _sum: { serviceFee: true, ownerCommission: true, rentAmount: true },
  });

  // Страховий фонд за весь час: відрахування 3% від завершених оренд мінус виплати
  const [allRent, allPaid] = await Promise.all([
    prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { rentAmount: true } }),
    prisma.dispute.aggregate({ where: { status: "RESOLVED" }, _sum: { awardedFromFund: true } }),
  ]);
  const fundIn = Math.round((allRent._sum.rentAmount ?? 0) * INSURANCE_FUND_RATE);
  const fundOut = allPaid._sum.awardedFromFund ?? 0;

  const avgMargin = totals.orders ? totals.margin / totals.orders : null;
  const avgOrder = totals.orders ? Math.round(totals.gmv / totals.orders) : null;

  return NextResponse.json({
    month,
    isCurrentMonth: month === current,
    totals,
    previous,
    trend,
    perOrder: totals.orders
      ? {
          gmv: avgOrder,
          revenue: Math.round(totals.revenue / totals.orders),
          margin: Math.round(totals.margin / totals.orders),
        }
      : null,
    breakEven: {
      fixedCosts,
      // За фактичною маржею замовлень цього місяця (якщо їх ще немає — за моделлю, 110 грн)
      ordersNeeded: breakEvenOrders(fixedCosts, avgMargin ?? 110),
      basedOn: avgMargin !== null ? "actual" : "model",
      marginPerOrder: avgMargin !== null ? Math.round(avgMargin) : 110,
    },
    insuranceFund: { contributed: fundIn, paidOut: fundOut, balance: fundIn - fundOut },
    pipeline: {
      orders: pipeline._count,
      gmv: pipeline._sum.rentAmount ?? 0,
      revenue: (pipeline._sum.serviceFee ?? 0) + (pipeline._sum.ownerCommission ?? 0),
    },
  });
}
