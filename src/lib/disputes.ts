import type { Prisma } from "@prisma/client";

// Завершення оренди і суперечки про пошкодження (фінансова модель, розділ 1.1, п. 6):
// збиток покривається із застави, а якщо її не вистачає — зі страхового фонду DBJU (до 20 000 ₴).
// Оплата поки симульована: суми лише фіксуються в базі.

export const INSURANCE_LIMIT = 20_000;
export const MAX_CLAIM_PHOTOS = 6;

type Tx = Prisma.TransactionClient;

// Річ повернулась власнику: лічильник оренд +1, товар знову доступний
export async function finishRental(tx: Tx, booking: { id: string; productId: string }, data: Prisma.BookingUpdateInput) {
  await tx.product.update({ where: { id: booking.productId }, data: { rentalCount: { increment: 1 } } });
  await tx.product.updateMany({ where: { id: booking.productId, status: "RENTED" }, data: { status: "AVAILABLE" } });
  return tx.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED", completedAt: new Date(), ...data } });
}

// Скільки покривається із застави і скільки зі страхового фонду
export function splitCompensation(amount: number, deposit: number) {
  const fromDeposit = Math.min(amount, deposit);
  const fromFund = Math.min(Math.max(0, amount - deposit), INSURANCE_LIMIT);
  return { fromDeposit, fromFund, total: fromDeposit + fromFund, depositReturned: deposit - fromDeposit };
}

export async function resolveDispute(
  tx: Tx,
  booking: { id: string; productId: string; depositAmount: number },
  disputeId: string,
  amount: number,
  resolution: string,
  resolvedById: string | null
) {
  const c = splitCompensation(amount, booking.depositAmount);
  await tx.dispute.update({
    where: { id: disputeId },
    data: {
      status: "RESOLVED",
      resolution: resolution.slice(0, 2000),
      awardedFromDeposit: c.fromDeposit,
      awardedFromFund: c.fromFund,
      resolvedById,
      resolvedAt: new Date(),
    },
  });
  await finishRental(tx, booking, { ownerCompensation: c.total });
  return c;
}
