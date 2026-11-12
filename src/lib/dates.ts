// Дати оренди зберігаються як календарні дні "YYYY-MM-DD" (у БД — тип DATE, опівночі UTC).

const MONTHS_GEN = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
];
export const MONTHS_NOM = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(v: unknown): v is string {
  return typeof v === "string" && ISO_RE.test(v) && !Number.isNaN(Date.parse(v + "T00:00:00Z"));
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseISODate(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

// Сьогоднішня дата за київським часом
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv" }).format(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISODate(d);
}

// Кількість днів між датами включно
export function daysInclusive(start: string, end: string): number {
  return Math.round((parseISODate(end).getTime() - parseISODate(start).getTime()) / 86400000) + 1;
}

// "14–16 листопада" або "30 листопада – 2 грудня"
export function formatRange(start: string, end: string): string {
  const s = parseISODate(start);
  const e = parseISODate(end);
  const sd = s.getUTCDate();
  const ed = e.getUTCDate();
  if (start === end) return `${sd} ${MONTHS_GEN[s.getUTCMonth()]}`;
  if (s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear()) {
    return `${sd}–${ed} ${MONTHS_GEN[e.getUTCMonth()]}`;
  }
  return `${sd} ${MONTHS_GEN[s.getUTCMonth()]} – ${ed} ${MONTHS_GEN[e.getUTCMonth()]}`;
}

export function formatDay(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}`;
}

export function formatDateTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDateTime));
}
