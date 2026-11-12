import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { notify } from "./notify";

// Реферальна програма (фінансова модель, етап 2): бонус 100 ₴ запрошеному і тому, хто запросив,
// коли запрошений завершить першу оренду. Бонусами можна оплатити частину наступної оренди —
// їх «оплачує» платформа (маркетинг), власник отримує свою суму повністю.

export const REFERRAL_BONUS = 100;
export const REF_COOKIE = "dbju_ref";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // без схожих 0/O, 1/I
export function makeReferralCode(): string {
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });
  if (u.referralCode) return u.referralCode;
  for (let i = 0; i < 5; i++) {
    try {
      const code = makeReferralCode();
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      // збіг коду — пробуємо інший
    }
  }
  throw new Error("Не вдалося створити реферальний код");
}

export async function bonusBalance(userId: string, db: Prisma.TransactionClient | typeof prisma = prisma): Promise<number> {
  const agg = await db.bonusTransaction.aggregate({ where: { userId }, _sum: { amount: true } });
  return agg._sum.amount ?? 0;
}

// Викликається після завершення оренди: якщо це перша завершена оренда запрошеного — нараховуємо обом
export async function rewardReferralIfFirstRental(renterId: string): Promise<void> {
  const renter = await prisma.user.findUnique({ where: { id: renterId }, select: { referredById: true, firstName: true } });
  if (!renter?.referredById) return;
  const completed = await prisma.booking.count({ where: { renterId, status: "COMPLETED" } });
  if (completed !== 1) return;
  const inviterId = renter.referredById;
  try {
    await prisma.bonusTransaction.createMany({
      data: [
        { userId: renterId, amount: REFERRAL_BONUS, reason: "REFERRAL_INVITEE", uniqueKey: `ref-invitee:${renterId}` },
        { userId: inviterId, amount: REFERRAL_BONUS, reason: "REFERRAL_INVITER", uniqueKey: `ref-inviter:${inviterId}:${renterId}` },
      ],
      skipDuplicates: true,
    });
  } catch (e) {
    console.error("Реферальний бонус:", e);
    return;
  }
  await notify(renterId, { type: "BONUS", title: `+${REFERRAL_BONUS} ₴ бонусів`, body: "За першу оренду за запрошенням друга. Використайте їх при наступному бронюванні.", link: "/profile/referrals", dedupeKey: `notif-ref-invitee:${renterId}` });
  await notify(inviterId, { type: "BONUS", title: `+${REFERRAL_BONUS} ₴ бонусів`, body: `${renter.firstName || "Ваш друг"} завершив першу оренду за вашим запрошенням.`, link: "/profile/referrals", dedupeKey: `notif-ref-inviter:${inviterId}:${renterId}` });
}
