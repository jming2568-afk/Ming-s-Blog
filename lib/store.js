// lib/store.js — Blob 文档存储层（替代 SQLite）
//
// 全部业务数据收敛到单个 content.json 文档（Vercel Blob 或本地文件降级）：
//   { version, admin, loginFailures, settings, resume, projects }
//
// 存储策略：
//   1) 配置了 BLOB_READ_WRITE_TOKEN → Vercel Blob（生产）
//   2) 否则 → data/content.local.json（本地开发，已 gitignore）
//
// 健壮性设计（2026-08 上线故障复盘）：
//   - content.json 写入带 allowOverwrite，避免多实例冷启动并发种子时报 "blob already exists"
//   - 读取优先公开 URL，失败自动降级 SDK 鉴权读取（私有 store 也能读）
//   - 存储完全不可用时，站点用内存种子数据照常渲染，绝不因存储故障 500

import { put, list, get } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { hashPassword } from "@/lib/auth";
import { profile as defaultProfile } from "@/data/profile";
import { resumeVersions as defaultResume } from "@/data/resume";
import { projects as defaultProjects } from "@/data/projects";

const CONTENT_KEY = "content.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "content.local.json");

// 内存缓存仅作读加速，带短 TTL：
// Next 生产模式下「页面渲染」与「API 路由」是独立 bundle/进程（Vercel 上甚至是独立 Lambda），
// 各自持有模块状态；若缓存永不过期，一处在 /settings 保存后另一处永远读旧值。
// 2 秒 TTL 保证跨 bundle/实例在保存后很快收敛，同时避免每个请求都打 Blob。
const CACHE_TTL_MS = 2000;

let cache = null; // 每个 bundle/实例的内存缓存
let cacheAt = 0;

function hasBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// 把 Blob SDK 的英文报错转成可操作的提示（save 接口直接透传给前端）
export function decorateBlobError(err) {
  const msg = err?.message || String(err || "");
  if (/private store/i.test(msg)) {
    return new Error(
      "Blob Store 是私有访问，无法公开读写。请在 Vercel Storage 中把该 Blob Store 设为 Public Access（或删除重建为公开），并更新 BLOB_READ_WRITE_TOKEN 后重新部署。"
    );
  }
  if (/store does not exist/i.test(msg)) {
    return new Error(
      "BLOB_READ_WRITE_TOKEN 指向的 Blob Store 不存在。请在 Vercel Storage 检查/重建 Store，并更新环境变量 BLOB_READ_WRITE_TOKEN 后重新部署。"
    );
  }
  return err;
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// ============ 持久化 ============

async function readBlobDoc() {
  const { blobs } = await list({ prefix: CONTENT_KEY });
  if (!blobs.length) return null;
  const newest = [...blobs].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )[0];
  // 1) 公开 URL 直读（公开 store）
  try {
    const res = await fetch(newest.url, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {}
  // 2) SDK 鉴权读取（私有 store 也能读；public/private 两种访问模式都试）
  for (const access of ["public", "private"]) {
    try {
      const blob = await get(newest.url, { access });
      if (blob && blob.statusCode === 200) {
        return await new Response(blob.stream).json();
      }
    } catch {}
  }
  return null;
}

async function writeBlobDoc(doc) {
  await put(CONTENT_KEY, JSON.stringify(doc, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true, // 多实例并发种子/保存时允许覆盖，避免 "blob already exists"
    cacheControlMaxAge: 0,
  });
}

async function readLocalDoc() {
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function writeLocalDoc(doc) {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(doc, null, 2), "utf8");
}

// ============ 种子数据（首次初始化） ============

function seedSettings() {
  return {
    displayName: defaultProfile.name || "",
    avatarUrl: defaultProfile.avatar || "",
    certPhotoUrl: "",
    email: defaultProfile.email || "",
    github: defaultProfile.github || "",
    githubUrl: defaultProfile.githubUrl || "",
    location: defaultProfile.location || "",
    wechatId: defaultProfile.wechatId || "",
    wechatQrUrl: defaultProfile.wechatQrUrl || "",
    bioShort: defaultProfile.bioShort || "",
    bioLong: defaultProfile.bioLong || "",
    titles: Array.isArray(defaultProfile.titles) ? defaultProfile.titles : [],
    updatedAt: nowSec(),
  };
}

function seedProjects() {
  return defaultProjects.map((p, i) => ({
    id: i + 1,
    slug: p.slug,
    title: p.title,
    category: p.category,
    role: p.role ?? null,
    tagline: p.tagline ?? null,
    episodes: p.episodes ?? null,
    team: p.team ?? null,
    result: p.result ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    featured: !!p.featured,
    mediaUrl: p.mediaUrl ?? null,
    mediaType: p.mediaType ?? null,
    createdAt: nowSec(),
    updatedAt: nowSec(),
  }));
}

async function seedDoc() {
  const initUsername = (process.env.INIT_ADMIN_USERNAME || "").trim() || "useradmin";
  const initPassword = (process.env.INIT_ADMIN_PASSWORD || "").trim() || "useradmin123";
  if (initPassword.length < 6 || initPassword.length > 72) {
    throw new Error(
      `[store] INIT_ADMIN_PASSWORD 长度必须在 6-72 位之间（当前 ${initPassword.length} 位），请在环境变量中修正。`
    );
  }
  if (!process.env.INIT_ADMIN_PASSWORD) {
    console.warn(
      "[store] 警告：未设置 INIT_ADMIN_PASSWORD，正在使用默认管理员密码 useradmin123，请尽快在 /settings 中修改。"
    );
  }
  const passwordHash = await hashPassword(initPassword);
  return {
    version: 1,
    admin: { id: 1, username: initUsername, passwordHash },
    loginFailures: [],
    settings: seedSettings(),
    resume: JSON.parse(JSON.stringify(defaultResume)),
    projects: seedProjects(),
  };
}

// ============ 读写接口 ============

// 返回当前文档（短 TTL 缓存 + Blob/本地文件；无则种子初始化并持久化）
// 保证：任何存储异常都不会让 getDoc 抛错——站点始终能用（内存种子）渲染
export async function getDoc() {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;

  let doc = null;
  try {
    if (hasBlob()) doc = await readBlobDoc();
  } catch (err) {
    console.error("[store] 读取 Blob 内容失败：", err?.message);
  }
  if (!doc) {
    try {
      doc = await readLocalDoc();
    } catch {}
  }
  if (!doc) {
    try {
      doc = await seedDoc();
    } catch (err) {
      // 种子失败（如 INIT_ADMIN_PASSWORD 长度非法）：也绝不让站点挂掉
      console.error("[store] 种子数据初始化失败：", err?.message);
      doc = await seedDocFallback();
    }
    try {
      await persistDoc(doc);
      console.log("[store] 内容文档不存在，已用种子数据初始化。");
    } catch (err) {
      // 持久化失败（store 私有/不存在/token 错误等）：站点以默认内容运行，改动不落盘但可访问
      console.error("[store] 种子数据持久化失败（站点以默认内容运行）：", err?.message);
    }
  }
  cache = doc;
  cacheAt = now;
  return doc;
}

// 种子兜底：不依赖环境变量，保证一定有可渲染的文档
async function seedDocFallback() {
  const passwordHash = await hashPassword("useradmin123");
  return {
    version: 1,
    admin: { id: 1, username: "useradmin", passwordHash },
    loginFailures: [],
    settings: seedSettings(),
    resume: JSON.parse(JSON.stringify(defaultResume)),
    projects: seedProjects(),
  };
}

async function persistDoc(doc) {
  if (hasBlob()) {
    try {
      await writeBlobDoc(doc);
    } catch (err) {
      throw decorateBlobError(err);
    }
  } else {
    await writeLocalDoc(doc);
  }
}

// 事务式更新：mutator(doc) 原地修改后整体落盘，返回 mutator 的返回值
export async function updateDoc(mutator) {
  const doc = await getDoc();
  const result = await mutator(doc);
  await persistDoc(doc);
  // 写后立即刷新缓存时间戳，同一 bundle 内立即可见
  cache = doc;
  cacheAt = Date.now();
  return result;
}
