import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users, themes } from "@platform/shared/db/schema";
import { requireAuth } from "../../middleware/auth.js";
import type { AppVariables } from "../../types.js";
import { getDb } from "../../db/index.js";

const updateMeSchema = z.object({
  themeId: z.number().nullable().optional(),
  displayName: z.string().max(50).optional(),
});

/** 用户自身资料（主题选择等） */
export function createUserRoutes() {
  const r = new Hono<{ Variables: AppVariables }>();
  r.use("*", requireAuth);

  r.get("/me", async (c) => {
    return c.json({ ok: true, user: c.get("user") });
  });

  r.put("/me", async (c) => {
    const parsed = updateMeSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ ok: false, error: parsed.error.issues[0]?.message ?? "请求格式错误" }, 400);
    const user = c.get("user");
    const db = getDb();
    if (!db) throw new Error("数据库未配置（DATABASE_URL）");

    const values: Partial<typeof users.$inferInsert> = {};
    if (parsed.data.themeId !== undefined && parsed.data.themeId !== null) {
      const theme = await db.db.select({ id: themes.id }).from(themes).where(eq(themes.id, parsed.data.themeId)).limit(1);
      if (theme.length === 0) return c.json({ ok: false, error: "主题不存在" }, 400);
      values.themeId = parsed.data.themeId;
    } else if (parsed.data.themeId === null) {
      values.themeId = null;
    }
    if (parsed.data.displayName !== undefined) values.displayName = parsed.data.displayName;

    const [row] = await db.db.update(users).set(values).where(eq(users.id, user!.id)).returning();
    return c.json({ ok: true, user: row });
  });

  return r;
}
