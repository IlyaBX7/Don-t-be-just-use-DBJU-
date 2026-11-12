import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser, toPublicUser } from "../../../../lib/session";

// Верифікація через Дію — ДЕМО-РЕЖИМ.
// Справжня інтеграція (Дія.Підпис / «Дія.Шеринг») потребує договору з Мінцифри та
// серверного обміну з їхнім API. Тут імітуємо потік: видаємо одноразовий код запиту,
// а підтвердження приймаємо з цим кодом. Пізніше POST замінюється на вебхук від Дії.

const TTL_MS = 10 * 60 * 1000;
// Зберігаємо в globalThis, щоб запити не губилися при гарячому перезавантаженні в dev
const g = globalThis as unknown as { dbjuDiiaPending?: Map<string, { code: string; expires: number }> };
const pending = (g.dbjuDiiaPending ??= new Map());

// GET /api/user/verify — створити запит на верифікацію (код для QR / deeplink)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  if (user.isVerified) return NextResponse.json({ verified: true });

  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  pending.set(user.id, { code, expires: Date.now() + TTL_MS });
  return NextResponse.json({ verified: false, requestCode: code, expiresInSec: TTL_MS / 1000 });
}

// POST /api/user/verify { requestCode } — підтвердження (у демо — натисканням кнопки)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  if (user.isVerified) return NextResponse.json(toPublicUser(user));

  const { requestCode } = await request.json().catch(() => ({}));
  const req = pending.get(user.id);
  if (!req || req.expires < Date.now() || req.code !== requestCode) {
    return NextResponse.json({ error: "Запит на верифікацію застарів. Почніть заново." }, { status: 400 });
  }
  pending.delete(user.id);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifiedAt: new Date() },
  });
  return NextResponse.json(toPublicUser(updated));
}
