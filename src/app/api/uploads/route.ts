import crypto from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/session";
import { MAX_UPLOAD_BYTES, MIME_BY_EXT, detectImageExt } from "../../../lib/uploads";
import { getStorage } from "../../../lib/storage";
import { processImage, type ImageKind } from "../../../lib/images";
import { hit } from "../../../lib/rateLimit";

// POST /api/uploads?kind=product|avatar|report (multipart/form-data, поле "file") → { url }
// Фото стискається у WebP, зменшується і очищується від метаданих (EXIF/GPS).
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  if (!(await hit(`upload:${user.id}`, 60, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Забагато завантажень. Спробуйте пізніше." }, { status: 429 });
  }
  const kindParam = new URL(request.url).searchParams.get("kind");
  const kind: ImageKind = kindParam === "avatar" || kindParam === "report" ? kindParam : "product";

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Некоректний запит" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передано" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Фото завелике (максимум 5 МБ)" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExt(buf);
  if (!ext) {
    return NextResponse.json({ error: "Підтримуються лише JPG, PNG, WEBP або GIF" }, { status: 415 });
  }

  let processed: Buffer;
  try {
    processed = await processImage(buf, kind);
  } catch {
    return NextResponse.json({ error: "Не вдалося обробити фото. Спробуйте інший файл." }, { status: 415 });
  }

  const name = `${crypto.randomBytes(16).toString("hex")}.webp`;
  try {
    await getStorage().put(name, processed, MIME_BY_EXT.webp);
  } catch (error) {
    console.error("Помилка збереження фото:", error);
    return NextResponse.json({ error: "Не вдалося зберегти фото. Спробуйте ще раз." }, { status: 502 });
  }

  return NextResponse.json({ url: `/api/uploads/${name}` }, { status: 201 });
}
