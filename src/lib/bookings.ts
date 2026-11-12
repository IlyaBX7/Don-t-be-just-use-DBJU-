import crypto from "crypto";
import type { Prisma, BookingStatus } from "@prisma/client";
import type { Booking, BookingParty } from "../types/booking";
import { CATEGORIES } from "./products";
import { toISODate } from "./dates";

// Статуси, при яких річ зайнята на ці дати
export const BLOCKING_STATUSES: BookingStatus[] = ["PAID", "PICKED_UP", "RETURNED"];

const partySelect = { id: true, name: true, avatar: true, avatarUrl: true, phone: true } satisfies Prisma.UserSelect;

export const bookingInclude = {
  product: {
    select: {
      id: true,
      name: true,
      category: true,
      images: true,
      location: true,
      rentalPricePerDay: true,
      price3Days: true,
      priceWeek: true,
    },
  },
  renter: { select: partySelect },
  owner: { select: partySelect },
  reviews: { select: { authorId: true } },
} satisfies Prisma.BookingInclude;

type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

function party(u: BookingRow["renter"]): BookingParty {
  return {
    id: u.id,
    name: u.name,
    avatar: u.avatar || u.name.slice(0, 2).toUpperCase(),
    avatarUrl: u.avatarUrl,
    phone: u.phone,
  };
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function toApiBooking(b: BookingRow): Booking {
  const images = Array.isArray(b.product.images) ? b.product.images : [];
  const firstImage = typeof images[0] === "string" ? images[0] : null;
  return {
    id: b.id,
    code: b.code,
    status: b.status,
    product: {
      id: b.product.id,
      name: b.product.name,
      categoryKey: b.product.category,
      accentColor: CATEGORIES[b.product.category].accent,
      image: firstImage,
      location: b.product.location,
      pricePerDay: b.product.rentalPricePerDay,
      price3Days: b.product.price3Days,
      priceWeek: b.product.priceWeek,
    },
    renter: party(b.renter),
    owner: party(b.owner),
    startDate: toISODate(b.startDate),
    endDate: toISODate(b.endDate),
    days: b.days,
    deliveryMethod: b.deliveryMethod,
    deliveryAddress: b.deliveryAddress,
    rentAmount: b.rentAmount,
    deliveryCost: b.deliveryCost,
    protection: b.protection,
    protectionCost: b.protectionCost,
    serviceFee: b.serviceFee,
    ownerCommission: b.ownerCommission,
    ownerPayout: b.ownerPayout,
    totalAmount: b.totalAmount,
    depositAmount: b.depositAmount,
    returnPhoto: b.returnPhoto,
    ownerNote: b.ownerNote,
    paidAt: b.paidAt.toISOString(),
    pickedUpAt: iso(b.pickedUpAt),
    returnedAt: iso(b.returnedAt),
    completedAt: iso(b.completedAt),
    cancelledAt: iso(b.cancelledAt),
    reviewedByRenter: b.reviews.some((r) => r.authorId === b.renterId),
    reviewedByOwner: b.reviews.some((r) => r.authorId === b.ownerId),
  };
}

// Код замовлення: DBJU-4821-A3F9 (показується власнику чи кур'єру при передачі)
export function makeBookingCode(): string {
  const digits = crypto.randomInt(1000, 10000);
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `DBJU-${digits}-${suffix}`;
}

export function isPlusActive(plusUntil: Date | null): boolean {
  return Boolean(plusUntil && plusUntil > new Date());
}
