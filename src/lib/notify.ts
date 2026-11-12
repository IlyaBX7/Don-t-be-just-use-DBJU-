import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Сповіщення на сайті. dedupeKey — щоб нагадування («завтра повернення») не створювалися двічі.

export interface NotifyInput {
  type: string;
  title: string;
  body?: string;
  link?: string;
  dedupeKey?: string;
}

export async function notify(userId: string, n: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: n.type.slice(0, 40),
        title: n.title.slice(0, 150),
        body: n.body?.slice(0, 500) ?? null,
        link: n.link?.slice(0, 255) ?? null,
        dedupeKey: n.dedupeKey?.slice(0, 191) ?? null,
      },
    });
  } catch (e) {
    // Повтор з тим самим dedupeKey — нормальна ситуація
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return;
    console.error("Не вдалося створити сповіщення:", e);
  }
}

// Нове повідомлення в чаті: одне непрочитане сповіщення на бронювання, оновлюємо його текст
export async function notifyMessage(userId: string, _bookingId: string, title: string, body: string, link: string) {
  const existing = await prisma.notification.findFirst({
    where: { userId, type: "MESSAGE", readAt: null, link },
  });
  if (existing) {
    await prisma.notification.update({ where: { id: existing.id }, data: { title, body: body.slice(0, 500), createdAt: new Date() } });
  } else {
    await notify(userId, { type: "MESSAGE", title, body, link, dedupeKey: undefined });
  }
}
