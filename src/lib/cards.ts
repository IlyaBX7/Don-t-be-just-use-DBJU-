// Перевірка банківських карток. Повний номер ніколи не зберігається і не логується —
// з нього беремо лише останні 4 цифри та платіжну систему.

export const MAX_CARDS = 5;

export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrand(digits: string): "visa" | "mastercard" | "other" {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "mastercard";
  return "other";
}

export function parseCardNumber(v: unknown): { ok: true; last4: string; brand: string } | { ok: false } {
  const digits = String(v ?? "").replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits) || !luhnValid(digits)) return { ok: false };
  return { ok: true, last4: digits.slice(-4), brand: cardBrand(digits) };
}

export function parseExpiry(month: unknown, year: unknown): { ok: true; expMonth: number; expYear: number } | { ok: false } {
  const m = Number(month);
  let y = Number(year);
  if (y < 100) y += 2000;
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y)) return { ok: false };
  const now = new Date();
  const cy = now.getUTCFullYear();
  const cm = now.getUTCMonth() + 1;
  if (y < cy || (y === cy && m < cm) || y > cy + 20) return { ok: false };
  return { ok: true, expMonth: m, expYear: y };
}

export function cleanHolder(v: unknown): string | null {
  const s = String(v ?? "").trim().replace(/\s+/g, " ").toUpperCase();
  return /^[\p{L} '\-.]{2,100}$/u.test(s) ? s : null;
}

export function cleanLabel(v: unknown): string | null {
  const s = String(v ?? "").trim().slice(0, 50);
  return s || null;
}
