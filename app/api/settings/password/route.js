import { NextResponse } from "next/server";
import getDb, { ensureDb } from "@/lib/db";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IS_DEV = process.env.NODE_ENV !== "production";

// 需登录：修改登录密码（校验旧密码）
export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    try {
      ensureDb();
    } catch (dbErr) {
      console.error("[api/settings/password] db init error:", dbErr);
      return NextResponse.json(
        {
          error: "数据库初始化失败",
          debug: IS_DEV ? (dbErr?.message || String(dbErr)) : undefined,
        },
        { status: 500 }
      );
    }
    const db = getDb();

    const body = await req.json();
    const { oldPassword, newPassword } = body || {};

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "请输入原密码和新密码" }, { status: 400 });
    }
    if (newPassword.length < 6 || newPassword.length > 72) {
      return NextResponse.json({ error: "新密码长度需在 6-72 位之间" }, { status: 400 });
    }
    if (oldPassword === newPassword) {
      return NextResponse.json({ error: "新密码不能与原密码相同" }, { status: 400 });
    }

    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(user.userId);
    if (!row) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    const ok = await verifyPassword(oldPassword, row.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "原密码错误" }, { status: 400 });
    }

    const hash = await hashPassword(newPassword);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/settings/password PUT] error:", err);
    return NextResponse.json(
      {
        error: "修改失败：" + (err?.message || "服务器错误"),
        debug: IS_DEV ? (err?.message || String(err)) : undefined,
      },
      { status: 500 }
    );
  }
}
