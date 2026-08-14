import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { resumes } from "@platform/shared/db/schema";
import type { ResumeData } from "@platform/shared";
import { requireAuth } from "../../middleware/auth.js";
import type { AppVariables } from "../../types.js";
import { getDb } from "../../db/index.js";
import { resumeToDocx } from "./word.js";

/**
 * 导出（TECH-001 §4.2）：
 * - PDF 改为客户端打印（window.print() + @media print），服务端不再生成
 * - Word（docx）本地生成保留
 */
export function createExportRoutes() {
  const r = new Hono<{ Variables: AppVariables }>();
  r.use("*", requireAuth);

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
