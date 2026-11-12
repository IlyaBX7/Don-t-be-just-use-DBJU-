import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { BLOCKING_STATUSES } from "../../../../../lib/bookings";
import { ACTIVE_RENTAL_STATUSES } from "../../../../../lib/products";
import { parseISODate, toISODate, todayISO } from "../../../../../lib/dates";

// GET /api/products/:id/availability — зайняті дати (без даних орендарів)
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/products/[id]/availability">) {
  const { id } = await ctx.params;
  const active = await prisma.booking.findFirst({
    where: { productId: id, status: { in: [...ACTIVE_RENTAL_STATUSES] } },
    select: { endDate: true, status: true },
    orderBy: { endDate: "desc" },
  });
  const bookings = await prisma.booking.findMany({
    where: {
      productId: id,
      status: { in: BLOCKING_STATUSES },
      endDate: { gte: parseISODate(todayISO()) },
    },
    select: { startDate: true, endDate: true },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json({
    today: todayISO(),
    // Річ зараз в орендаря — бронювання закрите до повернення
    rentedUntil: active ? toISODate(active.endDate) : null,
    rentalPhase: active ? (active.status === "RETURNED" ? "RETURNING" : "IN_USE") : null,
    booked: bookings.map((b) => ({ start: toISODate(b.startDate), end: toISODate(b.endDate) })),
  });
}
