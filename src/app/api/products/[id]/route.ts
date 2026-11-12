import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { productInclude, toApiProduct, toOwnerApiProduct } from "../../../../lib/products";
import { parseProductInput } from "../../../../lib/productInput";
import { BLOCKING_STATUSES } from "../../../../lib/bookings";
import { removeUnusedImages } from "../../../../lib/imageCleanup";

// GET /api/products/:id — один товар (прихований бачить лише власник)
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  try {
    const { id } = await ctx.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
    }
    const user = await getCurrentUser();
    const privileged = user?.id === product.ownerId || user?.role === "ADMIN";
    // Приховане оголошення або заблокований власник — бачать лише власник і адміністратор
    if ((product.status === "HIDDEN" || product.owner.blockedAt) && !privileged) {
      return NextResponse.json({ error: "Товар не знайдено" }, { status: 404 });
    }
    return NextResponse.json(privileged ? toOwnerApiProduct(product) : toApiProduct(product));
  } catch (error) {
    console.error("Помилка завантаження товару:", error);
    return NextResponse.json({ error: "Не вдалося завантажити товар" }, { status: 500 });
  }
}

async function loadOwned(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 }) };
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { error: NextResponse.json({ error: "Товар не знайдено" }, { status: 404 }) };
  if (product.ownerId !== user.id && user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Це не ваше оголошення" }, { status: 403 }) };
  }
  return { product };
}

// PATCH /api/products/:id — редагування / приховування (власник або адмін)
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  try {
    const { id } = await ctx.params;
    const owned = await loadOwned(id);
    if (owned.error) return owned.error;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Некоректний запит" }, { status: 400 });
    }
    const parsed = parseProductInput(body, true);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    if (parsed.data.status === "AVAILABLE" && owned.product.status === "RENTED") {
      delete parsed.data.status; // річ зараз у орендаря — статус повернеться після завершення
    }

    const updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: productInclude,
    });

    // Фото, які власник прибрав з оголошення, видаляємо зі сховища
    const before = Array.isArray(owned.product.images) ? owned.product.images : [];
    const after = Array.isArray(updated.images) ? updated.images : [];
    await removeUnusedImages(before.filter((u) => !after.includes(u)));

    return NextResponse.json(toOwnerApiProduct(updated));
  } catch (error) {
    console.error("Помилка оновлення товару:", error);
    return NextResponse.json({ error: "Не вдалося оновити оголошення" }, { status: 500 });
  }
}

// DELETE /api/products/:id — видалення, якщо немає активних оренд
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  try {
    const { id } = await ctx.params;
    const owned = await loadOwned(id);
    if (owned.error) return owned.error;

    const active = await prisma.booking.count({
      where: { productId: id, status: { in: BLOCKING_STATUSES } },
    });
    if (active > 0) {
      return NextResponse.json(
        { error: "Є активні бронювання. Сховайте оголошення або дочекайтеся їх завершення." },
        { status: 409 }
      );
    }
    // Разом з товаром каскадно видаляються його завершені бронювання та їхні фотозвіти
    const reports = await prisma.booking.findMany({
      where: { productId: id, returnPhoto: { not: null } },
      select: { returnPhoto: true },
    });
    await prisma.product.delete({ where: { id } });
    await removeUnusedImages([
      ...(Array.isArray(owned.product.images) ? owned.product.images : []),
      ...reports.map((r) => r.returnPhoto),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Помилка видалення товару:", error);
    return NextResponse.json({ error: "Не вдалося видалити оголошення" }, { status: 500 });
  }
}
