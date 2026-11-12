import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { notify } from "../../../lib/notify";
import { hit } from "../../../lib/rateLimit";
import { REPORT_REASONS } from "../../../lib/reports";

// POST /api/reports { productId? | userId?, reason, details? } — скарга на оголошення чи користувача
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  if (!(await hit(`report:${user.id}`, 10, 24 * 3600 * 1000))) {
    return NextResponse.json({ error: "Забагато скарг за добу" }, { status: 429 });
  }
  const b = await request.json().catch(() => ({}));
  if (!(b.reason in REPORT_REASONS)) return NextResponse.json({ error: "Оберіть причину скарги" }, { status: 400 });
  const details = typeof b.details === "string" ? b.details.trim().slice(0, 1000) : "";

  let data: { targetType: "PRODUCT" | "USER"; productId?: string; targetUserId?: string };
  if (typeof b.productId === "string") {
    const product = await prisma.product.findUnique({ where: { id: b.productId }, select: { id: true, ownerId: true } });
    if (!product) return NextResponse.json({ error: "Оголошення не знайдено" }, { status: 404 });
    if (product.ownerId === user.id) return NextResponse.json({ error: "Це ваше оголошення" }, { status: 400 });
    data = { targetType: "PRODUCT", productId: product.id, targetUserId: product.ownerId };
  } else if (typeof b.userId === "string") {
    if (b.userId === user.id) return NextResponse.json({ error: "Не можна поскаржитися на себе" }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: b.userId }, select: { id: true } });
    if (!target) return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
    data = { targetType: "USER", targetUserId: target.id };
  } else {
    return NextResponse.json({ error: "На що скарга?" }, { status: 400 });
  }

  await prisma.report.create({ data: { ...data, reporterId: user.id, reason: b.reason, details: details || null } });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  for (const a of admins) {
    await notify(a.id, { type: "ADMIN", title: "Нова скарга", body: REPORT_REASONS[b.reason], link: "/admin/reports" });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
