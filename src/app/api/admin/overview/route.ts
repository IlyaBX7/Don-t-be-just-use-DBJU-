import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/adminGuard";
import { parseISODate, todayISO } from "../../../../lib/dates";

// GET /api/admin/overview — що потребує уваги адміністратора
export async function GET() {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const [users, blocked, listings, hidden, openReports, contested, openDisputes, overdue, activeRentals] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { blockedAt: { not: null } } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "HIDDEN" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.dispute.count({ where: { status: "CONTESTED" } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.booking.count({ where: { status: "PICKED_UP", endDate: { lt: parseISODate(todayISO()) } } }),
    prisma.booking.count({ where: { status: { in: ["PAID", "PICKED_UP", "RETURNED", "DISPUTED"] } } }),
  ]);
  return NextResponse.json({ users, blocked, listings, hidden, openReports, contested, openDisputes, overdue, activeRentals });
}
