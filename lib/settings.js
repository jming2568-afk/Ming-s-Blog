// lib/settings.js — 服务端站点设置 / 简历读写层（基于 Blob 文档存储）
// 与旧 SQLite 版本保持相同的导出函数与返回结构，接口路由无需改变调用方式

import { getDoc, updateDoc } from "@/lib/store";
import { profile as defaultProfile } from "@/data/profile";
import { resumeVersions as defaultResume } from "@/data/resume";

// 可被 PUT /api/settings 更新的白名单字段
const ALLOWED_KEYS = [
  "displayName",
  "avatarUrl",
  "certPhotoUrl",
  "email",
  "github",
  "githubUrl",
  "location",
  "wechatId",
  "wechatQrUrl",
  "bioShort",
  "bioLong",
  "titles",
];

export async function getSiteSettings() {
  const doc = await getDoc();
  const s = doc.settings || {};
  const titles = Array.isArray(s.titles) ? s.titles : [];
  return {
    displayName: s.displayName || defaultProfile.name || "李佳铭",
    avatarUrl: s.avatarUrl || defaultProfile.avatar || "",
    certPhotoUrl: s.certPhotoUrl || "",
    email: s.email || defaultProfile.email || "",
    github: s.github || defaultProfile.github || "",
    githubUrl: s.githubUrl || defaultProfile.githubUrl || "",
    location: s.location || defaultProfile.location || "",
    wechatId: s.wechatId || defaultProfile.wechatId || "",
    wechatQrUrl: s.wechatQrUrl || defaultProfile.wechatQrUrl || "",
    bioShort: s.bioShort || defaultProfile.bioShort || "",
    bioLong: s.bioLong || defaultProfile.bioLong || "",
    titles: titles.length ? titles : defaultProfile.titles || [],
    updatedAt: s.updatedAt ?? null,
  };
}

export async function getResumeData() {
  const doc = await getDoc();
  if (validateResume(doc.resume)) return doc.resume;
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

// 更新个人资料（白名单字段），返回最新设置
export async function updateSiteSettings(patch) {
  if (!patch || typeof patch !== "object") patch = {};
  await updateDoc((doc) => {
    const s = doc.settings || {};
    for (const key of ALLOWED_KEYS) {
      if (patch[key] !== undefined) {
        if (key === "titles") {
          s.titles = Array.isArray(patch.titles)
            ? patch.titles.map((t) => String(t))
            : [];
        } else {
          s[key] = String(patch[key] ?? "");
        }
      }
    }
    s.updatedAt = Math.floor(Date.now() / 1000);
    doc.settings = s;
  });
  return getSiteSettings();
}

// 更新简历数据（校验通过后保存），返回最新简历
export async function updateResumeData(resume) {
  if (!validateResume(resume)) {
    throw new Error("简历数据结构不合法：必须包含 aigc 与 dev 两个版本，且字段完整");
  }
  await updateDoc((doc) => {
    doc.resume = JSON.parse(JSON.stringify(resume));
  });
  return getResumeData();
}
