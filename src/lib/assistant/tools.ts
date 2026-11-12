import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../prisma";
import { CATEGORY_BY_KEY, CATEGORY_KEYS, isCategoryKey } from "../categories";
import { ACTIVE_RENTAL_STATUSES, productInclude, toApiProduct } from "../products";
import { BLOCKING_STATUSES, isPlusActive } from "../bookings";
import { ORDER, SORTS, buildCatalogWhere, type Sort } from "../catalogSearch";
import { addDays, daysInclusive, formatDay, isISODate, parseISODate, toISODate, todayISO } from "../dates";
import { DELIVERY_OPTIONS, quote, type DeliveryMethod } from "../pricing";
import type { Product } from "../../types/product";

// Інструменти ШІ-помічника: лише читання каталогу та розрахунки. Нічого не змінюють у базі.

export interface ProductCardData {
  id: string;
  name: string;
  pricePerDay: number;
  categoryKey: string;
  accentColor: string;
  image: string | null;
  location: string;
  rentedUntil: string | null;
}

export const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_products",
    description:
      "Шукає речі в каталозі DBJU. Повертає до 8 речей з id, ціною, адресою та посиланням. " +
      "Використовуй для будь-якого питання «що орендувати / чи є / підбери». " +
      "Для ширшого пошуку передавай кілька коротких основ слів у words (напр. [\"намет\", \"спальн\", \"пальник\"]) — " +
      "достатньо збігу будь-якого слова. Якщо нічого не знайдено, спробуй інші слова або категорію без слів.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        words: {
          type: "array",
          items: { type: "string" },
          description: "Короткі основи слів для пошуку в назві та описі (до 8). Без закінчень: «дрил», «перфоратор», «коляск».",
        },
        category: { type: "string", enum: [...CATEGORY_KEYS], description: "Ключ категорії" },
        min_price: { type: "integer", description: "Мінімальна ціна за добу, грн" },
        max_price: { type: "integer", description: "Максимальна ціна за добу, грн" },
        free_from: { type: "string", description: "Річ має бути вільна з цієї дати (YYYY-MM-DD)" },
        free_to: { type: "string", description: "…і до цієї дати включно (YYYY-MM-DD)" },
        available_now: { type: "boolean", description: "Лише речі, які зараз не в оренді" },
        city: { type: "string", description: "Місто, напр. «Київ»" },
        sort: { type: "string", enum: [...SORTS], description: "new | cheap | expensive | popular | rating" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_product",
    description:
      "Повна інформація про одну річ: опис, тарифи на 1/3/7 діб, застава, мінімальний термін, комплектація, " +
      "ціна нової речі в магазині, рейтинг власника, відгуки орендарів і зайняті дати.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: { product_id: { type: "string", description: "id речі з search_products" } },
      required: ["product_id"],
      additionalProperties: false,
    },
  },
  {
    name: "quote_rental",
    description:
      "Точний розрахунок вартості оренди речі на конкретні дати за правилами DBJU (ті самі формули, що й при бронюванні) " +
      "і перевірка, чи вільні дати. Використовуй, коли питають «скільки коштуватиме», «чи вільно», «що вигідніше».",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        product_id: { type: "string" },
        start_date: { type: "string", description: "Дата отримання YYYY-MM-DD" },
        end_date: { type: "string", description: "Дата повернення YYYY-MM-DD (включно)" },
        delivery: { type: "string", enum: ["PICKUP", "COURIER"], description: "PICKUP — самовивіз (0 ₴), COURIER — кур'єр" },
      },
      required: ["product_id", "start_date", "end_date"],
      additionalProperties: false,
    },
  },
];

type ToolOutput = { content: string; isError?: boolean; cards?: ProductCardData[] };

const err = (message: string): ToolOutput => ({ content: JSON.stringify({ error: message }), isError: true });

