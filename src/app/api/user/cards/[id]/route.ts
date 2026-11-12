import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/session";
import { cleanHolder, cleanLabel, parseExpiry } from "../../../../../lib/cards";

async function loadOwnCard(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 }) };
  const card = await prisma.paymentCard.findUnique({ where: { id } });
  if (!card || card.userId !== user.id) {
    return { error: NextResponse.json({ error: "Картку не знайдено" }, { status: 404 }) };
  }
  return { card };
}

// PATCH /api/user/cards/:id { expMonth?, expYear?, holder?, label?, isDefault? }
// Номер картки змінити не можна — для іншої картки додайте нову.
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/user/cards/[id]">) {
  const { id } = await ctx.params;
  const own = await loadOwnCard(id);
  if (own.error) return own.error;

  const body = await request.json().catch(() => ({}));
  const data: { expMonth?: number; expYear?: number; holder?: string; label?: string | null; isDefault?: boolean } = {};
  const errors: string[] = [];

  if (body.expMonth !== undefined || body.expYear !== undefined) {
    const exp = parseExpiry(body.expMonth ?? own.card.expMonth, body.expYear ?? own.card.expYear);
    if (!exp.ok) errors.push("термін дії");
    else {
      data.expMonth = exp.expMonth;
      data.expYear = exp.expYear;
    }
  }
  if (body.holder !== undefined) {
    const h = cleanHolder(body.holder);
    if (!h) errors.push("ім'я власника");
    else data.holder = h;
  }
  if (body.label !== undefined) data.label = cleanLabel(body.label);
  if (errors.length) {
    return NextResponse.json({ error: `Перевірте: ${errors.join(", ")}` }, { status: 400 });
  }

  const card = await prisma.$transaction(async (tx) => {
    if (body.isDefault === true) {
      await tx.paymentCard.updateMany({ where: { userId: own.card.userId }, data: { isDefault: false } });
      data.isDefault = true;
    }
    return tx.paymentCard.update({ where: { id }, data });
  });
  return NextResponse.json(card);
}

// DELETE /api/user/cards/:id — якщо видалили основну, основною стає найстаріша з решти
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/user/cards/[id]">) {
  const { id } = await ctx.params;
  const own = await loadOwnCard(id);
  if (own.error) return own.error;

  await prisma.$transaction(async (tx) => {
    await tx.paymentCard.delete({ where: { id } });
    if (own.card.isDefault) {
      const next = await tx.paymentCard.findFirst({
        where: { userId: own.card.userId },
        orderBy: { createdAt: "asc" },
      });
      if (next) await tx.paymentCard.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  return NextResponse.json({ success: true });
}
