import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type Db = Prisma.TransactionClient | typeof prisma;

export const CO2_PER_ITEM_KG = 7;

// Заробіток власника: «отримує власник» (оренда − 15%) за завершеними орендами мінус уже виведене
export async function getBalance(userId: string, db: Db = prisma) {
  const [earned, withdrawn] = await Promise.all([
    db.booking.aggregate({
      where: { ownerId: userId, status: "COMPLETED" },
      _sum: { ownerPayout: true },
    }),
    db.payout.aggregate({ where: { userId }, _sum: { amount: true } }),
  ]);
  const earnedSum = earned._sum.ownerPayout ?? 0;
  const withdrawnSum = withdrawn._sum.amount ?? 0;
  return { earned: earnedSum, withdrawn: withdrawnSum, balance: earnedSum - withdrawnSum };
}

export async function getProfileStats(userId: string) {
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

  const [balance, pending, activeListings, favoritesCount, activeRentals, awaitingConfirm, completedAsRenter] =
    await Promise.all([
      getBalance(userId),
      prisma.booking.aggregate({
        where: { ownerId: userId, status: { in: ["PAID", "PICKED_UP", "RETURNED"] } },
        _sum: { ownerPayout: true },
      }),
      prisma.product.count({ where: { ownerId: userId, status: { not: "HIDDEN" } } }),
      prisma.favorite.count({ where: { userId } }),
      prisma.booking.count({
        where: { renterId: userId, status: { in: ["PAID", "PICKED_UP", "RETURNED"] } },
      }),
      prisma.booking.count({ where: { ownerId: userId, status: { in: ["PAID", "RETURNED"] } } }),
      prisma.booking.findMany({
        where: { renterId: userId, status: "COMPLETED", completedAt: { gte: yearStart } },
        select: { productId: true, rentAmount: true, serviceFee: true, product: { select: { marketBuyPrice: true } } },
      }),
    ]);

  const saved = completedAsRenter.reduce(
    (sum, b) => sum + Math.max(0, (b.product.marketBuyPrice ?? 0) - b.rentAmount - b.serviceFee),
    0
  );
  const itemsNotBought = new Set(completedAsRenter.map((b) => b.productId)).size;

  return {
    ...balance,
    pendingEarnings: pending._sum.ownerPayout ?? 0,
    activeListings,
    favoritesCount,
    activeRentals,
    ownerActionNeeded: awaitingConfirm,
    saved,
    itemsNotBought,
    co2Kg: itemsNotBought * CO2_PER_ITEM_KG,
  };
}

export type ProfileStats = Awaited<ReturnType<typeof getProfileStats>>;
