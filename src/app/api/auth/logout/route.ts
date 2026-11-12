import { NextResponse } from "next/server";
import { destroySession } from "../../../../lib/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true, message: "Вихід успішний" });
  } catch (error) {
    console.error("Помилка виходу:", error);
    return NextResponse.json({ error: "Помилка сервера при виході" }, { status: 500 });
  }
}
