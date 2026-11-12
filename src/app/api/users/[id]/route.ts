import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";

// GET /api/users/:id — публічний профіль (без email, телефону та інших приватних даних)
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  try {
    const { id } = await ctx.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        firstName: true,
        avatar: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        verifiedAt: true,
        rating: true,
        reviewsCount: true,
        createdAt: true,
      },
    });
    if (!user) return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });

    const [activeListings, completedAsOwner, completedAsRenter, asOwner, asRenter] = await Promise.all([
      prisma.product.count({ where: { ownerId: id, status: { not: "HIDDEN" } } }),
      prisma.booking.count({ where: { ownerId: id, status: "COMPLETED" } }),
      prisma.booking.count({ where: { renterId: id, status: "COMPLETED" } }),
      prisma.review.aggregate({ where: { targetId: id, targetRole: "OWNER" }, _avg: { rating: true }, _count: true }),
      prisma.review.aggregate({ where: { targetId: id, targetRole: "RENTER" }, _avg: { rating: true }, _count: true }),
    ]);

    const round = (v: number | null) => (v ? Math.round(v * 10) / 10 : 0);

    return NextResponse.json({
      ...user,
      avatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
      verifiedAt: user.verifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      stats: {
        activeListings,
        completedAsOwner,
        completedAsRenter,
        ownerRating: round(asOwner._avg.rating),
        ownerReviews: asOwner._count,
        renterRating: round(asRenter._avg.rating),
        renterReviews: asRenter._count,
      },
    });
  } catch (error) {
    console.error("Помилка завантаження профілю:", error);
    return NextResponse.json({ error: "Не вдалося завантажити профіль" }, { status: 500 });
  }
}
