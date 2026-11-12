import { formatDay, todayISO } from "./dates";

interface RentalInfo {
  rentedUntil: string | null;
  rentalPhase: "IN_USE" | "RETURNING" | null;
}

export function isRentedNow(p: RentalInfo): boolean {
  return p.rentedUntil !== null;
}

// Короткий напис для картки: «В оренді до 14 листопада»
export function rentalShortLabel(p: RentalInfo): string | null {
  if (!p.rentedUntil) return null;
  if (p.rentalPhase === "RETURNING") return "Повертається власнику";
  return `В оренді до ${formatDay(p.rentedUntil)}`;
}

// Пояснення для сторінки товару та вікна бронювання
export function rentalLongLabel(p: RentalInfo): string | null {
  if (!p.rentedUntil) return null;
  if (p.rentalPhase === "RETURNING") {
    return "Річ щойно повернули. Бронювання відкриється, щойно власник підтвердить її стан.";
  }
  if (p.rentedUntil < todayISO()) {
    return `Річ ще в оренді: її мали повернути ${formatDay(p.rentedUntil)}. Бронювання відкриється після повернення.`;
  }
  return `Річ зараз в оренді до ${formatDay(p.rentedUntil)} включно. Забронювати її можна буде після повернення власнику.`;
}
