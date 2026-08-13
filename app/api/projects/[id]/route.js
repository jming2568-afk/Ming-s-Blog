import { NextResponse } from "next/server";
import getDb, { ensureDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const IS_DEV = process.env.NODE_ENV !== "production";

function rowToProject(row) {
  if (!row) return null;
  let tags = [];
  try {
    tags = JSON.parse(row.tags || "[]");
  } catch {}
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    role: row.role,
    tagline: row.tagline,
    episodes: row.episodes,
    team: row.team,
    result: row.result,
    tags,
    featured: !!row.featured,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function withDb() {
  ensureDb();
  return getDb();
}

export async function GET(req, { params }) {
  try {
    const db = withDb();
    const id = Number(params?.id);
    if (!id) return NextResponse.json({ error: "无效 ID" }, { status: 400 });
    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    if (!row) return NextResponse.json({ error: "未找到" }, { status: 404 });
    return NextResponse.json({ ok: true, project: rowToProject(row) });
  } catch (err) {
    console.error("[api/projects/:id GET] error:", err);
    return NextResponse.json(
      {
        error: "读取失败",
        debug: IS_DEV ? (err?.message || String(err)) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const db = withDb();

    const id = Number(params?.id);
    if (!id) return NextResponse.json({ error: "无效 ID" }, { status: 400 });

    const existing = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    if (!existing) return NextResponse.json({ error: "作品不存在" }, { status: 404 });

    const body = await req.json();
    const {
      slug,
      title,
      category,
      role,
      tagline,
      episodes,
      team,
      result,
      tags,
      featured,
      mediaUrl,
      mediaType,
    } = body || {};

    const finalTitle = title !== undefined ? title.trim() : existing.title;
    if (!finalTitle) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });

    let finalSlug = existing.slug;
    if (slug !== undefined && slug.trim() && slug.trim() !== existing.slug) {
      finalSlug = slug.trim();
      const dup = db
        .prepare("SELECT COUNT(*) AS c FROM projects WHERE slug = ? AND id != ?")
        .get(finalSlug, id).c;
      if (dup > 0) return NextResponse.json({ error: "slug 已存在" }, { status: 400 });
    }

    db.prepare(
      `UPDATE projects SET
        slug = ?, title = ?, category = ?, role = ?, tagline = ?,
        episodes = ?, team = ?, result = ?, tags = ?, featured = ?,
        media_url = ?, media_type = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?`
    ).run(
      finalSlug,
      finalTitle,
      category ?? existing.category,
      role ?? existing.role,
      tagline ?? existing.tagline,
      episodes ?? existing.episodes,
      team ?? existing.team,
      result ?? existing.result,
      tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : existing.tags,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      mediaUrl !== undefined ? mediaUrl : existing.media_url,
      mediaType !== undefined ? mediaType : existing.media_type,
      id
    );

    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    return NextResponse.json({ ok: true, project: rowToProject(row) });
  } catch (err) {
    console.error("[api/projects/:id PUT] error:", err);
    return NextResponse.json(
      {
        error: "更新失败：" + (err?.message || "服务器错误"),
        debug: IS_DEV ? (err?.message || String(err)) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const db = withDb();

    const id = Number(params?.id);
    if (!id) return NextResponse.json({ error: "无效 ID" }, { status: 400 });

    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/projects/:id DELETE] error:", err);
    return NextResponse.json(
      {
        error: "删除失败：" + (err?.message || "服务器错误"),
        debug: IS_DEV ? (err?.message || String(err)) : undefined,
      },
      { status: 500 }
    );
  }
}
