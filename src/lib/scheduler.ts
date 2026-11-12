import { prisma } from "./prisma";
import { notify } from "./notify";
import { addDays, formatDay, parseISODate, toISODate, todayISO } from "./dates";

// Нагадування за часом (без окремого планувальника): runSweep() викликається, коли користувачі
// відкривають сповіщення, але не частіше разу на 5 хвилин. Можна також запускати з cron: npm run cron.
// Повтори не створюються завдяки dedupeKey.

const g = globalThis as unknown as { dbjuSweepAt?: number };
const INTERVAL_MS = 5 * 60 * 1000;

export async function maybeRunSweep(): Promise<void> {
  if (Date.now() - (g.dbjuSweepAt ?? 0) < INTERVAL_MS) return;
  g.dbjuSweepAt = Date.now();
  try {
    await runSweep();
  } catch (e) {
    console.error("Помилка нагадувань:", e);
  }
}

export async function runSweep(): Promise<{ created: number }> {
  const today = todayISO();
  const tomorrow = addDays(today, 1);
  let created = 0;
  const send = async (userId: string, n: Parameters<typeof notify>[1]) => {
    await notify(userId, n);
    created++;
  };

  // 1. Сьогодні забирати річ
  const pickups = await prisma.booking.findMany({
    where: { status: "PAID", startDate: parseISODate(today) },
    select: { id: true, renterId: true, ownerId: true, product: { select: { name: true } } },
  });
  for (const b of pickups) {
    await send(b.renterId, { type: "REMINDER", title: "Сьогодні можна забрати річ", body: `«${b.product.name}» — не забудьте сфотографувати стан при отриманні.`, link: "/rentals", dedupeKey: `pickup-today:${b.id}` });
    await send(b.ownerId, { type: "REMINDER", title: "Сьогодні передача речі", body: `«${b.product.name}» — орендар забирає річ сьогодні.`, link: "/profile/listings", dedupeKey: `pickup-today-owner:${b.id}` });
  }

  // 2. Завтра повертати
  const returnsSoon = await prisma.booking.findMany({
    where: { status: "PICKED_UP", endDate: parseISODate(tomorrow) },
    select: { id: true, renterId: true, product: { select: { name: true } } },
  });
  for (const b of returnsSoon) {
    await send(b.renterId, { type: "REMINDER", title: "Завтра повернення речі", body: `«${b.product.name}» — поверніть до ${formatDay(tomorrow)}, 20:00, або продовжте оренду.`, link: "/rentals", dedupeKey: `return-tomorrow:${b.id}` });
  }

  // 3. Прострочене повернення — щодня, поки річ не повернуть
  const overdue = await prisma.booking.findMany({
    where: { status: "PICKED_UP", endDate: { lt: parseISODate(today) } },
    select: { id: true, renterId: true, ownerId: true, endDate: true, product: { select: { name: true } } },
  });
  for (const b of overdue) {
    const end = formatDay(toISODate(b.endDate));
    await send(b.renterId, { type: "OVERDUE", title: "⚠️ Прострочено повернення", body: `«${b.product.name}» мали повернути ${end}. Поверніть річ або продовжте оренду — інакше можливе утримання застави.`, link: "/rentals", dedupeKey: `overdue:${b.id}:${today}` });
    await send(b.ownerId, { type: "OVERDUE", title: "Орендар прострочив повернення", body: `«${b.product.name}» — термін минув ${end}. Напишіть орендарю в чаті бронювання.`, link: "/profile/listings", dedupeKey: `overdue-owner:${b.id}:${today}` });
  }

  // 4. Власник довго не підтверджує повернення (2+ доби)
  const pendingConfirm = await prisma.booking.findMany({
    where: { status: "RETURNED", returnedAt: { lt: new Date(Date.now() - 2 * 86400000) } },
    select: { id: true, ownerId: true, product: { select: { name: true } } },
  });
  for (const b of pendingConfirm) {
    await send(b.ownerId, { type: "REMINDER", title: "Підтвердіть повернення", body: `«${b.product.name}» повернули понад 2 доби тому — орендар чекає на заставу.`, link: "/profile/listings", dedupeKey: `confirm-pending:${b.id}:${today}` });
  }

  return { created };
}
