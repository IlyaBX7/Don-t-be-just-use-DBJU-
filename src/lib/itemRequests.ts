import type { Prisma } from "@prisma/client";
import { CATEGORY_BY_KEY } from "./categories";
import { toISODate } from "./dates";

// Формат «запитів на речі» для API
export const requestInclude = {
  author: { select: { id: true, name: true, avatar: true, avatarUrl: true, isVerified: true } },
  offers: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      createdAt: true,
      owner: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, rentalPricePerDay: true, images: true, category: true, status: true } },
    },
  },
} satisfies Prisma.ItemRequestInclude;

type RequestRow = Prisma.ItemRequestGetPayload<{ include: typeof requestInclude }>;

export function toApiRequest(r: RequestRow) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    categoryLabel: r.category ? CATEGORY_BY_KEY[r.category].label : null,
    city: r.city,
    maxPricePerDay: r.maxPricePerDay,
    neededFrom: r.neededFrom ? toISODate(r.neededFrom) : null,
    neededTo: r.neededTo ? toISODate(r.neededTo) : null,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    author: { ...r.author, avatar: r.author.avatar || r.author.name.slice(0, 2).toUpperCase() },
    offers: r.offers.map((o) => ({
      id: o.id,
      message: o.message,
      createdAt: o.createdAt.toISOString(),
      owner: o.owner,
      product: {
        id: o.product.id,
        name: o.product.name,
        pricePerDay: o.product.rentalPricePerDay,
        image: Array.isArray(o.product.images) && typeof o.product.images[0] === "string" ? o.product.images[0] : null,
        categoryKey: o.product.category,
        hidden: o.product.status === "HIDDEN",
      },
    })),
  };
}

