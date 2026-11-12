// Перевірка та нормалізація даних профілю (спільне для реєстрації та редагування)

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[\p{L}][\p{L}\p{M}'’ʼ\- ]*$/u;

export function cleanName(v: unknown): string {
  return String(v ?? "").trim().replace(/\s+/g, " ");
}

export function isValidName(v: string, max = 50): boolean {
  return v.length > 0 && v.length <= max && NAME_RE.test(v);
}

export function fullName(first: string, last: string): string {
  return [first, last].filter(Boolean).join(" ").slice(0, 100);
}

export function makeInitials(first: string, last: string): string {
  const a = first.trim()[0] ?? "";
  const b = last.trim()[0] ?? first.trim()[1] ?? "";
  return (a + b).toUpperCase();
}

// Телефон: дозволяємо +, цифри, пробіли, дужки, дефіси; 10–15 цифр.
// Український номер 0XXXXXXXXX приводимо до +380XXXXXXXXX.
export function normalizePhone(v: unknown): { ok: true; phone: string | null } | { ok: false } {
  const raw = String(v ?? "").trim();
  if (!raw) return { ok: true, phone: null };
  if (!/^[+\d\s()\-]+$/.test(raw)) return { ok: false };
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) digits = "38" + digits;
  if (digits.length < 10 || digits.length > 15) return { ok: false };
  if (digits.length === 12 && digits.startsWith("380")) {
    return { ok: true, phone: `+380 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}` };
  }
  return { ok: true, phone: `+${digits}` };
}

export const MIN_PASSWORD = 6;
export const MAX_PASSWORD = 128;
