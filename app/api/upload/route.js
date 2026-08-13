import { NextResponse } from "next/server";
import path from "node:path";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { json500 } from "@/lib/routeHelpers";
import { decorateBlobError } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB

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

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "未配置 BLOB_READ_WRITE_TOKEN，无法上传。请在 Vercel 环境变量中配置后重试。" },
        { status: 500 }
      );
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

    const ext = extFromMime(mime) || (isImage ? ".jpg" : ".mp4");
    const name = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 写入 Vercel Blob，返回公网直链
    let blob;
    try {
      blob = await put(name, buffer, {
        access: "public",
        contentType: mime,
      });
    } catch (err) {
      throw decorateBlobError(err);
    }

    return NextResponse.json({
      ok: true,
      url: blob.url,
      type: isImage ? "image" : "video",
      mime,
      size: file.size,
      name: file.name || name,
    });
  } catch (err) {
    return json500(err, { routeName: "api/upload" });
  }
}
