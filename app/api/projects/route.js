import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  listProjects,
  createProject,
  slugExists,
} from "@/lib/projects";
import { json500 } from "@/lib/routeHelpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ ok: true, projects });
  } catch (err) {
    return json500(err, { routeName: "api/projects GET" });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

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
      if (await slugExists(finalSlug)) finalSlug = `${finalSlug}-${Date.now()}`;
    } else {
      if (await slugExists(finalSlug)) {
        return NextResponse.json({ error: "slug 已存在，请更换" }, { status: 400 });
      }
    }

    const project = await createProject({
      slug: finalSlug,
      title: title.trim(),
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
    });
    return NextResponse.json({ ok: true, project });
  } catch (err) {
    return json500(err, { routeName: "api/projects POST" });
  }
}
