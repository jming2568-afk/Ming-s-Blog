import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { themes } from "@platform/shared/db/schema";
import { getPublicBySlug } from "../resumes/resume.service.js";
import { getDb } from "../../db/index.js";

/** 公共简历接口：/r/:slug 数据源（无需登录，仅已发布） */
export function createPublicRoutes() {
  const r = new Hono();

  r.get("/resumes/:slug", async (c) => {
    const resume = await getPublicBySlug(c.req.param("slug"));
    if (!resume) return c.json({ ok: false, error: "简历不存在或未发布" }, 404);
    // 附带主人主题令牌（前端直接注入 CSS 变量）
    const db = getDb();
    let theme: { id: number; name: string; tokens: Record<string, string> } | null = null;
    if (db && resume.owner.themeId != null) {
      const [row] = await db.db.select().from(themes).where(eq(themes.id, resume.owner.themeId)).limit(1);
      if (row) theme = { id: row.id, name: row.name, tokens: row.tokens };
    }
    return c.json({ ok: true, resume: { ...resume, owner: { ...resume.owner, theme } } });
  });

  return r;
}
