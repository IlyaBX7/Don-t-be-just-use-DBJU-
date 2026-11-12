import { NextResponse } from "next/server";
import { getCurrentUser } from "./session";

// Перевірка доступу адміністратора для маршрутів /api/admin/*
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 }) } as const;
  if (user.role !== "ADMIN") return { error: NextResponse.json({ error: "Доступ лише для адміністратора" }, { status: 403 }) } as const;
  return { admin: user } as const;
}
