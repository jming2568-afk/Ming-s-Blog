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

export async function GET() {
  try {
    const db = withDb();
    const rows = db
      .prepare("SELECT * FROM projects ORDER BY featured DESC, id DESC")
      .all();
    const projects = rows.map(rowToProject);
    return NextResponse.json({ ok: true, projects });
  } catch (err) {
    console.error("[api/projects GET] error:", err);
    return NextResponse.json(
      {
        error: "读取失败",
        debug: IS_DEV ? (err?.message || String(err)) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const db = withDb();

    const body = await req.json();
    const {
      slug,
      title,
      category = "manga",
      role = "",
      tagline = "",
      episodes = "",
      team = "",
      result = "",
      tags = [],
      featured = false,
      mediaUrl = null,
      mediaType = null,
    } = body || {};

    if (!title || !title.trim())
      return NextResponse.json({ error: "标题必填" }, { status: 400 });
    if (!category || !["manga", "dev"].includes(category))
      return NextResponse.json({ error: "分类不合法" }, { status: 400 });

    let finalSlug = (slug || "").trim();
    if (!finalSlug) {
      finalSlug =
        title
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
          .replace(/^-+|-+$/g, "") || `project-${Date.now()}`;
      const existing = db
        .prepare("SELECT COUNT(*) AS c FROM projects WHERE slug = ?")
        .get(finalSlug).c;
      if (existing > 0) finalSlug = `${finalSlug}-${Date.now()}`;
    } else {
      const existing = db
        .prepare("SELECT COUNT(*) AS c FROM projects WHERE slug = ?")
        .get(finalSlug).c;
      if (existing > 0) {
        return NextResponse.json({ error: "slug 已存在，请更换" }, { status: 400 });
      }
    }

    const info = db
      .prepare(
        `INSERT INTO projects
          (slug, title, category, role, tagline, episodes, team, result, tags, featured, media_url, media_type, updated_at)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`
      )
      .run(
        finalSlug,
        title.trim(),
        category,
        role,
        tagline,
        episodes,
        team,
        result,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        featured ? 1 : 0,
        mediaUrl,
        mediaType
      );

    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(info.lastInsertRowid);
    return NextResponse.json({ ok: true, project: rowToProject(row) });
  } catch (err) {
    console.error("[api/projects POST] error:", err);
    return NextResponse.json(
      {
        error: "创建失败：" + (err?.message || "服务器错误"),
        debug: IS_DEV ? (err?.message || String(err)) : undefined,
      },
      { status: 500 }
    );
  }
}
