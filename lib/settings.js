// 服务端站点设置读写层（Node only，同步 better-sqlite3）
// 个人资料 + 双版本简历统一存 site_settings 单行；静态 data/profile.js / data/resume.js 作为默认值回退
import db, { ensureTables, ensureSiteSettings } from "../lib/db.js";
import { profile as defaultProfile } from "../data/profile.js";
import { resumeVersions as defaultResume } from "../data/resume.js";

ensureTables();
ensureSiteSettings();

// 可被 PUT /api/settings 更新的白名单字段（camelCase → 数据库列名）
const FIELD_MAP = {
  displayName: "display_name",
  avatarUrl: "avatar_url",
  certPhotoUrl: "cert_photo_url",
  email: "email",
  github: "github",
  githubUrl: "github_url",
  location: "location",
  wechatId: "wechat_id",
  wechatQrUrl: "wechat_qr_url",
  bioShort: "bio_short",
  bioLong: "bio_long",
};

// 读取原始行（内部用）
function getRow() {
  return db.prepare("SELECT * FROM site_settings WHERE id = 1").get();
}

// 返回给公开页面的设置对象（空字段回退默认值）
export function getSiteSettings() {
  const row = getRow();
  if (!row) return publicShape(defaultProfile);
  let titles = [];
  try {
    titles = JSON.parse(row.titles_json || "[]");
  } catch {}
  if (!Array.isArray(titles)) titles = [];

  return {
    displayName: row.display_name || defaultProfile.name || "李佳铭",
    avatarUrl: row.avatar_url || defaultProfile.avatar || "",
    certPhotoUrl: row.cert_photo_url || "",
    email: row.email || defaultProfile.email || "",
    github: row.github || defaultProfile.github || "",
    githubUrl: row.github_url || defaultProfile.githubUrl || "",
    location: row.location || defaultProfile.location || "",
    wechatId: row.wechat_id || defaultProfile.wechatId || "",
    wechatQrUrl: row.wechat_qr_url || defaultProfile.wechatQrUrl || "",
    bioShort: row.bio_short || defaultProfile.bioShort || "",
    bioLong: row.bio_long || defaultProfile.bioLong || "",
    titles: titles.length ? titles : defaultProfile.titles || [],
    updatedAt: row.updated_at,
  };
}

function publicShape(p) {
  return {
    displayName: p.name || "李佳铭",
    avatarUrl: p.avatar || "",
    certPhotoUrl: "",
    email: p.email || "",
    github: p.github || "",
    githubUrl: p.githubUrl || "",
    location: p.location || "",
    wechatId: p.wechatId || "",
    wechatQrUrl: p.wechatQrUrl || "",
    bioShort: p.bioShort || "",
    bioLong: p.bioLong || "",
    titles: Array.isArray(p.titles) ? p.titles : [],
    updatedAt: null,
  };
}

// 读取简历数据（DB 存的是完整 resumeVersions 对象；非法时回退默认）
export function getResumeData() {
  const row = getRow();
  if (!row || !row.resume_json) return cloneDefaultResume();
  let parsed = null;
  try {
    parsed = JSON.parse(row.resume_json);
  } catch {}
  if (validateResume(parsed)) return parsed;
  return cloneDefaultResume();
}

function cloneDefaultResume() {
  return JSON.parse(JSON.stringify(defaultResume));
}

// 宽松结构校验：必须含 aigc / dev，且每版含核心字段
export function validateResume(resume) {
  if (!resume || typeof resume !== "object") return false;
  for (const id of ["aigc", "dev"]) {
    const v = resume[id];
    if (!v || typeof v !== "object") return false;
    if (typeof v.title !== "string" || typeof v.summary !== "string") return false;
    if (!Array.isArray(v.workExperience) || !Array.isArray(v.education)) return false;
    if (typeof v.certs !== "string") return false;
    if (id === "aigc" && !Array.isArray(v.works) && !Array.isArray(v.abilities)) return false;
    if (id === "dev" && !Array.isArray(v.projects) && !Array.isArray(v.techStack)) return false;
  }
  return true;
}

// 更新个人资料（白名单），返回最新设置
export function updateSiteSettings(patch) {
  if (!patch || typeof patch !== "object") patch = {};
  const row = getRow();
  if (!row) return getSiteSettings();

  const next = {};
  for (const key of Object.keys(FIELD_MAP)) {
    if (patch[key] !== undefined) {
      next[FIELD_MAP[key]] = String(patch[key] ?? "");
    }
  }
  // titles 数组 → JSON
  if (patch.titles !== undefined) {
    const arr = Array.isArray(patch.titles) ? patch.titles.map((t) => String(t)) : [];
    next.titles_json = JSON.stringify(arr);
  }

  if (Object.keys(next).length === 0) return getSiteSettings();

  const sets = Object.keys(next)
    .map((k) => `${k} = @${k}`)
    .join(", ");
  db.prepare(
    `UPDATE site_settings SET ${sets}, updated_at = strftime('%s', 'now') WHERE id = 1`
  ).run(next);

  return getSiteSettings();
}

// 更新简历数据（校验通过后保存），返回最新简历
export function updateResumeData(resume) {
  if (!validateResume(resume)) {
    throw new Error("简历数据结构不合法：必须包含 aigc 与 dev 两个版本，且字段完整");
  }
  db.prepare(
    `UPDATE site_settings SET resume_json = ?, updated_at = strftime('%s', 'now') WHERE id = 1`
  ).run(JSON.stringify(resume));
  return getResumeData();
}
