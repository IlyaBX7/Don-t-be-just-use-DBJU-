// Переносить фото з локальної папки uploads/ у S3-сховище.
// Запуск (після заповнення S3_* у .env):  npm run storage:migrate
// Посилання в БД не змінюються, тому після переносу просто перезапустіть сайт.
import { readdir, readFile } from "fs/promises";
import path from "path";
import { MIME_BY_EXT, UPLOAD_DIR, UPLOAD_NAME_RE } from "../src/lib/uploads";
import { getStorage } from "../src/lib/storage";

async function main() {
  const storage = getStorage();
  if (storage.name !== "s3") {
    throw new Error("Встановіть STORAGE_DRIVER=s3 та ключі S3_* у .env");
  }

  let files: string[] = [];
  try {
    files = (await readdir(UPLOAD_DIR)).filter((f) => UPLOAD_NAME_RE.test(f));
  } catch {
    console.log("Папки uploads/ немає — переносити нічого.");
    return;
  }

  let copied = 0;
  let skipped = 0;
  for (const name of files) {
    if (await storage.get(name)) {
      skipped++;
      continue;
    }
    const data = await readFile(path.join(UPLOAD_DIR, name));
    await storage.put(name, data, MIME_BY_EXT[name.split(".").pop()!]);
    copied++;
    console.log("✓", name);
  }
  console.log(`Готово: перенесено ${copied}, вже були в сховищі ${skipped}, всього ${files.length}.`);
  console.log("Локальну папку uploads/ можна видалити після перевірки сайту.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
