import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser, toPublicUser } from "../../../../lib/session";
import { hit } from "../../../../lib/rateLimit";

// Верифікація через Дію або BankID — ДЕМО-РЕЖИМ.
// Імітує справжній процес (запит → сканування QR / вхід у банк → згода на передачу даних → готово).
// Справжня інтеграція (Дія.Шеринг / BankID НБУ) потребує договорів і замінить кроки "scan"/"confirm"
// на вебхук від провайдера. Запити зберігаються в БД, тож працюють і на кількох серверах.

const TTL_MS = 10 * 60 * 1000;
import { DEMO_BANKS } from "../../../../lib/verification";

// POST { step: "start", method: "DIIA"|"BANKID", bank? } | { step: "scan"|"confirm", id }
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  if (user.isVerified) return NextResponse.json({ verified: true, user: toPublicUser(user) });

  const b = await request.json().catch(() => ({}));

  if (b.step === "start") {
    if (!(await hit(`verify:${user.id}`, 10, 60 * 60 * 1000))) {
      return NextResponse.json({ error: "Забагато спроб. Спробуйте за годину." }, { status: 429 });
    }
    const method = b.method === "BANKID" ? "BANKID" : "DIIA";
    const bank = method === "BANKID" && DEMO_BANKS.includes(b.bank) ? b.bank : null;
    if (method === "BANKID" && !bank) return NextResponse.json({ error: "Оберіть банк" }, { status: 400 });
    const req = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        method,
        bank,
        code: crypto.randomBytes(3).toString("hex").toUpperCase(),
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });
    return NextResponse.json({ id: req.id, code: req.code, method, bank, expiresInSec: TTL_MS / 1000 });
  }

  const req = typeof b.id === "string" ? await prisma.verificationRequest.findUnique({ where: { id: b.id } }) : null;
  if (!req || req.userId !== user.id || req.expiresAt < new Date()) {
    return NextResponse.json({ error: "Запит застарів. Почніть заново." }, { status: 400 });
  }

  if (b.step === "scan") {
    await prisma.verificationRequest.update({ where: { id: req.id }, data: { status: "SCANNED" } });
    return NextResponse.json({ status: "SCANNED" });
  }

  if (b.step === "confirm") {
    if (req.status !== "SCANNED") return NextResponse.json({ error: "Спочатку відскануйте QR-код / увійдіть у банк" }, { status: 400 });
    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { isVerified: true, verifiedAt: new Date(), verifiedVia: req.method } }),
      prisma.verificationRequest.update({ where: { id: req.id }, data: { status: "CONFIRMED" } }),
    ]);
    return NextResponse.json({ verified: true, user: toPublicUser(updated) });
  }

  return NextResponse.json({ error: "Невідомий крок" }, { status: 400 });
}
