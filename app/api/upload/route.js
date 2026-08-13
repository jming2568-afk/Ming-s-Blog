import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function extFromMime(mime) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  return map[mime] || "";
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    const mime = file.type;
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "仅支持图片或视频文件" }, { status: 400 });
    }

    const maxSize = isImage ? MAX_IMAGE : MAX_VIDEO;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件过大（最大 ${isImage ? "8MB" : "100MB"}）` },
        { status: 400 }
      );
    }

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dir = path.join(UPLOAD_ROOT, yyyy, mm);
    ensureDir(dir);

    const ext = extFromMime(mime) || (isImage ? ".bin" : ".mp4");
    const name = `${randomUUID()}${ext}`;
    const fullPath = path.join(dir, name);

    // Write blob to disk
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(fullPath, Buffer.from(arrayBuffer));

    const url = `/uploads/${yyyy}/${mm}/${name}`;
    return NextResponse.json({
      ok: true,
      url,
      type: isImage ? "image" : "video",
      mime,
      size: file.size,
      name: file.name || name,
    });
  } catch (err) {
    console.error("[api/upload] error:", err);
    return NextResponse.json(
      { error: "上传失败：" + (err?.message || "服务器错误") },
      { status: 500 }
    );
  }
}
