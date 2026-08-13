import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings, getResumeData, updateSiteSettings } from "@/lib/settings";
import { json500 } from "@/lib/routeHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 公开读取：站点设置 + 双版本简历
export async function GET() {
  try {
    const settings = await getSiteSettings();
    const resume = await getResumeData();
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

    const settings = await updateSiteSettings(patch);
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    return json500(err, { routeName: "api/settings PUT" });
  }
}
