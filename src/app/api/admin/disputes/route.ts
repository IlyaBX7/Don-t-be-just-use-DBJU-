import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/adminGuard";
import { bookingInclude, toApiBooking } from "../../../../lib/bookings";

// GET /api/admin/disputes?status=CONTESTED|OPEN|RESOLVED — суперечки з деталями оренди та фото «до/після»
export async function GET(request: NextRequest) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const s = request.nextUrl.searchParams.get("status");
  const status = s === "OPEN" || s === "RESOLVED" ? s : "CONTESTED";
  const rows = await prisma.booking.findMany({
    where: { dispute: { status } },
    include: bookingInclude,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return NextResponse.json(rows.map((b) => toApiBooking(b)));
}
