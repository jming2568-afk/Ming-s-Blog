// lib/projects.js — 服务端作品集数据访问层（基于 Blob 文档存储）

import { getDoc, updateDoc } from "@/lib/store";

export async function listProjects() {
  const doc = await getDoc();
  const list = (doc.projects || []).slice();
  return list.sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) || Number(b.id) - Number(a.id)
  );
}

export async function getProjectById(id) {
  const doc = await getDoc();
  return (doc.projects || []).find((p) => Number(p.id) === Number(id)) || null;
}

export async function slugExists(slug, excludeId) {
  const doc = await getDoc();
  return (doc.projects || []).some(
    (p) => p.slug === slug && Number(p.id) !== Number(excludeId)
  );
}

function nextId(projects) {
  return projects.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
}

export async function createProject(input) {
  return updateDoc((doc) => {
    const projects = doc.projects || [];
    const now = Math.floor(Date.now() / 1000);
    const project = {
      id: nextId(projects),
      slug: input.slug,
      title: input.title,
      category: input.category || "manga",
      role: input.role ?? null,
      tagline: input.tagline ?? null,
      episodes: input.episodes ?? null,
      team: input.team ?? null,
      result: input.result ?? null,
      tags: Array.isArray(input.tags) ? input.tags : [],
      featured: !!input.featured,
      mediaUrl: input.mediaUrl ?? null,
      mediaType: input.mediaType ?? null,
      createdAt: now,
      updatedAt: now,
    };
    projects.push(project);
    doc.projects = projects;
    return project;
  });
}

export async function updateProjectById(id, patch) {
  return updateDoc((doc) => {
    const projects = doc.projects || [];
    const idx = projects.findIndex((p) => Number(p.id) === Number(id));
    if (idx === -1) return null;
    const current = projects[idx];
    const next = { ...current };
    for (const key of [
      "slug",
      "title",
      "category",
      "role",
      "tagline",
      "episodes",
      "team",
      "result",
      "featured",
      "mediaUrl",
      "mediaType",
    ]) {
      if (patch[key] !== undefined) next[key] = patch[key];
    }
    if (patch.tags !== undefined) {
      next.tags = Array.isArray(patch.tags) ? patch.tags : [];
    }
    next.updatedAt = Math.floor(Date.now() / 1000);
    projects[idx] = next;
    return next;
  });
}

export async function deleteProjectById(id) {
  return updateDoc((doc) => {
    const before = (doc.projects || []).length;
    doc.projects = (doc.projects || []).filter((p) => Number(p.id) !== Number(id));
    return doc.projects.length !== before;
  });
}
