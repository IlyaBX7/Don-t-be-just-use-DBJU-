import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import {
  BLOCKING_STATUSES,
  bookingInclude,
  isPlusActive,
  makeBookingCode,
  toApiBooking,
} from "../../../lib/bookings";
import { daysInclusive, isISODate, parseISODate, todayISO, addDays, formatDay, formatRange, toISODate } from "../../../lib/dates";
import { notify } from "../../../lib/notify";
import { bonusBalance } from "../../../lib/referrals";
import { ACTIVE_RENTAL_STATUSES } from "../../../lib/products";
import { quote, DELIVERY_OPTIONS, type DeliveryMethod } from "../../../lib/pricing";

const MAX_DAYS = 30;
const MAX_AHEAD_DAYS = 90;

class BookingError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// GET /api/bookings?role=renter (мої оренди) | role=owner (бронювання моїх речей)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

  const role = request.nextUrl.searchParams.get("role") === "owner" ? "owner" : "renter";
  const bookings = await prisma.booking.findMany({
    where: role === "owner" ? { ownerId: user.id } : { renterId: user.id },
    include: bookingInclude,
    orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(bookings.map((b) => toApiBooking(b, user.id)));
}

// POST /api/bookings — бронювання та «оплата» оренди
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new BookingError("Потрібно увійти в акаунт", 401);

    const body = await request.json();
    const { productId, startDate, endDate } = body;
    const deliveryMethod = body.deliveryMethod as DeliveryMethod;
    const deliveryAddress =
      typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim().slice(0, 255) : "";

    if (typeof productId !== "string") throw new BookingError("Не вказано товар");
    if (!isISODate(startDate) || !isISODate(endDate)) throw new BookingError("Оберіть дати оренди");
    if (!(deliveryMethod in DELIVERY_OPTIONS)) throw new BookingError("Оберіть спосіб отримання");
    if (deliveryMethod === "COURIER" && !deliveryAddress) {
      throw new BookingError("Вкажіть адресу для кур'єра");
    }

    const today = todayISO();
    if (startDate < today) throw new BookingError("Не можна бронювати минулі дати");
    if (startDate > addDays(today, MAX_AHEAD_DAYS)) {
      throw new BookingError(`Бронювати можна не більше ніж на ${MAX_AHEAD_DAYS} днів наперед`);
    }
    if (endDate < startDate) throw new BookingError("Дата повернення раніше дати отримання");
    const days = daysInclusive(startDate, endDate);
    if (days > MAX_DAYS) throw new BookingError(`Максимальний термін оренди — ${MAX_DAYS} днів`);

    const created = await prisma.$transaction(async (tx) => {
      // Блокуємо рядок товару, щоб два бронювання не зайняли ті самі дати одночасно
      await tx.$queryRaw`SELECT id FROM Product WHERE id = ${productId} FOR UPDATE`;
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || product.status === "HIDDEN") throw new BookingError("Товар недоступний", 404);
      const owner = await tx.user.findUnique({ where: { id: product.ownerId }, select: { blockedAt: true } });
      if (owner?.blockedAt) throw new BookingError("Товар недоступний", 404);
      if (user.blockedAt) throw new BookingError("Ваш акаунт заблоковано. Зверніться в підтримку.", 403);
      if (product.ownerId === user.id) throw new BookingError("Не можна орендувати власну річ");

      // Поки річ в орендаря (або чекає підтвердження повернення) — нові бронювання закриті
      const activeRental = await tx.booking.findFirst({
        where: { productId, status: { in: [...ACTIVE_RENTAL_STATUSES] } },
        orderBy: { endDate: "desc" },
      });
      if (activeRental) {
        throw new BookingError(
          activeRental.status === "RETURNED"
            ? "Річ щойно повернули — бронювання відкриється, щойно власник підтвердить її стан."
            : `Річ зараз в оренді до ${formatDay(toISODate(activeRental.endDate))}. Бронювання відкриється після повернення.`,
          409
        );
      }
      if (days < product.minRentDays) {
        throw new BookingError(`Мінімальний термін оренди цієї речі — ${product.minRentDays} дн.`);
      }

      const conflict = await tx.booking.findFirst({
        where: {
          productId,
          status: { in: BLOCKING_STATUSES },
          startDate: { lte: parseISODate(endDate) },
          endDate: { gte: parseISODate(startDate) },
        },
      });
      if (conflict) throw new BookingError("Ці дати вже зайняті. Оберіть інші.", 409);

      const q = quote(
        {
          pricePerDay: product.rentalPricePerDay,
          price3Days: product.price3Days,
          priceWeek: product.priceWeek,
        },
        days,
        deliveryMethod,
        isPlusActive(user.plusUntil)
      );

      // Бонуси реферальної програми: зменшують суму для орендаря, власник отримує свою частку повністю
      let bonusUsed = 0;
      if (body.useBonus === true) {
        await tx.$queryRaw`SELECT id FROM User WHERE id = ${user.id} FOR UPDATE`;
        const balance = await bonusBalance(user.id, tx);
        bonusUsed = Math.max(0, Math.min(balance, q.rentAmount + q.serviceFee));
      }

      const created = await tx.booking.create({
        data: {
          bonusUsed,
          code: makeBookingCode(),
          productId,
          renterId: user.id,
          ownerId: product.ownerId,
          startDate: parseISODate(startDate),
          endDate: parseISODate(endDate),
          days,
          deliveryMethod,
          deliveryAddress: deliveryMethod === "COURIER" ? deliveryAddress : product.location,
          // Розподіл грошей за фінансовою моделлю: орендар +5%, власник −15%
          rentAmount: q.rentAmount,
          serviceFee: q.serviceFee,
          ownerCommission: q.ownerCommission,
          ownerPayout: q.ownerPayout,
          deliveryCost: q.deliveryCost,
          protection: true, // захист включено в кожну оренду (страховий фонд з комісії платформи)
          protectionCost: 0,
          totalAmount: q.totalAmount - bonusUsed,
          depositAmount: product.depositAmount,
        },
        include: bookingInclude,
      });
      if (bonusUsed > 0) {
        await tx.bonusTransaction.create({
          data: { userId: user.id, amount: -bonusUsed, reason: "BOOKING", bookingId: created.id, uniqueKey: `use:${created.id}` },
        });
      }
      return created;
    });

    await notify(created.ownerId, {
      type: "NEW_BOOKING",
      title: "Нове бронювання",
      body: `${user.name} орендує «${created.product.name}» на ${formatRange(startDate, endDate)}. Ви отримаєте ${created.ownerPayout} ₴.`,
      link: "/profile/listings",
    });

    return NextResponse.json(toApiBooking(created, user.id), { status: 201 });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Помилка бронювання:", error);
    return NextResponse.json({ error: "Не вдалося оформити бронювання" }, { status: 500 });
  }
}
