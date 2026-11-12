import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/session";
import { notifyMessage } from "../../../../../lib/notify";
import { hit } from "../../../../../lib/rateLimit";

// Чат між орендарем і власником у межах одного бронювання.
// Контакти й домовленості лишаються на сайті — це також захищає від угод в обхід платформи.

async function loadParty(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 }) };
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, renterId: true, ownerId: true, status: true, product: { select: { name: true } } },
  });
  if (!booking || (booking.renterId !== user.id && booking.ownerId !== user.id)) {
    return { error: NextResponse.json({ error: "Бронювання не знайдено" }, { status: 404 }) };
  }
  return { user, booking };
}

// GET — повідомлення (і позначає вхідні як прочитані)
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/bookings/[id]/messages">) {
  const { id } = await ctx.params;
  const p = await loadParty(id);
  if (p.error) return p.error;

  const messages = await prisma.message.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: "asc" },
    take: 300,
    select: { id: true, senderId: true, text: true, createdAt: true, readAt: true },
  });
  await prisma.message.updateMany({ where: { bookingId: id, senderId: { not: p.user.id }, readAt: null }, data: { readAt: new Date() } });
  await prisma.notification.updateMany({
    where: { userId: p.user.id, type: "MESSAGE", readAt: null, link: { in: [`/rentals?booking=${id}`, `/profile/listings?booking=${id}`] } },
    data: { readAt: new Date() },
  });

  return NextResponse.json(
    messages.map((m) => ({ ...m, mine: m.senderId === p.user.id, createdAt: m.createdAt.toISOString(), readAt: m.readAt?.toISOString() ?? null }))
  );
}

// POST { text } — надіслати повідомлення
export async function POST(request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/messages">) {
  const { id } = await ctx.params;
  const p = await loadParty(id);
  if (p.error) return p.error;

  const { text } = await request.json().catch(() => ({}));
  const clean = typeof text === "string" ? text.trim() : "";
  if (!clean) return NextResponse.json({ error: "Напишіть повідомлення" }, { status: 400 });
  if (clean.length > 2000) return NextResponse.json({ error: "Повідомлення задовге (до 2000 символів)" }, { status: 400 });
  if (!(await hit(`msg:${p.user.id}`, 60, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Забагато повідомлень. Зачекайте кілька хвилин." }, { status: 429 });
  }

  const msg = await prisma.message.create({ data: { bookingId: id, senderId: p.user.id, text: clean } });
  const recipient = p.booking.renterId === p.user.id ? p.booking.ownerId : p.booking.renterId;
  await notifyMessage(
    recipient,
    id,
    `Повідомлення від ${p.user.firstName || p.user.name}`,
    `«${p.booking.product.name}»: ${clean.slice(0, 200)}`,
    `${recipient === p.booking.renterId ? "/rentals" : "/profile/listings"}?booking=${id}`
  );

  return NextResponse.json({ id: msg.id, senderId: msg.senderId, text: msg.text, mine: true, createdAt: msg.createdAt.toISOString(), readAt: null }, { status: 201 });
}
