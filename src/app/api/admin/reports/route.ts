import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/adminGuard";
import { REPORT_REASONS } from "../../../../lib/reports";

// GET /api/admin/reports?status=OPEN|RESOLVED|DISMISSED
export async function GET(request: NextRequest) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const s = request.nextUrl.searchParams.get("status");
  const status = s === "RESOLVED" || s === "DISMISSED" ? s : "OPEN";
  const rows = await prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { id: true, name: true } },
      targetUser: { select: { id: true, name: true, blockedAt: true } },
      product: { select: { id: true, name: true, status: true } },
    },
  });
  return NextResponse.json(rows.map((r) => ({ ...r, reasonLabel: REPORT_REASONS[r.reason] ?? r.reason })));
}
