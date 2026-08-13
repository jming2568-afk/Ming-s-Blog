import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

// 兜底：当上传文件落到 /tmp（Vercel Serverless）时，前端页面访问 /uploads/... 没有静态服务，
// 可以通过 /api/uploads/<filePath> 让服务端从磁盘读取再返回。
// 注意：Vercel /tmp 是实例级临时存储，冷启动会重置，仅适合 Preview 演示。

const SLUG =
  (process.env.npm_package_name || process.env.VERCEL_GIT_REPO_SLUG || "portfolio")
    .replace(/[^a-zA-Z0-9_-]/g, "_") || "portfolio";

// 候选搜索顺序与 upload/route.js 的 computeDefaultUploadDir 保持一致
function candidates() {
  const list = [];
  if (process.env.UPLOAD_DIR) list.push(process.env.UPLOAD_DIR);
  list.push(path.join("/tmp", SLUG, "public", "uploads"));
  // 从本文件向上探测项目根，找 <root>/public/uploads
  try {
    let cur = path.dirname(new URL(import.meta.url).pathname); // api/uploads/
    for (let i = 0; i < 6; i++) {
      const pj = path.join(cur, "package.json");
      if (fs.existsSync(pj)) {
        list.push(path.join(cur, "public", "uploads"));
        break;
      }
      const up = path.dirname(cur);
      if (up === cur) break;
      cur = up;
    }
  } catch {}
  list.push(path.join(process.cwd(), "public", "uploads"));
  return list;
}

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const segments = params?.file || [];
  if (!segments.length) return new Response("Not Found", { status: 404 });
  const subPath = segments.map(decodeURIComponent).join("/");

  // 防穿越：不允许绝对路径或回到父级
  if (path.isAbsolute(subPath) || subPath.includes("..")) {
    return new Response("Bad Request", { status: 400 });
  }

  for (const root of candidates()) {
    const full = path.join(root, subPath);
    if (!fs.existsSync(full)) continue;
    if (!fs.statSync(full).isFile()) continue;
    const ext = path.extname(full).toLowerCase();
    const mime = MIME_BY_EXT[ext] || "application/octet-stream";
    const stat = fs.statSync(full);
    const buf = fs.readFileSync(full);
    return new Response(buf, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
  return new Response("Not Found", { status: 404 });
}
