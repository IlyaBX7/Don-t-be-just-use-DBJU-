import type { Prisma } from "@prisma/client";
import { ACTIVE_RENTAL_STATUSES, isCategoryKey } from "./products";
import { BLOCKING_STATUSES } from "./bookings";
import { isISODate, parseISODate } from "./dates";

// Спільна логіка фільтрів каталогу: сторінка /catalog і ШІ-помічник шукають однаково.

export const SORTS = ["new", "cheap", "expensive", "popular", "rating"] as const;
export type Sort = (typeof SORTS)[number];

export const ORDER: Record<Sort, Prisma.ProductOrderByWithRelationInput[]> = {
  new: [{ createdAt: "desc" }],
  cheap: [{ rentalPricePerDay: "asc" }, { createdAt: "desc" }],
  expensive: [{ rentalPricePerDay: "desc" }, { createdAt: "desc" }],
  popular: [{ rentalCount: "desc" }, { createdAt: "desc" }],
  rating: [{ owner: { rating: "desc" } }, { rentalCount: "desc" }],
};

export interface CatalogFilters {
  cat?: string | null;
  q?: string | null; // фраза цілком
  anyWords?: string[]; // хоча б одне зі слів (для помічника: «намет», «спальник»…)
  minPrice?: number | null;
  maxPrice?: number | null;
  from?: string | null; // вільно на дати (YYYY-MM-DD)
  to?: string | null;
  available?: boolean; // не в оренді зараз
  verified?: boolean;
  minRating?: number | null;
  city?: string | null;
}

const textMatch = (s: string): Prisma.ProductWhereInput => ({
  OR: [{ name: { contains: s } }, { fullTitle: { contains: s } }, { description: { contains: s } }],
});

// Умови без категорії (base) — потрібні окремо для лічильників категорій
export function buildCatalogWhere(f: CatalogFilters): { base: Prisma.ProductWhereInput[]; where: Prisma.ProductWhereInput } {
  const base: Prisma.ProductWhereInput[] = [{ status: { not: "HIDDEN" } }];
  const q = f.q?.trim().slice(0, 100);
  if (q) base.push(textMatch(q));

  const words = (f.anyWords ?? []).map((w) => w.trim().slice(0, 40)).filter((w) => w.length >= 2).slice(0, 8);
  if (words.length) base.push({ OR: words.map(textMatch) });

  if (f.minPrice != null || f.maxPrice != null) {
    base.push({
      rentalPricePerDay: {
        ...(f.minPrice != null && { gte: f.minPrice }),
        ...(f.maxPrice != null && { lte: f.maxPrice }),
      },
    });
  }
  if (f.city) base.push({ city: f.city.trim().slice(0, 80) });

  const owner: Prisma.UserWhereInput = {};
  if (f.verified) owner.isVerified = true;
  if (f.minRating && f.minRating >= 1 && f.minRating <= 5) {
    owner.rating = { gte: f.minRating };
    owner.reviewsCount = { gt: 0 };
  }
  if (Object.keys(owner).length) base.push({ owner });

  // Річ, яку зараз забрали, бронювати не можна взагалі — виключаємо її і для «доступні зараз», і для дат
  const notRentedNow: Prisma.ProductWhereInput = {
    bookings: { none: { status: { in: [...ACTIVE_RENTAL_STATUSES] } } },
  };
  if (f.available) base.push(notRentedNow);
  if (isISODate(f.from)) {
    const end = isISODate(f.to) && f.to >= f.from ? f.to : f.from;
    base.push(notRentedNow, {
      bookings: {
        none: {
          status: { in: BLOCKING_STATUSES },
          startDate: { lte: parseISODate(end) },
          endDate: { gte: parseISODate(f.from) },
        },
      },
    });
  }

  return {
    base,
    where: { AND: [...base, ...(isCategoryKey(f.cat) ? [{ category: f.cat }] : [])] },
  };
}
