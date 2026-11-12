import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { REFERRAL_BONUS, bonusBalance, ensureReferralCode } from "../../../lib/referrals";

// GET /api/referrals — мій код, запрошені друзі, бонуси
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  const code = await ensureReferralCode(user.id);
  const [invited, balance, history] = await Promise.all([
    prisma.user.findMany({
      where: { referredById: user.id },
      select: { id: true, firstName: true, createdAt: true, rentals: { where: { status: "COMPLETED" }, select: { id: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    bonusBalance(user.id),
    prisma.bonusTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return NextResponse.json({
    code,
    bonusPerFriend: REFERRAL_BONUS,
    balance,
    invited: invited.map((u) => ({ id: u.id, name: u.firstName || "Користувач", joinedAt: u.createdAt.toISOString(), rewarded: u.rentals.length > 0 })),
    history: history.map((h) => ({ id: h.id, amount: h.amount, reason: h.reason, createdAt: h.createdAt.toISOString() })),
  });
}
