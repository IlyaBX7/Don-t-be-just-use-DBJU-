import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { BLOCKING_STATUSES, bookingInclude, isPlusActive, toApiBooking } from "../../../../lib/bookings";
import { addDays, parseISODate, toISODate, todayISO } from "../../../../lib/dates";
import { quote, splitRent } from "../../../../lib/pricing";
import { isUploadUrl } from "../../../../lib/uploads";

class ActionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// GET /api/bookings/:id — деталі (лише орендар або власник)
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  const { id } = await ctx.params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!booking || (booking.renterId !== user.id && booking.ownerId !== user.id)) {
    return NextResponse.json({ error: "Бронювання не знайдено" }, { status: 404 });
  }
  return NextResponse.json(toApiBooking(booking));
}

// PATCH /api/bookings/:id { action } — перехід між етапами оренди
//   pickup   (орендар)  PAID → PICKED_UP       забрав річ
//   return   (орендар)  PICKED_UP → RETURNED   повернув + фотозвіт
//   complete (власник)  RETURNED → COMPLETED   підтвердив стан, застава повертається
//   cancel   (обидва)   PAID → CANCELLED
//   extend   (орендар)  PAID | PICKED_UP       +N днів
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ActionError("Потрібно увійти в акаунт", 401);
    const { id } = await ctx.params;
    const body = await request.json();
    const action = String(body.action ?? "");

    const updated = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id }, include: { product: true } });
      if (!booking) throw new ActionError("Бронювання не знайдено", 404);
      const isRenter = booking.renterId === user.id;
      const isOwner = booking.ownerId === user.id;
      if (!isRenter && !isOwner) throw new ActionError("Бронювання не знайдено", 404);

      const now = new Date();
      const startISO = toISODate(booking.startDate);

      switch (action) {
        case "pickup": {
          if (!isRenter) throw new ActionError("Лише орендар може забрати річ", 403);
          if (booking.status !== "PAID") throw new ActionError("Річ уже отримано або оренду закрито");
          if (todayISO() < startISO) {
            throw new ActionError("Забрати річ можна з першого дня оренди");
          }
          await tx.product.updateMany({
            where: { id: booking.productId, status: "AVAILABLE" },
            data: { status: "RENTED" },
          });
          return tx.booking.update({
            where: { id },
            data: { status: "PICKED_UP", pickedUpAt: now },
            include: bookingInclude,
          });
        }

        case "return": {
          if (!isRenter) throw new ActionError("Лише орендар може повернути річ", 403);
          if (booking.status !== "PICKED_UP") throw new ActionError("Спочатку заберіть річ");
          if (!isUploadUrl(body.photo)) throw new ActionError("Додайте фото речі для фотозвіту");
          return tx.booking.update({
            where: { id },
            data: { status: "RETURNED", returnedAt: now, returnPhoto: body.photo },
            include: bookingInclude,
          });
        }

        case "complete": {
          if (!isOwner) throw new ActionError("Лише власник підтверджує повернення", 403);
          if (booking.status !== "RETURNED") throw new ActionError("Річ ще не повернули");
          const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
          await tx.product.update({
            where: { id: booking.productId },
            data: { rentalCount: { increment: 1 } },
          });
          await tx.product.updateMany({
            where: { id: booking.productId, status: "RENTED" },
            data: { status: "AVAILABLE" },
          });
          return tx.booking.update({
            where: { id },
            data: { status: "COMPLETED", completedAt: now, ownerNote: note || null },
            include: bookingInclude,
          });
        }

        case "cancel": {
          if (booking.status !== "PAID") {
            throw new ActionError("Скасувати можна лише до отримання речі");
          }
          return tx.booking.update({
            where: { id },
            data: { status: "CANCELLED", cancelledAt: now },
            include: bookingInclude,
          });
        }

        case "extend": {
          if (!isRenter) throw new ActionError("Лише орендар може продовжити оренду", 403);
          if (booking.status !== "PAID" && booking.status !== "PICKED_UP") {
            throw new ActionError("Цю оренду вже не можна продовжити");
          }
          const extra = Number(body.days);
          if (!Number.isInteger(extra) || extra < 1 || extra > 14) {
            throw new ActionError("Продовжити можна на 1–14 днів");
          }
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
            {
              pricePerDay: booking.product.rentalPricePerDay,
              price3Days: booking.product.price3Days,
              priceWeek: booking.product.priceWeek,
            },
            days,
            booking.deliveryMethod,
            isPlusActive(renter.plusUntil)
          );
          // Нова вартість оренди не може бути меншою за вже сплачену
          const rentAmount = Math.max(q.rentAmount, booking.rentAmount);
          const split = splitRent(rentAmount, isPlusActive(renter.plusUntil));
          // Сервісний збір не зменшуємо нижче вже сплаченого (напр., якщо DBJU+ увімкнули посеред оренди)
          const serviceFee = Math.max(split.serviceFee, booking.serviceFee);
          // Доплата орендаря = різниця в оренді + різниця у сервісному зборі; доставка вже оплачена
          const extraCharge = rentAmount - booking.rentAmount + (serviceFee - booking.serviceFee);
          return tx.booking.update({
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
            include: bookingInclude,
          });
        }

        default:
          throw new ActionError("Невідома дія");
      }
    });

    return NextResponse.json(toApiBooking(updated));
  } catch (error) {
    if (error instanceof ActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Помилка оновлення бронювання:", error);
    return NextResponse.json({ error: "Не вдалося оновити бронювання" }, { status: 500 });
  }
}
