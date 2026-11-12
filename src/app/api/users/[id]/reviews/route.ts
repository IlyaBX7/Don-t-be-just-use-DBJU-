import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { reviewInclude, toApiReview } from "../../../../../lib/reviews";

// GET /api/users/:id/reviews?role=OWNER|RENTER — відгуки про користувача
export async function GET(request: NextRequest, ctx: RouteContext<"/api/users/[id]/reviews">) {
  try {
    const { id } = await ctx.params;
    const role = request.nextUrl.searchParams.get("role");
    const reviews = await prisma.review.findMany({
      where: {
        targetId: id,
        ...(role === "OWNER" || role === "RENTER" ? { targetRole: role } : {}),
      },
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(reviews.map(toApiReview));
  } catch (error) {
    console.error("Помилка завантаження відгуків:", error);
    return NextResponse.json({ error: "Не вдалося завантажити відгуки" }, { status: 500 });
  }
}
