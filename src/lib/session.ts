import crypto from "crypto";
import { cookies, headers } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "./prisma";
import { SESSION_COOKIE_NAME } from "./auth";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 днів

export type PublicUser = Omit<User, "password">;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
}

// Створює сесію в БД і ставить cookie з випадковим токеном.
// У базі зберігається лише sha256 від токена, тож витік таблиці Session не дає доступу.
export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 255) ?? null;

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, userAgent, expiresAt },
  });

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Повертає поточну сесію разом з користувачем або null.
export async function getCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  // Заблокований користувач — закриваємо всі його сесії
  if (session.user.blockedAt) {
    await prisma.session.deleteMany({ where: { userId: session.userId } }).catch(() => {});
    return null;
  }
  return session;
}

// Повертає поточного користувача за cookie або null.
export async function getCurrentUser(): Promise<User | null> {
  return (await getCurrentSession())?.user ?? null;
}

// Видаляє сесію з БД і стирає cookie.
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
