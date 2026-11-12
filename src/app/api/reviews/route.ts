import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { recomputeRating, reviewInclude, toApiReview } from "../../../lib/reviews";

class ReviewError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// POST /api/reviews { bookingId, rating 1–5, text? }
// Орендар оцінює власника, власник — орендаря. Лише після завершеної оренди, один раз.
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ReviewError("Потрібно увійти в акаунт", 401);

    const body = await request.json().catch(() => ({}));
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ReviewError("Оцінка — від 1 до 5 зірок");
    }
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : "";

    const review = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: String(body.bookingId ?? "") } });
      if (!booking || (booking.renterId !== user.id && booking.ownerId !== user.id)) {
        throw new ReviewError("Оренду не знайдено", 404);
      }
      if (booking.status !== "COMPLETED") {
        throw new ReviewError("Відгук можна залишити лише після завершення оренди");
      }
      const isRenter = booking.renterId === user.id;
      const created = await tx.review.create({
        data: {
          bookingId: booking.id,
          authorId: user.id,
          targetId: isRenter ? booking.ownerId : booking.renterId,
          targetRole: isRenter ? "OWNER" : "RENTER",
          rating,
          text: text || null,
        },
        include: reviewInclude,
      });
      await recomputeRating(tx, created.targetId);
      return created;
    });

    return NextResponse.json(toApiReview(review), { status: 201 });
  } catch (error) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ви вже залишили відгук про цю оренду" }, { status: 409 });
    }
    console.error("Помилка створення відгуку:", error);
    return NextResponse.json({ error: "Не вдалося зберегти відгук" }, { status: 500 });
  }
}
