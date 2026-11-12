import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword } from "../../../../lib/auth";
import { createSession, toPublicUser } from "../../../../lib/session";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Будь ласка, вкажіть email та пароль" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Однакова відповідь для «немає користувача» і «невірний пароль»,
    // щоб не можна було перевіряти, які email зареєстровані.
    if (!user || !verifyPassword(String(password), user.password)) {
      return NextResponse.json(
        { error: "Невірний email або пароль" },
        { status: 401 }
      );
    }

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
