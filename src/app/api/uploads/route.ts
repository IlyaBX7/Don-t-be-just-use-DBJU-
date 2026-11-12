import crypto from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/session";
import { MAX_UPLOAD_BYTES, MIME_BY_EXT, detectImageExt } from "../../../lib/uploads";
import { getStorage } from "../../../lib/storage";

// POST /api/uploads (multipart/form-data, поле "file") → { url }
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

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

  const name = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  try {
    await getStorage().put(name, buf, MIME_BY_EXT[ext]);
  } catch (error) {
    console.error("Помилка збереження фото:", error);
    return NextResponse.json({ error: "Не вдалося зберегти фото. Спробуйте ще раз." }, { status: 502 });
  }

  return NextResponse.json({ url: `/api/uploads/${name}` }, { status: 201 });
}
