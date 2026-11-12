import type { Prisma } from "@prisma/client";

export type ReviewRole = "OWNER" | "RENTER";

// Відгук у форматі API
export interface ApiReview {
  id: string;
  rating: number;
  text: string | null;
  targetRole: ReviewRole;
  createdAt: string;
  author: { id: string; name: string; avatar: string; avatarUrl: string | null };
  product: { id: string; name: string } | null;
}

export const reviewInclude = {
  author: { select: { id: true, name: true, avatar: true, avatarUrl: true } },
  booking: { select: { product: { select: { id: true, name: true } } } },
} satisfies Prisma.ReviewInclude;

type ReviewRow = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

export function toApiReview(r: ReviewRow): ApiReview {
  return {
    id: r.id,
    rating: r.rating,
    text: r.text,
    targetRole: r.targetRole,
    createdAt: r.createdAt.toISOString(),
    author: {
      id: r.author.id,
      name: r.author.name,
      avatar: r.author.avatar || r.author.name.slice(0, 2).toUpperCase(),
      avatarUrl: r.author.avatarUrl,
    },
    product: r.booking.product,
  };
}

// Перераховує середню оцінку та кількість відгуків користувача
export async function recomputeRating(tx: Prisma.TransactionClient, userId: string) {
  const agg = await tx.review.aggregate({
    where: { targetId: userId },
    _avg: { rating: true },
    _count: true,
  });
  await tx.user.update({
    where: { id: userId },
    data: {
      rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      reviewsCount: agg._count,
    },
  });
}
