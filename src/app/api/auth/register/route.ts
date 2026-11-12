import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/auth";
import { createSession, toPublicUser } from "../../../../lib/session";
import {
  EMAIL_RE,
  MAX_PASSWORD,
  MIN_PASSWORD,
  cleanName,
  fullName,
  isValidName,
  makeInitials,
  normalizePhone,
} from "../../../../lib/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Підтримуємо і старий формат { name: "Ім'я Прізвище" }
    const legacy = cleanName(body.name).split(" ");
    const firstName = cleanName(body.firstName ?? legacy[0]);
    const lastName = cleanName(body.lastName ?? legacy.slice(1).join(" "));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const phone = normalizePhone(body.phone);

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Заповніть обов'язкові поля: ім'я, прізвище, email та пароль" },
        { status: 400 }
      );
    }
    if (!isValidName(firstName) || !isValidName(lastName)) {
      return NextResponse.json({ error: "Ім'я та прізвище — лише літери, до 50 символів" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Некоректний email" }, { status: 400 });
    }
    if (!phone.ok) {
      return NextResponse.json({ error: "Некоректний номер телефону" }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
      return NextResponse.json(
        { error: `Пароль повинен містити від ${MIN_PASSWORD} до ${MAX_PASSWORD} символів` },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: fullName(firstName, lastName),
        email,
        password: hashPassword(password),
        phone: phone.phone,
        avatar: makeInitials(firstName, lastName),
        // Верифікація через Дію проходиться окремо в «Редагуванні профілю»
        isVerified: false,
        lastLoginAt: new Date(),
      },
    });

    await createSession(newUser.id);

    return NextResponse.json({ success: true, user: toPublicUser(newUser) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Користувач із цією поштою вже зареєстрований" },
        { status: 409 }
      );
    }
    console.error("Помилка реєстрації:", error);
    return NextResponse.json({ error: "Помилка сервера при реєстрації" }, { status: 500 });
  }
}
