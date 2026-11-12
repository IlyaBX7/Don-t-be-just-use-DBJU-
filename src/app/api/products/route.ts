import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { isCategoryKey, productInclude, toApiProduct, toOwnerApiProduct } from "../../../lib/products";
import { parseProductInput } from "../../../lib/productInput";

// GET /api/products?category=repair&q=bosch — каталог (приховані не показуються)
// GET /api/products?owner=me — усі мої оголошення, включно з прихованими
// GET /api/products?owner=<userId> — публічні оголошення користувача
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const category = params.get("category");
    const q = params.get("q")?.trim();

    const where: Prisma.ProductWhereInput = {};
    const owner = params.get("owner");
    if (owner === "me") {
      const user = await getCurrentUser();
      if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
      where.ownerId = user.id;
    } else {
      where.status = { not: "HIDDEN" };
      where.owner = { blockedAt: null };
      if (owner) where.ownerId = owner;
    }
    if (isCategoryKey(category)) where.category = category;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { fullTitle: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products.map((p) => (owner === "me" ? toOwnerApiProduct(p) : toApiProduct(p))));
  } catch (error) {
    console.error("Помилка завантаження товарів:", error);
    return NextResponse.json({ error: "Не вдалося завантажити товари" }, { status: 500 });
  }
}

// POST /api/products — створення оголошення поточним користувачем
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Некоректний запит" }, { status: 400 });
    }
    const parsed = parseProductInput(body, false);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const created = await prisma.product.create({
      data: {
        ...(parsed.data as Prisma.ProductUncheckedCreateInput),
        features: {},
        ownerId: user.id,
      },
      include: productInclude,
    });

    return NextResponse.json(toOwnerApiProduct(created), { status: 201 });
  } catch (error) {
    console.error("Помилка створення товару:", error);
    return NextResponse.json({ error: "Не вдалося зберегти оголошення" }, { status: 500 });
  }
}
