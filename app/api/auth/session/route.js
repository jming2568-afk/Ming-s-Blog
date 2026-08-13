import { NextResponse } from "next/server";
import getDb, { ensureDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const IS_DEV = process.env.NODE_ENV !== "production";

export async function GET() {
  try {
    try {
      ensureDb();
    } catch (dbErr) {
      console.error("[auth/session] db init error:", dbErr);
      // 为了避免前端 safeJson 再次触发解析错误，这里必须保持 JSON 响应
      return NextResponse.json(
        {
          isLoggedIn: false,
          error: "数据库初始化失败",
          debug: IS_DEV ? (dbErr?.message || String(dbErr)) : undefined,
        },
        { status: 500 }
      );
    }
    const db = getDb();

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
    return NextResponse.json(
      {
        isLoggedIn: false,
        debug: IS_DEV ? (err?.message || String(err)) : undefined,
      },
      { status: 500 }
    );
  }
}
