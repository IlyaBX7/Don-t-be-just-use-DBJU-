import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { isCategoryKey, productInclude, toApiProduct } from "../../../../lib/products";
import { ORDER, SORTS, buildCatalogWhere, type Sort } from "../../../../lib/catalogSearch";

const intParam = (v: string | null) => {
  const n = Number(v);
  return v !== null && v !== "" && Number.isInteger(n) && n >= 0 ? n : null;
};

// GET /api/products/search — каталог з фільтрами, сортуванням і сторінками
//   cat, q, minPrice, maxPrice, from, to (вільні дати), available=1, verified=1,
//   minRating=1..5, city, sort=new|cheap|expensive|popular|rating, page=1.., limit<=48
export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const cat = p.get("cat");
    const q = p.get("q")?.trim().slice(0, 100);
    const minPrice = intParam(p.get("minPrice"));
    const maxPrice = intParam(p.get("maxPrice"));
    const from = p.get("from");
    const to = p.get("to");
    const minRating = intParam(p.get("minRating"));
    const city = p.get("city")?.trim().slice(0, 80) || null;
    const sort: Sort = (SORTS as readonly string[]).includes(p.get("sort") ?? "") ? (p.get("sort") as Sort) : "new";
    const limit = Math.min(Math.max(intParam(p.get("limit")) ?? 24, 1), 48);
    const page = Math.max(intParam(p.get("page")) ?? 1, 1);

    const { base, where } = buildCatalogWhere({
      cat,
      q,
      minPrice,
      maxPrice,
      from,
      to,
      available: p.get("available") === "1",
      verified: p.get("verified") === "1",
      minRating,
      city,
    });

    const [total, items, byCategory, priceRange, byCity] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: ORDER[sort],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.groupBy({ by: ["category"], where: { AND: base }, _count: true }),
      prisma.product.aggregate({
        where: { status: { not: "HIDDEN" } },
        _min: { rentalPricePerDay: true },
        _max: { rentalPricePerDay: true },
      }),
      // Міста, де є речі (з урахуванням категорії, але без фільтра міста)
      prisma.product.groupBy({
        by: ["city"],
        where: {
          AND: [
            { status: { not: "HIDDEN" }, city: { not: null } },
            ...(isCategoryKey(cat) ? [{ category: cat }] : []),
          ],
        },
        _count: true,
        orderBy: { _count: { city: "desc" } },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      items: items.map(toApiProduct),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      categoryCounts: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
      allCount: byCategory.reduce((s, c) => s + c._count, 0),
      priceMin: priceRange._min.rentalPricePerDay ?? 0,
      priceMax: priceRange._max.rentalPricePerDay ?? 0,
      cities: byCity.filter((c) => c.city).map((c) => ({ city: c.city as string, count: c._count })),
    });
  } catch (error) {
    console.error("Помилка пошуку товарів:", error);
    return NextResponse.json({ error: "Не вдалося завантажити товари" }, { status: 500 });
  }
}
