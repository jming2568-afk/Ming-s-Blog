import { NextResponse } from "next/server";
import { getContent, saveContent } from "@/lib/content";
import { isAuthed } from "@/lib/auth";

// GET /api/content  → 完整内容对象（公开，页面读取）
// PUT /api/content  → 保存内容（需登录）

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getContent();
    return NextResponse.json(content);
  } catch (err) {
    return NextResponse.json({ error: err.message || "读取内容失败" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!(await isAuthed())) {
      return NextResponse.json({ error: "未登录或登录已过期" }, { status: 401 });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "内容格式错误" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "内容格式错误" }, { status: 400 });
    }
    const result = await saveContent(body);
    return NextResponse.json({
      ok: true,
      ...result,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "保存失败" }, { status: 500 });
  }
}
