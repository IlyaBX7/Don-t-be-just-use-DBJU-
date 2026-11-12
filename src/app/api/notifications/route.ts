import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { maybeRunSweep } from "../../../lib/scheduler";

// GET /api/notifications — останні сповіщення + кількість непрочитаних
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  await maybeRunSweep();

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, type: true, title: true, body: true, link: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return NextResponse.json({
    unread,
    items: items.map((n) => ({ ...n, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() })),
  });
}

// PATCH { ids?: string[] } — позначити прочитаними (без ids — усі)
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  const { ids } = await request.json().catch(() => ({}));
  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
      ...(Array.isArray(ids) ? { id: { in: ids.filter((x: unknown) => typeof x === "string").slice(0, 100) } } : {}),
    },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