const toCard = (p: Product): ProductCardData => ({
  id: p.id,
  name: p.name,
  pricePerDay: p.rentalPricePerDay,
  categoryKey: p.categoryKey,
  accentColor: p.accentColor,
  image: p.images[0] ?? null,
  location: p.location,
  rentedUntil: p.rentedUntil,
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const optInt = (v: unknown) => (v === undefined || v === null ? null : Number.isInteger(v) && (v as number) >= 0 ? (v as number) : NaN);

async function searchProducts(input: Record<string, unknown>): Promise<ToolOutput> {
  const words = input.words;
  if (words !== undefined && (!Array.isArray(words) || !words.every((w) => typeof w === "string"))) {
    return err("words має бути масивом рядків");
  }
  if (input.category !== undefined && !isCategoryKey(input.category)) return err("невідома категорія");
  const minPrice = optInt(input.min_price);
  const maxPrice = optInt(input.max_price);
  if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) return err("ціна має бути цілим числом ≥ 0");
  for (const k of ["free_from", "free_to"] as const) {
    if (input[k] !== undefined && !isISODate(input[k])) return err(`${k} має бути датою YYYY-MM-DD`);
  }
  const sort: Sort = (SORTS as readonly string[]).includes(String(input.sort)) ? (input.sort as Sort) : "popular";

  const { where } = buildCatalogWhere({
    cat: (input.category as string) ?? null,
    anyWords: (words as string[] | undefined) ?? [],
    minPrice,
    maxPrice,
    from: (input.free_from as string) ?? null,
    to: (input.free_to as string) ?? null,
    available: input.available_now === true,
    city: typeof input.city === "string" ? input.city : null,
  });

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include: productInclude, orderBy: ORDER[sort], take: 8 }),
  ]);
  const items = rows.map(toApiProduct);
  return {
    content: JSON.stringify({
      total,
      shown: items.length,
      catalog_url: "/catalog",
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        url: `/product/${p.id}`,
        price_per_day: p.rentalPricePerDay,
        price_3_days: p.pricingTiers.threeDays,
        price_week: p.pricingTiers.week,
        deposit: p.depositAmount,
        min_rent_days: p.minRentDays,
        location: p.location,
        owner_rating: p.reviewsCount > 0 ? p.ownerRating : null,
        rented_until: p.rentedUntil,
        short_description: p.description.slice(0, 160),
      })),
    }),
    cards: items.map(toCard),
  };
}

