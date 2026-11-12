import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { getBalance } from "../../../lib/stats";

class PayoutError extends Error {}

// GET /api/payouts — історія виведень
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  const payouts = await prisma.payout.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(payouts);
}

// POST /api/payouts { cardId? } — вивести весь доступний баланс на збережену картку
// (без cardId — на основну картку)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

  const { cardId } = await request.json().catch(() => ({}));
  const card = await prisma.paymentCard.findFirst({
    where: { userId: user.id, ...(typeof cardId === "string" ? { id: cardId } : { isDefault: true }) },
  });
  if (!card) {
    return NextResponse.json(
      { error: "Додайте картку для виплат у розділі «Редагування профілю»" },
      { status: 400 }
    );
  }

  try {
    const payout = await prisma.$transaction(async (tx) => {
      // Блокуємо користувача, щоб два одночасні запити не вивели баланс двічі
      await tx.$queryRaw`SELECT id FROM User WHERE id = ${user.id} FOR UPDATE`;
      const { balance } = await getBalance(user.id, tx);
      if (balance <= 0) throw new PayoutError("Немає коштів для виведення");
      return tx.payout.create({
        data: { userId: user.id, amount: balance, card: `•••• ${card.last4}` },
      });
    });
    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    if (error instanceof PayoutError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Помилка виведення:", error);
    return NextResponse.json({ error: "Не вдалося вивести кошти" }, { status: 500 });
  }
}
