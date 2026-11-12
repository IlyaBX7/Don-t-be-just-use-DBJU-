import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "../../../../lib/session";
import { REGIONS, isInUkraine } from "../../../../lib/ukraine";

// GET /api/geo/reverse?lat=..&lng=.. — адреса за точкою на карті (OpenStreetMap Nominatim).
// Правила Nominatim: не частіше 1 запиту/с, зрозумілий User-Agent, кешування результатів.
// https://operations.osmfoundation.org/policies/nominatim/

interface GeoResult {
  city: string | null;
  region: string | null;
  street: string | null;
}

const g = globalThis as unknown as { dbjuGeoCache?: Map<string, GeoResult>; dbjuGeoLast?: number };
const cache = (g.dbjuGeoCache ??= new Map());

async function throttle() {
  const wait = (g.dbjuGeoLast ?? 0) + 1100 - Date.now();
  g.dbjuGeoLast = Date.now() + Math.max(wait, 0);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });

  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInUkraine(lat, lng)) {
    return NextResponse.json({ error: "Оберіть точку в межах України" }, { status: 400 });
  }

  // ~11 м точності достатньо, щоб сусідні кліки брали результат з кешу
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const hit = cache.get(key);
  if (hit) return NextResponse.json(hit);

  try {
    await throttle();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "DBJU-rental-marketplace/1.0", "Accept-Language": "uk" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data.address ?? {};

    const city = a.city || a.town || a.village || a.hamlet || a.municipality || null;
    const state = a.state || (city === "Київ" ? "Київ" : null);
    const region = state && (REGIONS as readonly string[]).includes(state) ? state : null;
    const road = a.road || a.pedestrian || a.square || null;
    const street = road ? [road, a.house_number].filter(Boolean).join(", ") : a.suburb || a.neighbourhood || null;

    const result: GeoResult = { city, region, street };
    if (cache.size > 2000) cache.clear();
    cache.set(key, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Помилка зворотного геокодування:", error);
    return NextResponse.json({ error: "Не вдалося визначити адресу. Введіть її вручну." }, { status: 502 });
  }
}
