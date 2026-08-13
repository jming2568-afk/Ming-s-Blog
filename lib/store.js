// lib/store.js — Blob 文档存储层（替代 SQLite）
//
// 全部业务数据收敛到单个 content.json 文档（Vercel Blob 或本地文件降级）：
//   { version, admin, loginFailures, settings, resume, projects }
//
// 存储策略：
//   1) 配置了 BLOB_READ_WRITE_TOKEN → Vercel Blob（生产）
//   2) 否则 → data/content.local.json（本地开发，已 gitignore）
//
// 注意：Blob 为按文档整体读写的简单存储，单管理员个人站足够；
// 并发写（多实例同时保存）采用读-改-写，极端并发下可能相互覆盖，个人站可接受。

import { put, list } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { hashPassword } from "@/lib/auth";
import { profile as defaultProfile } from "@/data/profile";
import { resumeVersions as defaultResume } from "@/data/resume";
import { projects as defaultProjects } from "@/data/projects";

const CONTENT_KEY = "content.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "content.local.json");

let cache = null; // 每个 Serverless 实例的内存缓存

function hasBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
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
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function writeBlobDoc(doc) {
  await put(CONTENT_KEY, JSON.stringify(doc, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
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

// 返回当前文档（内存缓存 + Blob/本地文件；无则种子初始化并持久化）
export async function getDoc() {
  if (cache) return cache;
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
    doc = await seedDoc();
    await persistDoc(doc);
    console.log("[store] 内容文档不存在，已用种子数据初始化。");
  }
  cache = doc;
  return doc;
}

async function persistDoc(doc) {
  if (hasBlob()) {
    await writeBlobDoc(doc);
  } else {
    await writeLocalDoc(doc);
  }
}

// 事务式更新：mutator(doc) 原地修改后整体落盘，返回 mutator 的返回值
export async function updateDoc(mutator) {
  const doc = await getDoc();
  const result = await mutator(doc);
  await persistDoc(doc);
  return result;
}
