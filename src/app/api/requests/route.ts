import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { isCategoryKey } from "../../../lib/categories";
import { requestInclude, toApiRequest } from "../../../lib/itemRequests";
import { isISODate, parseISODate, todayISO } from "../../../lib/dates";
import { hit } from "../../../lib/rateLimit";

// «Запити на речі»: що шукають люди. Власники бачать попит і пропонують свої оголошення.

// GET /api/requests?cat=&city=&mine=1 — відкриті запити (mine=1 — мої, включно із закритими)
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const where: Prisma.ItemRequestWhereInput = { author: { blockedAt: null } };
  if (p.get("mine") === "1") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
    where.authorId = user.id;
  } else {
    where.status = "OPEN";
    // Запити з датою, що вже минула, не показуємо
    where.OR = [{ neededTo: null }, { neededTo: { gte: parseISODate(todayISO()) } }];
  }
  const cat = p.get("cat");
  if (isCategoryKey(cat)) where.category = cat;
  const city = p.get("city")?.trim();
  if (city) where.city = city.slice(0, 80);

  const rows = await prisma.itemRequest.findMany({ where, include: requestInclude, orderBy: { createdAt: "desc" }, take: 60 });
  return NextResponse.json(rows.map(toApiRequest));
}

// POST /api/requests — створити запит
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  if (!(await hit(`request:${user.id}`, 10, 24 * 3600 * 1000))) {
    return NextResponse.json({ error: "Можна створити до 10 запитів на добу" }, { status: 429 });
  }
  const b = await request.json().catch(() => ({}));
  const title = String(b.title ?? "").trim();
  const description = String(b.description ?? "").trim();
  const errors: string[] = [];
  if (title.length < 3 || title.length > 150) errors.push("що шукаєте (3–150 символів)");
  if (description.length > 1000) errors.push("опис (до 1000 символів)");
  if (b.category && !isCategoryKey(b.category)) errors.push("категорія");
  const maxPrice = b.maxPricePerDay === "" || b.maxPricePerDay == null ? null : Number(b.maxPricePerDay);
  if (maxPrice !== null && (!Number.isInteger(maxPrice) || maxPrice < 1 || maxPrice > 100000)) errors.push("бюджет");
  const from = isISODate(b.neededFrom) ? b.neededFrom : null;
  const to = isISODate(b.neededTo) ? b.neededTo : from;
  if (from && from < todayISO()) errors.push("дата вже минула");
  if (from && to && to < from) errors.push("дати");
  if (errors.length) return NextResponse.json({ error: `Перевірте: ${errors.join(", ")}` }, { status: 400 });

  const created = await prisma.itemRequest.create({
    data: {
      authorId: user.id,
      title,
      description: description || null,
      category: isCategoryKey(b.category) ? b.category : null,
      city: typeof b.city === "string" && b.city.trim() ? b.city.trim().slice(0, 80) : null,
      maxPricePerDay: maxPrice,
      neededFrom: from ? parseISODate(from) : null,
      neededTo: to ? parseISODate(to) : null,
    },
    include: requestInclude,
  });
  return NextResponse.json(toApiRequest(created), { status: 201 });
}
