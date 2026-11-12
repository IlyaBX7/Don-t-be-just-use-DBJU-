import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { productInclude, toApiProduct } from "../../../lib/products";

// GET /api/favorites — мій список бажань (товари)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

  const favs = await prisma.favorite.findMany({
    where: { userId: user.id, product: { status: { not: "HIDDEN" }, owner: { blockedAt: null } } },
    include: { product: { include: productInclude } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(favs.map((f) => toApiProduct(f.product)));
}

// PUT /api/favorites { productId, favorite: true|false }
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

  const { productId, favorite } = await request.json();
  if (typeof productId !== "string") {
    return NextResponse.json({ error: "Не вказано товар" }, { status: 400 });
  }

  try {
    if (favorite) {
      await prisma.favorite.upsert({
        where: { userId_productId: { userId: user.id, productId } },
        update: {},
        create: { userId: user.id, productId },
      });
    } else {
      await prisma.favorite.deleteMany({ where: { userId: user.id, productId } });
    }
    return NextResponse.json({ success: true, favorite: Boolean(favorite) });
  } catch {
    return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
  }
}
