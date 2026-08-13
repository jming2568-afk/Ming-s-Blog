import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getProjectById,
  updateProjectById,
  deleteProjectById,
  slugExists,
} from "@/lib/projects";
import { json500 } from "@/lib/routeHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "无效 ID" }, { status: 400 });
    const project = await getProjectById(id);
    if (!project) return NextResponse.json({ error: "未找到" }, { status: 404 });
    return NextResponse.json({ ok: true, project });
  } catch (err) {
    return json500(err, { routeName: "api/projects/:id GET" });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "无效 ID" }, { status: 400 });

    const existing = await getProjectById(id);
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
      if (await slugExists(finalSlug, id)) {
        return NextResponse.json({ error: "slug 已存在" }, { status: 400 });
      }
    }

    const patch = {
      slug: finalSlug,
      title: finalTitle,
    };
    if (category !== undefined) patch.category = category;
    if (role !== undefined) patch.role = role;
    if (tagline !== undefined) patch.tagline = tagline;
    if (episodes !== undefined) patch.episodes = episodes;
    if (team !== undefined) patch.team = team;
    if (result !== undefined) patch.result = result;
    if (tags !== undefined) patch.tags = tags;
    if (featured !== undefined) patch.featured = featured;
    if (mediaUrl !== undefined) patch.mediaUrl = mediaUrl;
    if (mediaType !== undefined) patch.mediaType = mediaType;

    const updated = await updateProjectById(id, patch);
    if (!updated) return NextResponse.json({ error: "作品不存在" }, { status: 404 });
    return NextResponse.json({ ok: true, project: updated });
  } catch (err) {
    return json500(err, { routeName: "api/projects/:id PUT" });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "无效 ID" }, { status: 400 });

    await deleteProjectById(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return json500(err, { routeName: "api/projects/:id DELETE" });
  }
}
