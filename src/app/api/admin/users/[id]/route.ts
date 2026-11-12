import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/adminGuard";
import { BLOCKING_STATUSES } from "../../../../../lib/bookings";

// PATCH /api/admin/users/:id { action: "block" | "unblock", reason? }
// Заблокований не може увійти (сесії закриваються), його оголошення зникають з каталогу.
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/users/[id]">) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const { action, reason } = await request.json().catch(() => ({}));
  if (id === g.admin.id) return NextResponse.json({ error: "Не можна заблокувати себе" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
  if (target.role === "ADMIN") return NextResponse.json({ error: "Не можна заблокувати адміністратора" }, { status: 400 });

  if (action === "block") {
    const active = await prisma.booking.count({ where: { status: { in: BLOCKING_STATUSES }, OR: [{ renterId: id }, { ownerId: id }] } });
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { blockedAt: new Date(), blockedReason: typeof reason === "string" ? reason.trim().slice(0, 300) || null : null } }),
      prisma.session.deleteMany({ where: { userId: id } }),
    ]);
    return NextResponse.json({ success: true, activeBookings: active });
  }
  if (action === "unblock") {
    await prisma.user.update({ where: { id }, data: { blockedAt: null, blockedReason: null } });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Невідома дія" }, { status: 400 });
}
