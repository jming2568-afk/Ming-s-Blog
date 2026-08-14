import { Hono } from "hono";
import { themes } from "@platform/shared/db/schema";
import { getDb } from "../../db/index.js";

/** 主题列表（无需登录；编辑器与 Landing 共用） */
export function createThemeRoutes() {
  const r = new Hono();

  r.get("/", async (c) => {
    const db = getDb();
    if (!db) return c.json({ ok: true, themes: [] });
    const rows = await db.db.select().from(themes).orderBy(themes.id);
    return c.json({
      ok: true,
      themes: rows.map((t) => ({ id: t.id, name: t.name, tokens: t.tokens, isSystem: t.isSystem })),
    });
  });

  return r;
}
