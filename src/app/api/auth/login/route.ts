import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword } from "../../../../lib/auth";
import { createSession, toPublicUser } from "../../../../lib/session";
import { clientIp, countHits, hit, resetHits } from "../../../../lib/rateLimit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_ACCOUNT = 5;
const MAX_TRIES_PER_IP = 30;
const TOO_MANY = "Забагато спроб входу. Спробуйте через 15 хвилин.";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Будь ласка, вкажіть email та пароль" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase().slice(0, 191);
    const emailKey = `login-fail:${normalizedEmail}`;

    // Захист від підбору пароля: ліміт на адресу (IP) і на невдалі спроби для акаунта
    if (!(await hit(`login-ip:${clientIp(request.headers)}`, MAX_TRIES_PER_IP, WINDOW_MS))) {
      return NextResponse.json({ error: TOO_MANY }, { status: 429 });
    }
    if ((await countHits(emailKey, WINDOW_MS)) >= MAX_FAILS_PER_ACCOUNT) {
      return NextResponse.json({ error: TOO_MANY }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Однакова відповідь для «немає користувача» і «невірний пароль»,
    // щоб не можна було перевіряти, які email зареєстровані.
    if (!user || !verifyPassword(String(password), user.password)) {
      await hit(emailKey, Number.MAX_SAFE_INTEGER, WINDOW_MS);
      return NextResponse.json(
        { error: "Невірний email або пароль" },
        { status: 401 }
      );
    }
    if (user.blockedAt) {
      return NextResponse.json(
        { error: "Акаунт заблоковано адміністратором. Зверніться в підтримку: support@dbju.ua" },
        { status: 403 }
      );
    }
    await resetHits(emailKey);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await createSession(user.id);

    return NextResponse.json({ success: true, user: toPublicUser(updated) });
  } catch (error) {
    console.error("Помилка входу:", error);
    return NextResponse.json(
      { error: "Помилка сервера при вході" },
      { status: 500 }
    );
  }
}
