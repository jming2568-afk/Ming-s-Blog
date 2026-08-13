// 内容存储层：默认数据(data/*.js) + 可编辑覆盖(Vercel Blob / 本地文件)
//
// 优先级：
//   1) 生产（配置了 BLOB_READ_WRITE_TOKEN）→ Vercel Blob 上的 content.json
//   2) 本地开发（未配置 token）→ data/content.local.json（gitignored，写入后立即可见）
//   3) 都没有 → 直接使用 data/*.js 里的默认内容
//
// 公开页面（服务端）调用 getContent() 拿最新内容；管理后台经 /api/content 读写。

import { promises as fs } from "node:fs";
import path from "node:path";
import { put, list } from "@vercel/blob";

import { profile } from "@/data/profile";
import { projects, projectCategories } from "@/data/projects";
import { skills } from "@/data/skills";
import { timeline } from "@/data/timeline";
import { resumeVersions } from "@/data/resume";

export const CONTENT_KEY = "content.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "content.local.json");

// 默认内容（种子数据，data/*.js 仍是唯一事实来源）
export const DEFAULT_CONTENT = {
  profile,
  projects,
  projectCategories,
  skills,
  timeline,
  resume: resumeVersions,
};

function hasBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// 递归合并：对象按 key 合并，数组/标量整体替换
function mergeContent(defaults, stored) {
  if (!stored || typeof stored !== "object") return defaults;
  const out = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const d = defaults[key];
    const s = stored[key];
    if (s === undefined) continue;
    if (Array.isArray(d) || Array.isArray(s) || d === null || s === null) {
      out[key] = s;
    } else if (d && s && typeof d === "object" && typeof s === "object") {
      out[key] = mergeContent(d, s);
    } else {
      out[key] = s;
    }
  }
  return out;
}

async function readFromBlob() {
  const { blobs } = await list({ prefix: CONTENT_KEY });
  if (!blobs.length) return null;
  const newest = [...blobs].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )[0];
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function readLocalFile() {
  try {
    const raw = await fs.readFile(LOCAL_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 返回合并后的完整内容对象（服务端专用，勿在客户端组件里 import）
export async function getContent() {
  let stored = null;
  try {
    stored = hasBlob() ? await readFromBlob() : await readLocalFile();
  } catch (err) {
    console.error("[content] 读取 Blob 内容失败，回退本地/默认数据：", err?.message);
  }
  if (!stored) {
    // Blob 读失败时（如本地未配 token 但文件存在）再试本地文件
    stored = await readLocalFile();
  }
  return mergeContent(DEFAULT_CONTENT, stored);
}

// 保存内容（写入 Blob；未配 token 时写入本地文件便于本地调试）
export async function saveContent(content) {
  if (hasBlob()) {
    await put(CONTENT_KEY, JSON.stringify(content, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });
    return { storage: "blob" };
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(content, null, 2), "utf8");
  return { storage: "local" };
}
