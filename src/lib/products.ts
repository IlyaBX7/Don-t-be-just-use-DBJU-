import type { Prisma, Product as DbProduct, User } from "@prisma/client";
import type { Product } from "../types/product";
import { CATEGORY_BY_KEY, isCategoryKey } from "./categories";
import { toISODate } from "./dates";

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
} satisfies Prisma.UserSelect;

type Owner = Pick<User, keyof typeof ownerSelect>;

// Поточна оренда: річ уже в орендаря (PICKED_UP) або повернена й чекає підтвердження (RETURNED)
export const ACTIVE_RENTAL_STATUSES = ["PICKED_UP", "RETURNED"] as const;

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
export function toApiProduct(p: DbProduct & { owner: Owner; bookings?: ActiveRental[] }): Product {
  const cat = CATEGORIES[p.category];
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
    location: p.location,
    city: p.city,
    region: p.region,
    street: p.street,
    lat: p.lat,
    lng: p.lng,
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
    rentalPhase: rental ? (rental.status === "RETURNED" ? "RETURNING" : "IN_USE") : null,
    condition: p.condition,
    createdAt: p.createdAt.toISOString(),
  };
}
