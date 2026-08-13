import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db, { ensureTables } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

ensureTables();

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const { cookieOptions } = await createSession(user.id);
    const cookieStore = cookies();
    cookieStore.set(cookieOptions);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("[auth/login] error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
