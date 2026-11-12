import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import { notify } from "../../../../lib/notify";
import { requestInclude, toApiRequest } from "../../../../lib/itemRequests";

// PATCH /api/requests/:id { status: "CLOSED"|"OPEN" } — автор закриває/відкриває запит
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/requests/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  const { id } = await ctx.params;
  const req = await prisma.itemRequest.findUnique({ where: { id } });
  if (!req || (req.authorId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Запит не знайдено" }, { status: 404 });
  }
  const { status } = await request.json().catch(() => ({}));
  if (status !== "OPEN" && status !== "CLOSED") return NextResponse.json({ error: "Невідомий статус" }, { status: 400 });
  const updated = await prisma.itemRequest.update({ where: { id }, data: { status }, include: requestInclude });
  return NextResponse.json(toApiRequest(updated));
}

// POST /api/requests/:id { productId, message? } — власник пропонує своє оголошення
export async function POST(request: NextRequest, ctx: RouteContext<"/api/requests/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  const { id } = await ctx.params;
  const req = await prisma.itemRequest.findUnique({ where: { id } });
  if (!req || req.status !== "OPEN") return NextResponse.json({ error: "Запит закрито або не знайдено" }, { status: 404 });
  if (req.authorId === user.id) return NextResponse.json({ error: "Це ваш власний запит" }, { status: 400 });

  const { productId, message } = await request.json().catch(() => ({}));
  const product = typeof productId === "string" ? await prisma.product.findUnique({ where: { id: productId } }) : null;
  if (!product || product.ownerId !== user.id || product.status === "HIDDEN") {
    return NextResponse.json({ error: "Оберіть одне зі своїх активних оголошень" }, { status: 400 });
  }
  try {
    await prisma.requestOffer.create({
      data: { requestId: id, ownerId: user.id, productId: product.id, message: typeof message === "string" ? message.trim().slice(0, 500) || null : null },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Ви вже запропонували це оголошення" }, { status: 409 });
    }
    throw e;
  }
  await notify(req.authorId, {
    type: "REQUEST_OFFER",
    title: "На ваш запит відповіли",
    body: `${user.firstName || user.name} пропонує «${product.name}» за ${product.rentalPricePerDay} ₴/доба — на ваш запит «${req.title}».`,
    link: `/requests?open=${id}`,
  });
  const updated = await prisma.itemRequest.findUniqueOrThrow({ where: { id }, include: requestInclude });
  return NextResponse.json(toApiRequest(updated), { status: 201 });
}
