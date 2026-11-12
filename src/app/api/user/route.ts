import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { destroySession, getCurrentUser, toPublicUser } from "../../../lib/session";
import { verifyPassword } from "../../../lib/auth";
import { isUploadUrl } from "../../../lib/uploads";
import { removeUnusedImages } from "../../../lib/imageCleanup";
import { BLOCKING_STATUSES } from "../../../lib/bookings";
import { EMAIL_RE, cleanName, fullName, isValidName, makeInitials, normalizePhone } from "../../../lib/users";

// GET /api/user — авторизований користувач з його товарами (або null)
export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current) return NextResponse.json(null);

    const user = await prisma.user.findUnique({
      where: { id: current.id },
      include: { products: true },
    });
    if (!user) return NextResponse.json(null);

    const { products, ...rest } = user;
    return NextResponse.json({ ...toPublicUser(rest), products });
  } catch (error) {
    console.error("Помилка отримання користувача:", error);
    return NextResponse.json(null);
  }
}

// PUT /api/user — оновлення профілю ПОТОЧНОГО користувача (id береться з сесії)
// Поля (усі необов'язкові): firstName, lastName, email, phone, bio, avatarUrl (null — прибрати фото)
export async function PUT(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
    }

    const body = await request.json();
    const data: Prisma.UserUpdateInput = {};
    const errors: string[] = [];

    let firstName = current.firstName;
    let lastName = current.lastName;
    if (body.firstName !== undefined) {
      firstName = cleanName(body.firstName);
      if (!isValidName(firstName)) errors.push("ім'я (лише літери, до 50 символів)");
    }
    if (body.lastName !== undefined) {
      lastName = cleanName(body.lastName);
      if (!isValidName(lastName)) errors.push("прізвище (лише літери, до 50 символів)");
    }
    if (body.firstName !== undefined || body.lastName !== undefined) {
      data.firstName = firstName;
      data.lastName = lastName;
      data.name = fullName(firstName, lastName);
      data.avatar = makeInitials(firstName, lastName);
    }

    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!EMAIL_RE.test(email) || email.length > 191) errors.push("email");
      else data.email = email;
    }

    if (body.phone !== undefined) {
      const p = normalizePhone(body.phone);
      if (!p.ok) errors.push("телефон (10–15 цифр, напр. +380 50 123 45 67)");
      else data.phone = p.phone;
    }

    if (body.bio !== undefined) {
      const bio = String(body.bio ?? "").trim();
      if (bio.length > 500) errors.push("«Про себе» (до 500 символів)");
      else data.bio = bio || null;
    }

    if (body.avatarUrl !== undefined) {
      if (body.avatarUrl === null || body.avatarUrl === "") data.avatarUrl = null;
      else if (!isUploadUrl(body.avatarUrl)) errors.push("фото профілю");
      else data.avatarUrl = body.avatarUrl;
    }

    if (errors.length) {
      return NextResponse.json({ error: `Перевірте поля: ${errors.join(", ")}` }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({ where: { id: current.id }, data });

    // Старе фото профілю видаляємо зі сховища
    if (current.avatarUrl && current.avatarUrl !== updatedUser.avatarUrl) {
      await removeUnusedImages([current.avatarUrl]);
    }

    return NextResponse.json(toPublicUser(updatedUser));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Цей email вже зайнятий іншим акаунтом" }, { status: 409 });
    }
    console.error("Помилка оновлення користувача:", error);
    return NextResponse.json({ error: "Не вдалося оновити дані користувача" }, { status: 500 });
  }
}

// DELETE /api/user { password } — видалення акаунта (якщо немає активних оренд)
export async function DELETE(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
    }
    const { password } = await request.json().catch(() => ({}));
    if (!password || !verifyPassword(String(password), current.password)) {
      return NextResponse.json({ error: "Невірний пароль" }, { status: 403 });
    }

    const active = await prisma.booking.count({
      where: {
        status: { in: BLOCKING_STATUSES },
        OR: [{ renterId: current.id }, { ownerId: current.id }],
      },
    });
    if (active > 0) {
      return NextResponse.json(
        { error: "Є активні оренди (ваші або ваших речей). Завершіть або скасуйте їх перед видаленням акаунта." },
        { status: 409 }
      );
    }

    // Збираємо фото, щоб прибрати їх зі сховища після видалення
    const [products, reports] = await Promise.all([
      prisma.product.findMany({ where: { ownerId: current.id }, select: { images: true } }),
      prisma.booking.findMany({
        where: { OR: [{ renterId: current.id }, { ownerId: current.id }], returnPhoto: { not: null } },
        select: { returnPhoto: true },
      }),
    ]);

    await destroySession();
    await prisma.user.delete({ where: { id: current.id } }); // каскадно: сесії, товари, бронювання, картки…

    await removeUnusedImages([
      current.avatarUrl,
      ...products.flatMap((p) => (Array.isArray(p.images) ? p.images : [])),
      ...reports.map((r) => r.returnPhoto),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Помилка видалення акаунта:", error);
    return NextResponse.json({ error: "Не вдалося видалити акаунт" }, { status: 500 });
  }
}
