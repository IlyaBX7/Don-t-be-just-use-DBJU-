import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { MAX_CARDS, cleanHolder, cleanLabel, parseCardNumber, parseExpiry } from "../../../../lib/cards";

const cardSelect = {
  id: true,
  brand: true,
  last4: true,
  expMonth: true,
  expYear: true,
  holder: true,
  label: true,
  isDefault: true,
  createdAt: true,
} as const;

// GET /api/user/cards — мої картки для виплат
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  const cards = await prisma.paymentCard.findMany({
    where: { userId: user.id },
    select: cardSelect,
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(cards);
}

// POST /api/user/cards { number, expMonth, expYear, holder, label?, isDefault? }
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const num = parseCardNumber(body.number);
  const exp = parseExpiry(body.expMonth, body.expYear);
  const holder = cleanHolder(body.holder);
  const errors: string[] = [];
  if (!num.ok) errors.push("номер картки");
  if (!exp.ok) errors.push("термін дії");
  if (!holder) errors.push("ім'я власника");
  if (errors.length) {
    return NextResponse.json({ error: `Перевірте: ${errors.join(", ")}` }, { status: 400 });
  }

  const count = await prisma.paymentCard.count({ where: { userId: user.id } });
  if (count >= MAX_CARDS) {
    return NextResponse.json({ error: `Можна додати не більше ${MAX_CARDS} карток` }, { status: 400 });
  }
  const makeDefault = count === 0 || body.isDefault === true;

  const card = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.paymentCard.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.paymentCard.create({
      data: {
        userId: user.id,
        brand: num.ok ? num.brand : "other",
        last4: num.ok ? num.last4 : "0000",
        expMonth: exp.ok ? exp.expMonth : 1,
        expYear: exp.ok ? exp.expYear : 2000,
        holder: holder!,
        label: cleanLabel(body.label),
        isDefault: makeDefault,
      },
      select: cardSelect,
    });
  });
  return NextResponse.json(card, { status: 201 });
}
