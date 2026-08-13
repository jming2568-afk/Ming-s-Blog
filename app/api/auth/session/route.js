import { NextResponse } from "next/server";
import db, { ensureTables } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

ensureTables();

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ isLoggedIn: false });
    }
    const user = db
      .prepare("SELECT id, username FROM users WHERE id = ?")
      .get(session.userId);
    if (!user) {
      return NextResponse.json({ isLoggedIn: false });
    }
    return NextResponse.json({ isLoggedIn: true, user });
  } catch (err) {
    console.error("[auth/session] error:", err);
    return NextResponse.json({ isLoggedIn: false });
  }
}
