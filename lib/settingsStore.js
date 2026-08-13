"use client";

// 站点设置 / 简历 客户端访问层（30s 内存缓存，仿 lib/projectsStore.js）

let cache = { settings: null, resume: null, ts: 0 };
const CACHE_TTL = 30_000;

export async function fetchSettings({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.settings && cache.resume && now - cache.ts < CACHE_TTL) {
    return { settings: cache.settings, resume: cache.resume };
  }
  const res = await fetch("/api/settings", { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data?.ok) throw new Error(data?.error || "读取设置失败");
  cache.settings = data.settings;
  cache.resume = data.resume;
  cache.ts = now;
  return { settings: data.settings, resume: data.resume };
}

export function invalidateSettingsCache() {
  cache = { settings: null, resume: null, ts: 0 };
}

export async function updateSettings(payload) {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) throw new Error(data?.error || "保存失败");
  cache.settings = data.settings;
  cache.ts = Date.now();
  return data.settings;
}

export async function changePassword(oldPassword, newPassword) {
  const res = await fetch("/api/settings/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) throw new Error(data?.error || "修改密码失败");
  return data;
}

export async function saveResume(resume) {
  const res = await fetch("/api/settings/resume", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) throw new Error(data?.error || "保存简历失败");
  cache.resume = data.resume;
  cache.ts = Date.now();
  return data.resume;
}
