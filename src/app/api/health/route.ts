import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET /api/health — перевірка для хостингу: сайт працює і база даних відповідає
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Health check: база даних недоступна", error);
    return NextResponse.json({ ok: false, error: "database" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
