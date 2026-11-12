import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/session";
import { getProfileStats } from "../../../../lib/stats";

// GET /api/profile/stats — цифри для профілю та лічильників у хедері
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  return NextResponse.json(await getProfileStats(user.id));
}
