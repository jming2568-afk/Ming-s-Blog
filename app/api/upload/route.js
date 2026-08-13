import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { ensureDb } from "@/lib/db";
import { json500, normalizeError } from "@/lib/routeHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB

// 上传目录默认策略：与 lib/db.js 对齐 — Vercel Serverless 下强制落到 /tmp 并挂静态路由兜底。
// 本地开发则落到 <root>/public/uploads 以被 Next 静态服务直接暴露为 /uploads/*
function detectProjectRoot() {
  let cur = path.dirname(new URL(import.meta.url).pathname);
  for (let i = 0; i < 10; i++) {
    try {
      const pj = path.join(cur, "package.json");
      if (fs.existsSync(pj)) {
        const txt = fs.readFileSync(pj, "utf8");
        if (/"next"\s*:/.test(txt)) return cur;
      }
    } catch {}
    const up = path.dirname(cur);
    if (up === cur) break;
    cur = up;
  }
  return null;
}
function looksLikeVercelServerless() {
  return Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.VERCEL_URL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT
  );
}
function isDirWritable(dir) {
  try {
    if (!fs.existsSync(dir)) return false;
    const probe = path.join(dir, `.upload_probe_${process.pid}_${Date.now()}`);
    fs.writeFileSync(probe, "");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}
function computeDefaultUploadDir() {
  const tmpSlug =
    (process.env.npm_package_name || process.env.VERCEL_GIT_REPO_SLUG || "portfolio")
      .replace(/[^a-zA-Z0-9_-]/g, "_") || "portfolio";

  if (looksLikeVercelServerless()) {
    // Vercel /tmp 是唯一可写目录；调用方会根据路径是否在 public/ 下决定走静态文件还是 /uploads 路由
    return path.join("/tmp", tmpSlug, "public", "uploads");
  }

  const cwd = process.cwd();
  if (cwd === "/var/task" || path.resolve(cwd).startsWith("/var/task")) {
    return path.join("/tmp", tmpSlug, "public", "uploads");
  }

  const root = detectProjectRoot();
  if (root) {
    const candidate = path.join(root, "public", "uploads");
    try {
      fs.mkdirSync(candidate, { recursive: true });
      if (isDirWritable(candidate)) return candidate;
    } catch {}
  }

  const cwdCandidate = path.join(cwd, "public", "uploads");
  try {
    fs.mkdirSync(cwdCandidate, { recursive: true });
    if (isDirWritable(cwdCandidate)) return cwdCandidate;
  } catch {}

  return path.join("/tmp", tmpSlug, "public", "uploads");
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
      const { message } = normalizeError(dbErr);
      console.error("[api/upload] db init error:", message, dbErr);
      return NextResponse.json(
        {
          error: "服务初始化失败：" + message,
          debug: IS_DEV ? message : undefined,
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
    // 1) 若文件写到了某个 public/uploads 子目录（且 Next.js 静态服务能覆盖到），就走 /uploads/YYYY/MM/...
    // 2) 若落到 /tmp 或 /var/task（Vercel Serverless 临时目录），前端直接访问 /uploads 找不到，改走 /api/uploads 动态读文件
    // 3) 其它自定义目录场景：保持 /uploads，部署时需要自行配置 rewrite/静态服务
    const publicPrefix = path.resolve(process.cwd(), "public");
    const inPublic = fullPath.startsWith(publicPrefix);
    const inTmp = fullPath.startsWith("/tmp/") || fullPath.startsWith("/var/task/");
    let url;
    if (inTmp) {
      // /api/uploads/YYYY/MM/file.ext，由 /app/api/uploads/[...file]/route.js 从磁盘读回
      url = `/api/uploads/${yyyy}/${mm}/${name}`;
    } else if (inPublic) {
      url = `/uploads/${yyyy}/${mm}/${name}`;
    } else {
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
    return json500(err, { routeName: "api/upload" });
  }
}
