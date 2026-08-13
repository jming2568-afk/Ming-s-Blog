import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getResumeData, updateResumeData } from "@/lib/settings";
import { ensureDb } from "@/lib/db";
import { json500, normalizeError } from "@/lib/routeHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IS_DEV = process.env.NODE_ENV !== "production";

// 需登录：保存双版本简历（结构化对象）
export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    try {
      ensureDb();
    } catch (dbErr) {
      const { message } = normalizeError(dbErr);
      console.error("[api/settings/resume] db init error:", message, dbErr);
      return NextResponse.json(
        {
          error: "数据库初始化失败：" + message,
          debug: IS_DEV ? message : undefined,
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const resume = body?.resume;
    if (!resume || typeof resume !== "object") {
      return NextResponse.json({ error: "缺少 resume 数据" }, { status: 400 });
    }

    const saved = updateResumeData(resume);
    return NextResponse.json({ ok: true, resume: saved });
  } catch (err) {
    return json500(err, { routeName: "api/settings/resume PUT" });
  }
}
