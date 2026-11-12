import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { reviewInclude, toApiReview } from "../../../../../lib/reviews";

// GET /api/products/:id/reviews — відгуки орендарів, які брали саме цю річ
// (відгуки власника про орендарів сюди не входять — вони про людей, а не про річ)
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/products/[id]/reviews">) {
  try {
    const { id } = await ctx.params;
    const where = { targetRole: "OWNER" as const, booking: { productId: id } };

    const [reviews, agg, byStars] = await Promise.all([
      prisma.review.findMany({ where, include: reviewInclude, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.review.aggregate({ where, _avg: { rating: true }, _count: true }),
      prisma.review.groupBy({ by: ["rating"], where, _count: true }),
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    for (const r of byStars) distribution[r.rating] = r._count;

    return NextResponse.json({
      items: reviews.map(toApiReview),
      count: agg._count,
      average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      distribution,
    });
  } catch (error) {
    console.error("Помилка завантаження відгуків товару:", error);
    return NextResponse.json({ error: "Не вдалося завантажити відгуки" }, { status: 500 });
  }
}
