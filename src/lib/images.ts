import sharp from "sharp";

// Обробка завантажених фото:
//   - поворот за EXIF (фото з телефона не лежатимуть «на боці»);
//   - зменшення до розумного розміру і стиснення у WebP — сторінки вантажаться швидше;
//   - ВИДАЛЕННЯ МЕТАДАНИХ (EXIF, у т.ч. GPS-координат, де зроблено фото) — sharp не копіює їх за замовчуванням.

export type ImageKind = "product" | "avatar" | "report";

const MAX_SIDE: Record<ImageKind, number> = { product: 1600, avatar: 512, report: 1600 };

export async function processImage(input: Buffer, kind: ImageKind): Promise<Buffer> {
  return sharp(input, { failOn: "error", limitInputPixels: 50_000_000 })
    .rotate()
    .resize({ width: MAX_SIDE[kind], height: MAX_SIDE[kind], fit: "inside", withoutEnlargement: true })
    .webp({ quality: kind === "avatar" ? 82 : 80 })
    .toBuffer();
}
