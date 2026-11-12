import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { BLOCKING_STATUSES, bookingInclude, isPlusActive, toApiBooking } from "../../../../lib/bookings";
import { addDays, formatDay, parseISODate, toISODate, todayISO } from "../../../../lib/dates";
import { quote, splitRent } from "../../../../lib/pricing";
import { isUploadUrl } from "../../../../lib/uploads";
import { INSURANCE_LIMIT, MAX_CLAIM_PHOTOS, finishRental, resolveDispute } from "../../../../lib/disputes";
import { notify, type NotifyInput } from "../../../../lib/notify";
import { rewardReferralIfFirstRental } from "../../../../lib/referrals";

class ActionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const photoList = (v: unknown, min: number, max: number): string[] | null => {
  if (!Array.isArray(v) || v.length < min || v.length > max || !v.every(isUploadUrl)) return null;
  return [...new Set(v as string[])];
};

// GET /api/bookings/:id — деталі (лише орендар або власник)
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  const { id } = await ctx.params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!booking || (booking.renterId !== user.id && booking.ownerId !== user.id)) {
    return NextResponse.json({ error: "Бронювання не знайдено" }, { status: 404 });
  }
  return NextResponse.json(toApiBooking(booking, user.id));
}

// PATCH /api/bookings/:id { action } — перехід між етапами оренди
//   handover        (власник)  PAID              фото стану перед передачею (необов'язково)
//   pickup          (орендар)  PAID → PICKED_UP  забрав річ + фото стану при отриманні (обов'язково)
//   return          (орендар)  PICKED_UP → RETURNED   повернув + фотозвіт
//   complete        (власник)  RETURNED → COMPLETED   стан у порядку, застава повертається
//   dispute         (власник)  RETURNED → DISPUTED    є пошкодження: опис, фото, сума компенсації
//   dispute_accept  (орендар)  DISPUTED           погоджується з сумою → COMPLETED
//   dispute_contest (орендар)  DISPUTED           не згоден → вирішує адміністратор
//   cancel          (обидва)   PAID → CANCELLED
//   extend          (орендар)  PAID | PICKED_UP   +N днів
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ActionError("Потрібно увійти в акаунт", 401);
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const notifications: { userId: string; n: NotifyInput }[] = [];
    let rewardRenter: string | null = null;

    const updatedId = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id }, include: { product: true, dispute: true } });
      if (!booking) throw new ActionError("Бронювання не знайдено", 404);
      const isRenter = booking.renterId === user.id;
      const isOwner = booking.ownerId === user.id;
      if (!isRenter && !isOwner) throw new ActionError("Бронювання не знайдено", 404);

      const now = new Date();
      const startISO = toISODate(booking.startDate);
      const name = booking.product.name;
      const renterLink = "/rentals";
      const ownerLink = "/profile/listings";
      const toOwner = (n: NotifyInput) => notifications.push({ userId: booking.ownerId, n: { link: ownerLink, ...n } });
      const toRenter = (n: NotifyInput) => notifications.push({ userId: booking.renterId, n: { link: renterLink, ...n } });

      switch (action) {
        case "handover": {
          if (!isOwner) throw new ActionError("Фото при передачі додає власник", 403);
          if (booking.status !== "PAID" && booking.status !== "PICKED_UP") throw new ActionError("Оренда вже завершена");
          const photos = photoList(body.photos, 1, 4);
          if (!photos) throw new ActionError("Додайте від 1 до 4 фото стану речі");
          await tx.booking.update({ where: { id }, data: { handoverPhotos: photos } });
          toRenter({ type: "HANDOVER", title: "Власник сфотографував стан речі", body: `«${name}» — фото перед передачею збережено в оренді.` });
          return id;
        }

        case "pickup": {
          if (!isRenter) throw new ActionError("Лише орендар може забрати річ", 403);
          if (booking.status !== "PAID") throw new ActionError("Річ уже отримано або оренду закрито");
          if (todayISO() < startISO) throw new ActionError("Забрати річ можна з першого дня оренди");
          const photos = photoList(body.photos, 1, 4);
          if (!photos) throw new ActionError("Сфотографуйте стан речі при отриманні (1–4 фото) — це захищає вас при поверненні");
          await tx.product.updateMany({ where: { id: booking.productId, status: "AVAILABLE" }, data: { status: "RENTED" } });
          await tx.booking.update({ where: { id }, data: { status: "PICKED_UP", pickedUpAt: now, pickupPhotos: photos } });
          toOwner({ type: "PICKUP", title: "Річ отримано", body: `Орендар забрав «${name}». Повернення — до ${formatDay(toISODate(booking.endDate))}.` });
          return id;
        }

        case "return": {
          if (!isRenter) throw new ActionError("Лише орендар може повернути річ", 403);
          if (booking.status !== "PICKED_UP") throw new ActionError("Спочатку заберіть річ");
          if (!isUploadUrl(body.photo)) throw new ActionError("Додайте фото речі для фотозвіту");
          await tx.booking.update({ where: { id }, data: { status: "RETURNED", returnedAt: now, returnPhoto: body.photo } });
          toOwner({ type: "RETURN", title: "Річ повернули — перевірте стан", body: `«${name}»: порівняйте фото при отриманні й поверненні та підтвердіть або повідомте про пошкодження.` });
          return id;
        }

        case "complete": {
          if (!isOwner) throw new ActionError("Лише власник підтверджує повернення", 403);
          if (booking.status !== "RETURNED") throw new ActionError("Річ ще не повернули");
          const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
          await finishRental(tx, booking, { ownerNote: note || null });
          rewardRenter = booking.renterId;
          toRenter({ type: "COMPLETED", title: "Оренду завершено, заставу повернуто", body: `Власник підтвердив стан «${name}». Залиште відгук — це допоможе іншим.` });
          return id;
        }

        case "dispute": {
          if (!isOwner) throw new ActionError("Про пошкодження повідомляє власник", 403);
          if (booking.status !== "RETURNED") throw new ActionError("Повідомити про пошкодження можна після повернення речі");
          const reason = typeof body.reason === "string" ? body.reason.trim() : "";
          const photos = photoList(body.photos, 1, MAX_CLAIM_PHOTOS);
          const amount = Number(body.claimAmount);
          if (reason.length < 10) throw new ActionError("Опишіть пошкодження детальніше (від 10 символів)");
          if (!photos) throw new ActionError(`Додайте фото пошкодження (1–${MAX_CLAIM_PHOTOS})`);
          if (!Number.isInteger(amount) || amount < 1 || amount > booking.depositAmount + INSURANCE_LIMIT) {
            throw new ActionError(`Сума компенсації — від 1 до ${booking.depositAmount + INSURANCE_LIMIT} ₴`);
          }
          await tx.dispute.create({
            data: { bookingId: id, openedById: user.id, reason: reason.slice(0, 3000), photos, claimAmount: amount },
          });
          await tx.booking.update({ where: { id }, data: { status: "DISPUTED" } });
          toRenter({ type: "DISPUTE", title: "Власник повідомив про пошкодження", body: `«${name}»: запит компенсації ${amount} ₴. Погодьтеся або оскаржте в «Моїх орендах».` });
          return id;
        }

        case "dispute_accept":
        case "dispute_contest": {
          if (!isRenter) throw new ActionError("Відповідає орендар", 403);
          if (booking.status !== "DISPUTED" || !booking.dispute || booking.dispute.status !== "OPEN") {
            throw new ActionError("Немає відкритої суперечки");
          }
          const response = typeof body.response === "string" ? body.response.trim().slice(0, 3000) : "";
          if (action === "dispute_accept") {
            await tx.dispute.update({ where: { id: booking.dispute.id }, data: { renterResponse: response || null } });
            const c = await resolveDispute(tx, booking, booking.dispute.id, booking.dispute.claimAmount, "Орендар погодився з претензією.", null);
            rewardRenter = booking.renterId;
            toOwner({ type: "DISPUTE", title: "Орендар погодився з компенсацією", body: `«${name}»: ${c.total} ₴ зараховано на ваш баланс.` });
          } else {
            if (response.length < 10) throw new ActionError("Поясніть, чому ви не згодні (від 10 символів)");
            await tx.dispute.update({ where: { id: booking.dispute.id }, data: { status: "CONTESTED", renterResponse: response } });
            toOwner({ type: "DISPUTE", title: "Орендар оскаржив претензію", body: `«${name}»: суперечку розгляне адміністратор DBJU.` });
            const admins = await tx.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
            for (const a of admins) {
              notifications.push({ userId: a.id, n: { type: "ADMIN", title: "Нова суперечка на розгляд", body: `«${name}»: ${booking.dispute.claimAmount} ₴`, link: "/admin/disputes" } });
            }
          }
          return id;
        }

        case "cancel": {
          if (booking.status !== "PAID") throw new ActionError("Скасувати можна лише до отримання речі");
          await tx.booking.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: now } });
          // Використані бонуси повертаються орендарю
          if (booking.bonusUsed > 0) {
            await tx.bonusTransaction.create({
              data: { userId: booking.renterId, amount: booking.bonusUsed, reason: "BOOKING_REFUND", bookingId: id, uniqueKey: `refund:${id}` },
            });
          }
          const who = isRenter ? "Орендар" : "Власник";
          const n = { type: "CANCELLED", title: "Бронювання скасовано", body: `${who} скасував бронювання «${name}» (${formatDay(startISO)}). Кошти повертаються повністю.` };
          if (isRenter) toOwner(n);
          else toRenter(n);
          return id;
        }

        case "extend": {
          if (!isRenter) throw new ActionError("Лише орендар може продовжити оренду", 403);
          if (booking.status !== "PAID" && booking.status !== "PICKED_UP") throw new ActionError("Цю оренду вже не можна продовжити");
          const extra = Number(body.days);
          if (!Number.isInteger(extra) || extra < 1 || extra > 14) throw new ActionError("Продовжити можна на 1–14 днів");
          const newEnd = addDays(toISODate(booking.endDate), extra);
          const conflict = await tx.booking.findFirst({
            where: {
              id: { not: id },
              productId: booking.productId,
              status: { in: BLOCKING_STATUSES },
              startDate: { lte: parseISODate(newEnd) },
              endDate: { gt: booking.endDate },
            },
          });
          if (conflict) throw new ActionError("Річ уже заброньована на ці дні іншим орендарем", 409);

          const renter = await tx.user.findUniqueOrThrow({ where: { id: booking.renterId } });
          const days = booking.days + extra;
          const q = quote(
            { pricePerDay: booking.product.rentalPricePerDay, price3Days: booking.product.price3Days, priceWeek: booking.product.priceWeek },
            days,
            booking.deliveryMethod,
            isPlusActive(renter.plusUntil)
          );
          const rentAmount = Math.max(q.rentAmount, booking.rentAmount);
          const split = splitRent(rentAmount, isPlusActive(renter.plusUntil));
          const serviceFee = Math.max(split.serviceFee, booking.serviceFee);
          const extraCharge = rentAmount - booking.rentAmount + (serviceFee - booking.serviceFee);
          await tx.booking.update({
            where: { id },
            data: {
              endDate: parseISODate(newEnd),
              days,
              rentAmount,
              serviceFee,
              ownerCommission: split.ownerCommission,
              ownerPayout: split.ownerPayout,
              totalAmount: booking.totalAmount + extraCharge,
            },
          });
          toOwner({ type: "EXTENDED", title: "Оренду продовжено", body: `«${name}» — тепер до ${formatDay(newEnd)}. Ви отримаєте ${split.ownerPayout} ₴.` });
          return id;
        }

        default:
          throw new ActionError("Невідома дія");
      }
    });

    for (const { userId, n } of notifications) await notify(userId, n);
    if (rewardRenter) await rewardReferralIfFirstRental(rewardRenter);

    const fresh = await prisma.booking.findUniqueOrThrow({ where: { id: updatedId }, include: bookingInclude });
    return NextResponse.json(toApiBooking(fresh, user.id));
  } catch (error) {
    if (error instanceof ActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Помилка оновлення бронювання:", error);
    return NextResponse.json({ error: "Не вдалося оновити бронювання" }, { status: 500 });
  }
}
