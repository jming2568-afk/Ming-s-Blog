import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getSiteSettings,
  getResumeData,
  updateSiteSettings,
} from "@/lib/settings";
import { ensureDb } from "@/lib/db";
import { json500, normalizeError } from "@/lib/routeHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IS_DEV = process.env.NODE_ENV !== "production";

// 公开读取：站点设置 + 双版本简历
export async function GET() {
  try {
    // getSiteSettings 内部会 ensureDb，这里再加一层确保初始化异常能以 JSON 500 抛出
    try {
      ensureDb();
    } catch (dbErr) {
      const { message } = normalizeError(dbErr);
      console.error("[api/settings GET] db init error:", message, dbErr);
      return NextResponse.json(
        {
          error: "数据库初始化失败：" + message,
          debug: IS_DEV ? message : undefined,
        },
        { status: 500 }
      );
    }
    const settings = getSiteSettings();
    const resume = getResumeData();
    return NextResponse.json({ ok: true, settings, resume });
  } catch (err) {
    return json500(err, { routeName: "api/settings GET" });
  }
}

// 需登录：更新个人资料（白名单字段）
export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const body = await req.json();
    const patch = {};
    const keys = [
      "displayName",
      "avatarUrl",
      "certPhotoUrl",
      "email",
      "github",
      "githubUrl",
      "location",
      "wechatId",
      "wechatQrUrl",
      "bioShort",
      "bioLong",
      "titles",
    ];
    for (const k of keys) {
      if (body[k] !== undefined) patch[k] = body[k];
    }

    const settings = updateSiteSettings(patch);
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    return json500(err, { routeName: "api/settings PUT" });
  }
}
