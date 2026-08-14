import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { users, resumes } from "@platform/shared/db/schema";
import { requireAuth } from "../../middleware/auth.js";
import type { AppVariables } from "../../types.js";
import { getDb } from "../../db/index.js";

/** 管理端：仅 admin 角色可访问（P5 最小实现） */
export function createAdminRoutes() {
  const r = new Hono<{ Variables: AppVariables }>();
  r.use("*", requireAuth);

  // 角色守卫
  r.use("*", async (c, next) => {
    if (c.get("user")!.role !== "admin") {
      return c.json({ ok: false, error: "无权限" }, 403);
    }
    await next();
  });

  // 用户列表（含简历数）
  r.get("/users", async (c) => {
    const db = getDb();
    if (!db) throw new Error("数据库未配置（SQLITE_PATH）");
    const rows = await db.db.select().from(users).orderBy(desc(users.createdAt)).limit(200);
    const resumeCounts = await db.db
      .select({ userId: resumes.userId, count: resumes.id })
      .from(resumes)
      .groupBy(resumes.userId);
    const countMap = new Map<number, number>();
    for (const row of resumeCounts) {
      countMap.set(row.userId, (countMap.get(row.userId) ?? 0) + 1);
    }
    return c.json({
      ok: true,
      users: rows.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        themeId: u.themeId,
        createdAt: u.createdAt,
        resumeCount: countMap.get(u.id) ?? 0,
      })),
    });
  });

  // 用户列表 + 按用户查简历（可选，P5 最小）
  r.get("/users/:id/resumes", async (c) => {
    const id = Number(c.req.param("id"));
    if (!id) return c.json({ ok: false, error: "无效 ID" }, 400);
    const db = getDb();
    if (!db) throw new Error("数据库未配置（SQLITE_PATH）");
    const rows = await db.db
      .select({ id: resumes.id, title: resumes.title, slug: resumes.slug, isPublic: resumes.isPublic, updatedAt: resumes.updatedAt })
      .from(resumes)
      .where(eq(resumes.userId, id))
      .orderBy(desc(resumes.updatedAt));
    return c.json({ ok: true, resumes: rows });
  });

  return r;
}
