import React from "react";
import type { BookingStatus } from "../types/booking";

const STATUS_META: Record<BookingStatus, { label: string; cls: string }> = {
  PAID: { label: "Оплачено", cls: "paid" },
  PICKED_UP: { label: "В оренді", cls: "picked" },
  RETURNED: { label: "Повернено, на перевірці", cls: "returned" },
  DISPUTED: { label: "Суперечка щодо стану", cls: "cancelled" },
  COMPLETED: { label: "Завершено", cls: "completed" },
  CANCELLED: { label: "Скасовано", cls: "cancelled" },
};

export const BookingStatusPill = ({ status }: { status: BookingStatus }) => (
  <span className={`dbju-status-pill ${STATUS_META[status].cls}`}>{STATUS_META[status].label}</span>
);

export const DELIVERY_LABEL = {
  PICKUP: "Самовивіз",
  COURIER: "Кур'єр",
} as const;
