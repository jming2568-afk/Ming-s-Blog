import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/logout] error:", err);
    // 尽量 JSON 兜底，避免前端 safeJson 再次报错
    return NextResponse.json(
      {
        ok: true,
        warning: "清除 Cookie 过程中发生异常，但本地登录状态会被刷新",
      },
      { status: 200 }
    );
  }
}
