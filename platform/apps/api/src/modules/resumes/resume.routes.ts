import { Hono } from "hono";
import { z } from "zod";
import { isPublishable } from "@platform/shared";
import { requireAuth } from "../../middleware/auth.js";
import type { AppVariables } from "../../types.js";
import { createResume, getById, listByUser, removeResume, setPublished, SlugTakenError, updateResume } from "./resume.service.js";

const createSchema = z.object({ title: z.string().max(100).default("未命名简历") });
const updateSchema = z.object({
  title: z.string().max(100).optional(),
  slug: z.string().max(64).optional(),
  data: z.unknown().optional(),
});
const publishSchema = z.object({ isPublic: z.boolean() });

export function createResumeRoutes() {
  const r = new Hono<{ Variables: AppVariables }>();
  r.use("*", requireAuth);

  // 我的简历列表
  r.get("/", async (c) => {
    const user = c.get("user");
    const list = await listByUser(user!.id);
    return c.json({ ok: true, resumes: list });
  });

  // 新建
  r.post("/", async (c) => {
    const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ ok: false, error: "请求格式错误" }, 400);
    const user = c.get("user");
    const resume = await createResume(user!.id, parsed.data.title);
    return c.json({ ok: true, resume }, 201);
  });

  // 单个详情
  r.get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (!id) return c.json({ ok: false, error: "无效 ID" }, 400);
    const user = c.get("user");
    const resume = await getById(id, user!.id);
    if (!resume) return c.json({ ok: false, error: "未找到" }, 404);
    return c.json({ ok: true, resume });
  });

  // 更新（标题/slug/数据）
  r.put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (!id) return c.json({ ok: false, error: "无效 ID" }, 400);
    const parsed = updateSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ ok: false, error: parsed.error.issues[0]?.message ?? "请求格式错误" }, 400);
    const user = c.get("user");
    try {
      const resume = await updateResume(id, user!.id, parsed.data);
      if (!resume) return c.json({ ok: false, error: "未找到" }, 404);
      return c.json({ ok: true, resume });
    } catch (err) {
      if (err instanceof SlugTakenError) return c.json({ ok: false, error: err.message }, 409);
      throw err;
    }
  });

  // 发布 / 下架
  r.post("/:id/publish", async (c) => {
    const id = Number(c.req.param("id"));
    if (!id) return c.json({ ok: false, error: "无效 ID" }, 400);
    const parsed = publishSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ ok: false, error: "请求格式错误" }, 400);
    const user = c.get("user");
    const resume = await getById(id, user!.id);
    if (!resume) return c.json({ ok: false, error: "未找到" }, 404);
    if (parsed.data.isPublic) {
      const check = isPublishable(resume.data);
      if (!check.ok) return c.json({ ok: false, error: check.reason ?? "简历不完整，无法发布" }, 400);
    }
    const updated = await setPublished(id, user!.id, parsed.data.isPublic);
    return c.json({ ok: true, resume: updated });
  });

  // 删除
  r.delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (!id) return c.json({ ok: false, error: "无效 ID" }, 400);
    const user = c.get("user");
    const deleted = await removeResume(id, user!.id);
    if (!deleted) return c.json({ ok: false, error: "未找到" }, 404);
    return c.json({ ok: true });
  });

  return r;
}
