import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { resumes } from "@platform/shared/db/schema";
import type { ResumeData } from "@platform/shared";
import { requireAuth } from "../../middleware/auth.js";
import type { AppVariables } from "../../types.js";
import { getDb } from "../../db/index.js";
import { resumeToDocx } from "./word.js";

/** 导出：PDF（委托独立 Playwright 服务）/ Word（docx 本地生成） */
export function createExportRoutes(config: { pdfServiceUrl: string }) {
  const r = new Hono<{ Variables: AppVariables }>();
  r.use("*", requireAuth);

  // PDF：主人导出自己的简历（与展示页同版式，由 apps/pdf 渲染）
  r.get("/pdf/:slug", async (c) => {
    const user = c.get("user");
    const resume = await getBySlugOwned(user!.id, c.req.param("slug"));
    if (!resume) return c.json({ ok: false, error: "简历不存在" }, 404);

    const target = `${config.pdfServiceUrl}/pdf/${encodeURIComponent(resume.slug)}`;
    const upstream = await fetch(target, { signal: AbortSignal.timeout(60_000) });
    if (!upstream.ok) {
      return c.json({ ok: false, error: "PDF 生成服务不可用，请稍后再试" }, 502);
    }
    const pdf = Buffer.from(await upstream.arrayBuffer());
    const bytes = new Uint8Array(pdf.byteLength);
    bytes.set(pdf);
    c.header("content-type", "application/pdf");
    c.header("content-disposition", `attachment; filename="${encodeURIComponent(resume.title)}.pdf"`);
    return c.body(bytes);
  });

  // Word：主人导出自己的简历（docx，可编辑）
  r.get("/word/:slug", async (c) => {
    const user = c.get("user");
    const resume = await getBySlugOwned(user!.id, c.req.param("slug"));
    if (!resume) return c.json({ ok: false, error: "简历不存在" }, 404);

    const buffer = await resumeToDocx(resume.data);
    const bytes = new Uint8Array(buffer.byteLength);
    bytes.set(buffer);
    c.header("content-type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    c.header("content-disposition", `attachment; filename="${encodeURIComponent(resume.title)}.docx"`);
    return c.body(bytes);
  });

  return r;
}

/** 按 slug 取本人简历（导出需要所有权） */
async function getBySlugOwned(userId: number, slug: string) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.db
    .select()
    .from(resumes)
    .where(and(eq(resumes.userId, userId), eq(resumes.slug, slug)))
    .limit(1);
  if (!row) return null;
  return { id: row.id, title: row.title, slug: row.slug, data: row.data as ResumeData };
}
