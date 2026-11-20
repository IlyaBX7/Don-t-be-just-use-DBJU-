import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentSession } from "../../../../lib/session";
import { hashPassword, isBlockedDevPassword, verifyPassword } from "../../../../lib/auth";
import { MAX_PASSWORD, MIN_PASSWORD } from "../../../../lib/users";

// POST /api/user/password { currentPassword, newPassword }
// Після зміни пароля всі ІНШІ сесії (інші пристрої) закриваються.
export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json().catch(() => ({}));
  if (!currentPassword || !verifyPassword(String(currentPassword), session.user.password)) {
    return NextResponse.json({ error: "Поточний пароль невірний" }, { status: 403 });
  }
  const next = String(newPassword ?? "");
  if (next.length < MIN_PASSWORD || next.length > MAX_PASSWORD) {
    return NextResponse.json(
      { error: `Новий пароль має містити від ${MIN_PASSWORD} до ${MAX_PASSWORD} символів` },
      { status: 400 }
    );
  }
  if (isBlockedDevPassword(next)) {
    return NextResponse.json({ error: "Цей пароль занадто простий. Оберіть інший." }, { status: 400 });
  }
  if (next === currentPassword) {
    return NextResponse.json({ error: "Новий пароль має відрізнятися від поточного" }, { status: 400 });
  }

  const [, closed] = await prisma.$transaction([
    prisma.user.update({ where: { id: session.userId }, data: { password: hashPassword(next) } }),
    prisma.session.deleteMany({ where: { userId: session.userId, id: { not: session.id } } }),
  ]);

  return NextResponse.json({ success: true, closedSessions: closed.count });
}
