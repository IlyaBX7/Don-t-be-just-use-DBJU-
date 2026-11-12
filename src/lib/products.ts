import type { Prisma, Product as DbProduct, User } from "@prisma/client";
import type { Product } from "../types/product";
import { CATEGORY_BY_KEY, isCategoryKey } from "./categories";
import { toISODate } from "./dates";
import { findCity } from "./ukraine";

export const CATEGORIES = CATEGORY_BY_KEY;
export { isCategoryKey };

// Поля власника, які можна показувати публічно
export const ownerSelect = {
  id: true,
  name: true,
  avatar: true,
  avatarUrl: true,
  rating: true,
  reviewsCount: true,
  isVerified: true,
  blockedAt: true,
} satisfies Prisma.UserSelect;

type Owner = Pick<User, keyof typeof ownerSelect>;

// Поточна оренда: річ уже в орендаря (PICKED_UP) або повернена й чекає підтвердження (RETURNED)
export const ACTIVE_RENTAL_STATUSES = ["PICKED_UP", "RETURNED", "DISPUTED"] as const;

export const productInclude = {
  owner: { select: ownerSelect },
  bookings: {
    where: { status: { in: [...ACTIVE_RENTAL_STATUSES] } },
    select: { endDate: true, status: true },
    orderBy: { endDate: "desc" },
    take: 1,
  },
} satisfies Prisma.ProductInclude;

type ActiveRental = { endDate: Date; status: string };

function asStringArray(v: Prisma.JsonValue | null): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function asStringRecord(v: Prisma.JsonValue | null): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return Object.fromEntries(
    Object.entries(v).filter((e): e is [string, string] => typeof e[1] === "string")
  );
}

// Перетворює рядок БД у формат, з яким працює фронтенд
type ProductRow = DbProduct & { owner: Owner; bookings?: ActiveRental[] };

// Публічна адреса: лише місто (і область, якщо місто не з довідника) — без вулиці й точної точки
function publicLocation(p: DbProduct): string {
  if (!p.city) return p.location.split(",")[0].trim();
  return p.region && p.region !== p.city && !findCity(p.city) ? `${p.city}, ${p.region}` : p.city;
}

// Приблизна точка для карти каталогу: округлення до ~1 км або центр міста
function approxPoint(p: DbProduct): { lat: number; lng: number } | null {
  if (p.lat !== null && p.lng !== null) return { lat: Math.round(p.lat * 100) / 100, lng: Math.round(p.lng * 100) / 100 };
  const c = p.city ? findCity(p.city) : undefined;
  return c ? { lat: c.lat, lng: c.lng } : null;
}

// Повні дані — лише для власника (і адміністратора): точна адреса потрібна для редагування
export function toOwnerApiProduct(p: ProductRow): Product {
  return { ...toApiProduct(p), location: p.location, street: p.street, lat: p.lat, lng: p.lng };
}

// Публічний формат товару (для всіх). Увага: функцію передають у .map — другий аргумент не додавати.
export function toApiProduct(p: ProductRow): Product {
  const cat = CATEGORIES[p.category];
  const approx = approxPoint(p);
  const rental = p.bookings?.[0];
  return {
    id: p.id,
    name: p.name,
    fullTitle: p.fullTitle ?? undefined,
    description: p.description,
    category: cat.label,
    categoryKey: p.category,
    images: asStringArray(p.images),
    rentalPricePerDay: p.rentalPricePerDay,
    pricingTiers: {
      oneDay: p.rentalPricePerDay,
      threeDays: p.price3Days ?? p.rentalPricePerDay * 3,
      week: p.priceWeek ?? p.rentalPricePerDay * 7,
    },
    depositAmount: p.depositAmount,
    minRentDays: p.minRentDays,
    marketBuyPrice: p.marketBuyPrice ?? undefined,
    purchasePrice: p.purchasePrice ?? undefined,
    buybackRebatePercent: p.buybackPercent,
    location: publicLocation(p),
    city: p.city,
    region: p.region,
    street: null,
    lat: null,
    lng: null,
    approxLat: approx?.lat ?? null,
    approxLng: approx?.lng ?? null,
    ownerId: p.owner.id,
    ownerName: p.owner.name,
    ownerInitials: p.owner.avatar || p.owner.name.slice(0, 2).toUpperCase(),
    ownerAvatarUrl: p.owner.avatarUrl,
    ownerRating: p.owner.rating,
    reviewsCount: p.owner.reviewsCount,
    verifiedByDiia: p.owner.isVerified,
    rentalCount: p.rentalCount,
    includedKit: asStringArray(p.includedKit),
    features: asStringRecord(p.features),
    accentColor: cat.accent,
    status: p.status,
    rentedUntil: rental ? toISODate(rental.endDate) : null,
    rentalPhase: rental ? (rental.status === "PICKED_UP" ? "IN_USE" : "RETURNING") : null,
    condition: p.condition,
    createdAt: p.createdAt.toISOString(),
  };
}
