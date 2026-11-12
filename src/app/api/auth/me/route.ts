import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser, toPublicUser } from "../../../../lib/session";

// GET /api/auth/me — поточний користувач + id обраних товарів
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ user: null, favoriteIds: [] });

    const favs = await prisma.favorite.findMany({
      where: { userId: user.id },
      select: { productId: true },
    });
    return NextResponse.json({
      user: toPublicUser(user),
      favoriteIds: favs.map((f) => f.productId),
    });
  } catch (error) {
    console.error("Помилка перевірки сесії:", error);
    return NextResponse.json({ user: null, favoriteIds: [] });
  }
}
