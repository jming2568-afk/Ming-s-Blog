import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getSiteSettings,
  getResumeData,
  updateSiteSettings,
} from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 公开读取：站点设置 + 双版本简历
export async function GET() {
  try {
    const settings = getSiteSettings();
    const resume = getResumeData();
    return NextResponse.json({ ok: true, settings, resume });
  } catch (err) {
    console.error("[api/settings GET] error:", err);
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
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
    console.error("[api/settings PUT] error:", err);
    return NextResponse.json(
      { error: "保存失败：" + (err?.message || "服务器错误") },
      { status: 500 }
    );
  }
}
