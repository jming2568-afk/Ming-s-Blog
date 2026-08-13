import { NextResponse } from "next/server";
import getDb, { ensureDb } from "@/lib/db";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { json500, normalizeError } from "@/lib/routeHelpers";

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
      const { message } = normalizeError(dbErr);
      console.error("[api/settings/password] db init error:", message, dbErr);
      return NextResponse.json(
        {
          error: "数据库初始化失败：" + message,
          debug: IS_DEV ? message : undefined,
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
    return json500(err, { routeName: "api/settings/password PUT" });
  }
}
