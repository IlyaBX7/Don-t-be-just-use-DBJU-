import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/adminGuard";
import { INSURANCE_LIMIT, resolveDispute } from "../../../../../lib/disputes";
import { notify } from "../../../../../lib/notify";
import { rewardReferralIfFirstRental } from "../../../../../lib/referrals";

// PATCH /api/admin/disputes/:bookingId { amount, resolution } — рішення адміністратора у суперечці
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/disputes/[id]">) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const { amount, resolution } = await request.json().catch(() => ({}));
  const booking = await prisma.booking.findUnique({ where: { id }, include: { dispute: true, product: { select: { name: true } } } });
  if (!booking?.dispute || booking.dispute.status === "RESOLVED") {
    return NextResponse.json({ error: "Відкритої суперечки не знайдено" }, { status: 404 });
  }
  const sum = Number(amount);
  const max = Math.min(booking.dispute.claimAmount, booking.depositAmount + INSURANCE_LIMIT);
  if (!Number.isInteger(sum) || sum < 0 || sum > max) {
    return NextResponse.json({ error: `Сума — від 0 до ${max} ₴` }, { status: 400 });
  }
  const text = typeof resolution === "string" ? resolution.trim() : "";
  if (text.length < 5) return NextResponse.json({ error: "Коротко поясніть рішення" }, { status: 400 });

  const c = await prisma.$transaction((tx) => resolveDispute(tx, booking, booking.dispute!.id, sum, text, g.admin.id));
  const name = booking.product.name;
  await notify(booking.ownerId, { type: "DISPUTE", title: "Рішення у суперечці", body: `«${name}»: компенсація ${c.total} ₴ (із застави ${c.fromDeposit} ₴, страховий фонд ${c.fromFund} ₴). ${text}`, link: "/profile/listings" });
  await notify(booking.renterId, { type: "DISPUTE", title: "Рішення у суперечці", body: `«${name}»: утримано ${c.fromDeposit} ₴ із застави, повернуто ${c.depositReturned} ₴. ${text}`, link: "/rentals" });
  await rewardReferralIfFirstRental(booking.renterId);
  return NextResponse.json({ success: true, ...c });
}
