import { NextResponse } from "next/server";
import {
  getAdminPassword,
  isAuthed,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";

// GET  /api/auth        → { ok: 是否已登录 }
// POST /api/auth        → { password } 登录，成功后写入 session cookie
// DELETE /api/auth      → 退出登录

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ ok: await isAuthed() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminPassword = getAdminPassword(); // 生产未配置 ADMIN_PASSWORD 时这里抛错
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
    }
    if (!body?.password || body.password !== adminPassword) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }
    await setSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "登录失败" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
