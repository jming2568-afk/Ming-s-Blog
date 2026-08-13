import { NextResponse } from "next/server";
import getDb, { ensureDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizeError, json500 } from "@/lib/routeHelpers";

const IS_DEV = process.env.NODE_ENV !== "production";

export async function GET() {
  try {
    try {
      ensureDb();
    } catch (dbErr) {
      const { message } = normalizeError(dbErr);
      console.error("[auth/session] db init error:", message, dbErr);
      return NextResponse.json(
        {
          isLoggedIn: false,
          error: "数据库初始化失败：" + message,
          debug: IS_DEV ? message : undefined,
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
    // 会话 API 的 500 返回 isLoggedIn=false + 调试信息（与其它 500 格式不同，前端专门处理）
    const { message, stack } = normalizeError(err);
    console.error("[auth/session] error:", err);
    return NextResponse.json(
      {
        isLoggedIn: false,
        error: message,
        debug: IS_DEV ? message : undefined,
        stack: IS_DEV && stack ? stack.split("\n").slice(0, 8).join("\n") : undefined,
      },
      { status: 500 }
    );
  }
}
