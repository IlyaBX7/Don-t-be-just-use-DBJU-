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
import { clientIp, hit } from "../../../../lib/rateLimit";
import { makeReferralCode, REF_COOKIE } from "../../../../lib/referrals";

export async function POST(request: Request) {
  try {
    if (!(await hit(`register-ip:${clientIp(request.headers)}`, 5, 60 * 60 * 1000))) {
      return NextResponse.json({ error: "Забагато реєстрацій з цієї мережі. Спробуйте пізніше." }, { status: 429 });
    }
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

    // Реферальна програма: код друга з посилання (?ref=…) зберігається в cookie
    const refCode = String(body.ref ?? request.headers.get("cookie")?.match(new RegExp(`${REF_COOKIE}=([A-Z0-9]{4,16})`))?.[1] ?? "")
      .toUpperCase()
      .slice(0, 16);
    const referrer = refCode ? await prisma.user.findUnique({ where: { referralCode: refCode }, select: { id: true } }) : null;

    const newUser = await prisma.user.create({
      data: {
        referralCode: makeReferralCode(),
        referredById: referrer?.id ?? null,
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
