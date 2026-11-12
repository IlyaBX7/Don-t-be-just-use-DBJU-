import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/adminGuard";
import { productInclude, toOwnerApiProduct } from "../../../../lib/products";

// GET /api/admin/listings?q=&status=HIDDEN|AVAILABLE|RENTED&reported=1 — усі оголошення (модерація)
// Сховати / показати / видалити — через PATCH/DELETE /api/products/:id (адміністратору дозволено)
export async function GET(request: NextRequest) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const p = request.nextUrl.searchParams;
  const where: Prisma.ProductWhereInput = {};
  const q = p.get("q")?.trim().slice(0, 100);
  if (q) where.OR = [{ name: { contains: q } }, { description: { contains: q } }, { owner: { name: { contains: q } } }];
  const status = p.get("status");
  if (status === "HIDDEN" || status === "AVAILABLE" || status === "RENTED") where.status = status;
  if (p.get("reported") === "1") where.reports = { some: { status: "OPEN" } };
  const rows = await prisma.product.findMany({
    where,
    include: { ...productInclude, _count: { select: { reports: { where: { status: "OPEN" } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(rows.map((r) => ({ ...toOwnerApiProduct(r), openReports: r._count.reports, ownerBlocked: Boolean(r.owner.blockedAt) })));
}
