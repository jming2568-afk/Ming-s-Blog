"use client";

// Lightweight fetch wrapper with a simple in-memory cache (no SWR dependency).

const fetcher = (url) =>
  fetch(url, { cache: "no-store" }).then(async (res) => {
    const data = await res.json();
    if (!res.ok || !data?.ok) throw new Error(data?.error || "请求失败");
    return data;
  });

let cache = { projects: null, ts: 0 };
const CACHE_TTL = 30_000; // 30s soft cache for repeated calls within one page

export async function fetchProjects({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.projects && now - cache.ts < CACHE_TTL) {
    return cache.projects;
  }
  const data = await fetcher("/api/projects");
  cache.projects = data.projects;
  cache.ts = now;
  return data.projects;
}

export function invalidateProjectsCache() {
  cache = { projects: null, ts: 0 };
}

export async function createProject(payload) {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) throw new Error(data?.error || "创建失败");
  invalidateProjectsCache();
  return data.project;
}

export async function updateProject(id, payload) {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) throw new Error(data?.error || "更新失败");
  invalidateProjectsCache();
  return data.project;
}

export async function deleteProject(id) {
  const res = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) throw new Error(data?.error || "删除失败");
  invalidateProjectsCache();
  return true;
}
