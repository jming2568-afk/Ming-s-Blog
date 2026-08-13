import { NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { findAdminByUserId, updateAdminPassword } from "@/lib/users";
import { json500 } from "@/lib/routeHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 需登录：修改登录密码（校验旧密码）
export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

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

    const admin = await findAdminByUserId(user.userId);
    if (!admin) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    const ok = await verifyPassword(oldPassword, admin.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "原密码错误" }, { status: 400 });
    }

    const hash = await hashPassword(newPassword);
    await updateAdminPassword(user.userId, hash);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return json500(err, { routeName: "api/settings/password PUT" });
  }
}
