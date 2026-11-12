import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/adminGuard";

// GET /api/admin/users?q=&filter=blocked — користувачі
export async function GET(request: NextRequest) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
  const where: Prisma.UserWhereInput = {};
  if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }];
  if (request.nextUrl.searchParams.get("filter") === "blocked") where.blockedAt = { not: null };
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, name: true, email: true, phone: true, role: true, isVerified: true, rating: true, reviewsCount: true,
      blockedAt: true, blockedReason: true, createdAt: true, lastLoginAt: true,
      _count: { select: { products: true, rentals: true, reportsAgainst: true } },
    },
  });
  return NextResponse.json(users);
}
