import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser, toPublicUser } from "../../../../lib/session";
import { isPlusActive } from "../../../../lib/bookings";

const TRIAL_DAYS = 30;

// POST /api/user/plus — активувати DBJU+ на 30 днів
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  if (isPlusActive(user.plusUntil)) {
    return NextResponse.json({ error: "Підписка вже активна" }, { status: 409 });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plusUntil: new Date(Date.now() + TRIAL_DAYS * 86400000) },
  });
  return NextResponse.json(toPublicUser(updated));
}

// DELETE /api/user/plus — скасувати підписку
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { plusUntil: null } });
  return NextResponse.json(toPublicUser(updated));
}
