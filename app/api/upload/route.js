import path from "node:path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAuthed } from "@/lib/auth";

// POST /api/upload → multipart 上传图片/视频到 Vercel Blob（需登录）
// 返回 { url } 可直接用于页面展示 / 填入内容 JSON

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request) {
  try {
    if (!(await isAuthed())) {
      return NextResponse.json({ error: "未登录或登录已过期" }, { status: 401 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "未配置 BLOB_READ_WRITE_TOKEN，无法上传。本地开发请直接使用 data/ 下的默认图片。" },
        { status: 500 }
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "缺少文件（字段名：file）" }, { status: 400 });
    }
    const originalName = file.name || "upload.bin";
    const safeName = originalName.replace(/[^\w.\-]/g, "_");
    const ext = path.extname(safeName).toLowerCase() || "";
    const name = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }

    const blob = await put(name, buffer, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      size: buffer.length,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "上传失败" }, { status: 500 });
  }
}
