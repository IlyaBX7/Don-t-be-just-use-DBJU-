import type { Prisma } from "@prisma/client";
import { isCategoryKey } from "./products";
import { isUploadUrl } from "./uploads";
import { REGIONS, isInUkraine } from "./ukraine";

const MAX_IMAGES = 4;

function positiveInt(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

type Result =
  | { ok: true; data: Prisma.ProductUncheckedUpdateInput }
  | { ok: false; error: string };

// Перевіряє поля оголошення. partial=true — для редагування (передані лише змінені поля).
export function parseProductInput(body: Record<string, unknown>, partial: boolean): Result {
  const data: Prisma.ProductUncheckedUpdateInput = {};
  const errors: string[] = [];
  const has = (k: string) => body[k] !== undefined;
  const need = (k: string) => !partial || has(k);

  const text = (k: string, max: number, label: string, required = true) => {
    if (!need(k)) return;
    const v = String(body[k] ?? "").trim();
    if ((required && !v) || v.length > max) errors.push(label);
    else return v;
  };

  const name = text("name", 150, "назва (до 150 символів)");
  if (name !== undefined) data.name = name;
  const description = text("description", 5000, "опис");
  if (description !== undefined) data.description = description;
  // Адреса: структуровано (city/region/street/lat/lng) або, для сумісності, одним рядком location
  if (has("city")) {
    const city = String(body.city ?? "").trim().replace(/\s+/g, " ");
    const region = String(body.region ?? "").trim();
    const street = String(body.street ?? "").trim().replace(/\s+/g, " ");
    if (!city || city.length > 80 || !/^[\p{L}][\p{L}\p{M}'’ʼ\-. ]*$/u.test(city)) errors.push("місто");
    if (region && !(REGIONS as readonly string[]).includes(region)) errors.push("область");
    if (street.length > 150) errors.push("вулиця (до 150 символів)");

    let lat: number | null = null;
    let lng: number | null = null;
    if (body.lat !== undefined && body.lat !== null && body.lng !== undefined && body.lng !== null) {
      lat = Number(body.lat);
      lng = Number(body.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInUkraine(lat, lng)) {
        errors.push("точка на карті (має бути в межах України)");
      }
    }

    data.city = city;
    data.region = region || null;
    data.street = street || null;
    data.lat = lat === null ? null : Math.round(lat * 1e6) / 1e6;
    data.lng = lng === null ? null : Math.round(lng * 1e6) / 1e6;
    // Текст для показу: «Київ, вул. Хорива, 5» або «Лішня, Львівська область»
    data.location = (street ? `${city}, ${street}` : region && region !== city ? `${city}, ${region}` : city).slice(0, 150);
  } else {
    const location = text("location", 150, "адреса самовивозу");
    if (location !== undefined) data.location = location;
  }

  if (has("fullTitle")) {
    const v = String(body.fullTitle ?? "").trim();
    data.fullTitle = v ? v.slice(0, 255) : null;
  }

  if (need("category")) {
    if (!isCategoryKey(body.category)) errors.push("категорія");
    else data.category = body.category;
  }

  const requiredInt = (k: "rentalPricePerDay" | "depositAmount", label: string) => {
    if (!need(k)) return;
    const n = positiveInt(body[k]);
    if (!n) errors.push(label);
    else data[k] = n;
  };
  requiredInt("rentalPricePerDay", "ціна за добу");
  requiredInt("depositAmount", "застава");

  if (has("minRentDays")) {
    const n = positiveInt(body.minRentDays);
    if (!n || n > 30) errors.push("мінімальний термін (1–30 днів)");
    else data.minRentDays = n;
  }

  const optionalInt = (k: "price3Days" | "priceWeek" | "marketBuyPrice", label: string) => {
    if (!has(k)) return;
    const v = body[k];
    if (v === null || v === "" || v === 0) {
      data[k] = null;
      return;
    }
    const n = positiveInt(v);
    if (!n) errors.push(label);
    else data[k] = n;
  };
  optionalInt("price3Days", "ціна за 3 доби");
  optionalInt("priceWeek", "ціна за тиждень");
  optionalInt("marketBuyPrice", "ціна нового");

  if (has("images")) {
    const imgs = body.images;
    if (!Array.isArray(imgs) || imgs.length > MAX_IMAGES || !imgs.every(isUploadUrl)) {
      errors.push(`фото (до ${MAX_IMAGES})`);
    } else data.images = imgs;
  } else if (!partial) {
    data.images = [];
  }

  if (has("includedKit")) {
    if (!Array.isArray(body.includedKit)) errors.push("комплектація");
    else {
      data.includedKit = body.includedKit
        .map((x) => String(x).trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, 20);
    }
  } else if (!partial) {
    data.includedKit = [];
  }

  if (has("status")) {
    if (body.status !== "AVAILABLE" && body.status !== "HIDDEN") errors.push("статус");
    else data.status = body.status;
  }

  if (errors.length) return { ok: false, error: `Перевірте поля: ${errors.join(", ")}` };
  return { ok: true, data };
}
