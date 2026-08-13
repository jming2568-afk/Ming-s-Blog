import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getResumeData, updateResumeData } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 需登录：保存双版本简历（结构化对象）
export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const body = await req.json();
    const resume = body?.resume;
    if (!resume || typeof resume !== "object") {
      return NextResponse.json({ error: "缺少 resume 数据" }, { status: 400 });
    }

    const saved = updateResumeData(resume);
    return NextResponse.json({ ok: true, resume: saved });
  } catch (err) {
    console.error("[api/settings/resume PUT] error:", err);
    return NextResponse.json(
      { error: "保存失败：" + (err?.message || "服务器错误") },
      { status: 400 }
    );
  }
}
