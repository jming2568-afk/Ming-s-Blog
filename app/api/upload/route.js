import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { ensureDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB

// 上传目录默认策略：与 lib/db.js 保持一致，避免 cwd 被切到 /var/task 时无处可写。
// 预览/Serverless 下如果 UPLOAD_DIR 仍在 /var/task 里，则自动降级到 /tmp/<project>/public/uploads。
function computeDefaultUploadDir() {
  const workspace = process.env.TRAE_ENV_WORKSPACE || process.env.TRAE_WORKSPACE;
  const cwd = process.cwd();
  const candidate =
    workspace && !cwd.startsWith("/var/task")
      ? path.join(workspace, "public", "uploads")
      : path.join(cwd, "public", "uploads");
  if (
    candidate.startsWith("/var/task/") ||
    candidate === "/var/task" ||
    cwd === "/var/task" ||
    !isDirWritable(path.dirname(candidate))
  ) {
    const slug = (process.env.npm_package_name || "portfolio").replace(/[^a-zA-Z0-9_-]/g, "_") || "portfolio";
    return path.join("/tmp", slug, "public", "uploads");
  }
  return candidate;
}
function isDirWritable(dir) {
  try {
    if (!fs.existsSync(dir)) {
      // 不强制创建，只对已存在的目录做写探测
      return false;
    }
    const probe = path.join(dir, `.upload_probe_${process.pid}_${Date.now()}`);
    fs.writeFileSync(probe, "");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}
const UPLOAD_ROOT = process.env.UPLOAD_DIR || computeDefaultUploadDir();

const IS_DEV = process.env.NODE_ENV !== "production";

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

    try {
      ensureDb();
    } catch (dbErr) {
      // 上传 API 本身不写 DB，但使用了 auth session；DB 初始化失败时给出 JSON 500，避免 HTML 错误页
      console.error("[api/upload] db init error:", dbErr);
      return NextResponse.json(
        {
          error: "服务初始化失败：" + (dbErr?.message || "未知错误"),
          debug: IS_DEV ? (dbErr?.message || String(dbErr)) : undefined,
        },
        { status: 500 }
      );
    }

    // 确保上传根目录存在（UPLOAD_DIR 可能是外部配置的新路径）
    ensureDir(UPLOAD_ROOT);

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

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(fullPath, Buffer.from(arrayBuffer));

    // 生成对外可访问 URL。
    // 若 UPLOAD_DIR 仍位于 <cwd>/public/uploads 下，走 Next.js 静态文件规则：/uploads/YYYY/MM/file.ext
    // 若用户用自定义路径，需要配置 nginx/Next.js rewrites 指向该目录。
    const publicPrefix = path.resolve(process.cwd(), "public");
    let url;
    if (fullPath.startsWith(publicPrefix)) {
      url = `/uploads/${yyyy}/${mm}/${name}`;
    } else {
      // 自定义目录场景：先给一个相对路径，实际部署时自行补 rewrite/静态服务
      url = `/uploads/${yyyy}/${mm}/${name}`;
    }
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
      {
        error: "上传失败：" + (err?.message || "服务器错误"),
        debug: IS_DEV ? (err?.message || String(err)) : undefined,
      },
      { status: 500 }
    );
  }
}
