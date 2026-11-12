import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentSession } from "../../../../lib/session";

// GET /api/user/sessions — активні входи в акаунт (пристрої)
export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId: session.userId, expiresAt: { gt: new Date() } },
    select: { id: true, userAgent: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sessions.map((s) => ({ ...s, current: s.id === session.id })));
}

// DELETE /api/user/sessions — вийти на всіх інших пристроях
export async function DELETE() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

  const { count } = await prisma.session.deleteMany({
    where: { userId: session.userId, id: { not: session.id } },
  });
  return NextResponse.json({ success: true, closedSessions: count });
}
