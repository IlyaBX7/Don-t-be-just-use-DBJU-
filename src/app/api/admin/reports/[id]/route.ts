import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/adminGuard";

// PATCH /api/admin/reports/:id { status: "RESOLVED" | "DISMISSED", note? }
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/reports/[id]">) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const { status, note } = await request.json().catch(() => ({}));
  if (status !== "RESOLVED" && status !== "DISMISSED") return NextResponse.json({ error: "Невідомий статус" }, { status: 400 });
  const updated = await prisma.report
    .update({ where: { id }, data: { status, adminNote: typeof note === "string" ? note.trim().slice(0, 500) || null : null, resolvedAt: new Date() } })
    .catch(() => null);
  if (!updated) return NextResponse.json({ error: "Скаргу не знайдено" }, { status: 404 });
  return NextResponse.json({ success: true });
}