async function getProduct(input: Record<string, unknown>): Promise<ToolOutput> {
  if (typeof input.product_id !== "string") return err("потрібен product_id");
  const row = await prisma.product.findUnique({ where: { id: input.product_id }, include: productInclude });
  if (!row || row.status === "HIDDEN") return err("річ не знайдено");
  const p = toApiProduct(row);

  const reviewWhere = { targetRole: "OWNER" as const, booking: { productId: p.id } };
  const [reviewAgg, lastReviews, booked] = await Promise.all([
    prisma.review.aggregate({ where: reviewWhere, _avg: { rating: true }, _count: true }),
    prisma.review.findMany({ where: reviewWhere, orderBy: { createdAt: "desc" }, take: 3, select: { rating: true, text: true } }),
    prisma.booking.findMany({
      where: { productId: p.id, status: { in: BLOCKING_STATUSES }, endDate: { gte: parseISODate(todayISO()) } },
      select: { startDate: true, endDate: true },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
  ]);

  return {
    content: JSON.stringify({
      id: p.id,
      name: p.name,
      url: `/product/${p.id}`,
      category: p.category,
      description: p.description.slice(0, 1200),
      price_per_day: p.rentalPricePerDay,
      price_3_days: p.pricingTiers.threeDays,
      price_week: p.pricingTiers.week,
      deposit: p.depositAmount,
      min_rent_days: p.minRentDays,
      new_item_price_in_store: p.marketBuyPrice ?? null,
      included_kit: p.includedKit,
      features: p.features,
      location: p.location,
      owner: { name: p.ownerName, rating: p.reviewsCount > 0 ? p.ownerRating : null, reviews: p.reviewsCount, verified_by_diia: p.verifiedByDiia },
      times_rented: p.rentalCount,
      rented_until: p.rentedUntil,
      rental_phase: p.rentalPhase,
      booked_dates: booked.map((b) => ({ from: toISODate(b.startDate), to: toISODate(b.endDate) })),
      item_reviews: {
        count: reviewAgg._count,
        average: reviewAgg._avg.rating ? Math.round(reviewAgg._avg.rating * 10) / 10 : null,
        latest: lastReviews.map((r) => ({ rating: r.rating, text: r.text?.slice(0, 200) ?? null })),
      },
    }),
    cards: [toCard(p)],
  };
}

async function quoteRental(input: Record<string, unknown>, isPlus: boolean): Promise<ToolOutput> {
  const { product_id, start_date, end_date } = input;
  const delivery = (input.delivery ?? "PICKUP") as DeliveryMethod;
  if (typeof product_id !== "string") return err("потрібен product_id");
  if (!isISODate(start_date) || !isISODate(end_date)) return err("дати мають бути у форматі YYYY-MM-DD");
  if (!(delivery in DELIVERY_OPTIONS)) return err("delivery: PICKUP або COURIER");

  const row = await prisma.product.findUnique({ where: { id: product_id }, include: productInclude });
  if (!row || row.status === "HIDDEN") return err("річ не знайдено");
  const p = toApiProduct(row);

  const today = todayISO();
  const problems: string[] = [];
  if (start_date < today) problems.push("дата отримання вже минула");
  if (start_date > addDays(today, 90)) problems.push("бронювати можна не більше ніж на 90 днів наперед");
  if (end_date < start_date) problems.push("дата повернення раніше дати отримання");
  const days = end_date >= start_date ? daysInclusive(start_date, end_date) : 0;
  if (days > 30) problems.push("максимальний термін оренди — 30 днів");
  if (days && days < p.minRentDays) problems.push(`мінімальний термін оренди цієї речі — ${p.minRentDays} дн.`);

  const active = await prisma.booking.findFirst({
    where: { productId: p.id, status: { in: [...ACTIVE_RENTAL_STATUSES] } },
    select: { endDate: true },
  });
  if (active) problems.push(`річ зараз в оренді до ${formatDay(toISODate(active.endDate))}, бронювання відкриється після повернення`);
  const conflict = days
    ? await prisma.booking.findFirst({
        where: {
          productId: p.id,
          status: { in: BLOCKING_STATUSES },
          startDate: { lte: parseISODate(end_date) },
          endDate: { gte: parseISODate(start_date) },
        },
        select: { startDate: true, endDate: true },
      })
    : null;
  if (conflict) problems.push(`дати перетинаються з бронюванням ${toISODate(conflict.startDate)} – ${toISODate(conflict.endDate)}`);

  const q = quote(
    { pricePerDay: p.rentalPricePerDay, price3Days: p.pricingTiers.threeDays, priceWeek: p.pricingTiers.week },
    Math.max(days, 1),
    delivery,
    isPlus
  );

  return {
    content: JSON.stringify({
      product: { id: p.id, name: p.name, url: `/product/${p.id}` },
      start_date,
      end_date,
      days,
      can_book: problems.length === 0,
      problems,
      renter_pays: {
        rent: q.rentAmount,
        service_fee_5_percent: q.serviceFee,
        delivery: q.deliveryCost,
        total: q.totalAmount,
        dbju_plus_active: isPlus,
        dbju_plus_saving: q.plusSaving,
      },
      deposit_blocked_and_returned: p.depositAmount,
      new_item_price_in_store: p.marketBuyPrice ?? null,
      saving_vs_buying: p.marketBuyPrice ? p.marketBuyPrice - q.totalAmount : null,
    }),
    cards: [toCard(p)],
  };
}

export async function runTool(name: string, input: unknown, ctx: { isPlus: boolean }): Promise<ToolOutput> {
  // Вхід приходить потоково і SDK розбирає його «поблажливо» — перевіряємо форму перед виконанням
  if (!isObj(input)) return { content: JSON.stringify({ INVALID_JSON: JSON.stringify(input) }), isError: true };
  try {
    switch (name) {
      case "search_products":
        return await searchProducts(input);
      case "get_product":
        return await getProduct(input);
      case "quote_rental":
        return await quoteRental(input, ctx.isPlus);
      default:
        return err(`невідомий інструмент ${name}`);
    }
  } catch (e) {
    console.error("Помилка інструмента помічника:", name, e);
    return err("внутрішня помилка під час пошуку, спробуй ще раз або інакше");
  }
}

export const TOOL_STATUS: Record<string, string> = {
  search_products: "Шукаю в каталозі…",
  get_product: "Дивлюся деталі речі…",
  quote_rental: "Рахую вартість…",
};

export function isPlusFor(user: { plusUntil: Date | null } | null): boolean {
  return Boolean(user && isPlusActive(user.plusUntil));
}

export const CATEGORY_LINES = CATEGORY_KEYS.map((k) => `${k} — ${CATEGORY_BY_KEY[k].longLabel}`).join("\n");
