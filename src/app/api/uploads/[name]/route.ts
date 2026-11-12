import { NextResponse, type NextRequest } from "next/server";
import { MIME_BY_EXT, UPLOAD_NAME_RE } from "../../../../lib/uploads";
import { getStorage } from "../../../../lib/storage";

// GET /api/uploads/:name — віддає фото зі сховища (локальна папка або хмара)
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/uploads/[name]">) {
  const { name } = await ctx.params;
  if (!UPLOAD_NAME_RE.test(name)) {
    return NextResponse.json({ error: "Не знайдено" }, { status: 404 });
  }
  try {
    const data = await getStorage().get(name);
    if (!data) return NextResponse.json({ error: "Не знайдено" }, { status: 404 });
    const ext = name.split(".").pop()!;
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Помилка читання фото:", error);
    return NextResponse.json({ error: "Сховище тимчасово недоступне" }, { status: 502 });
  }
}
