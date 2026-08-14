import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import type { AppVariables } from "../../types.js";
import { RateLimiter } from "../auth/rate-limit.js";
import { getLlmConfig } from "../config/config.service.js";
import { importResume, polishResumeText } from "./ai.service.js";

const polishSchema = z.object({
  kind: z.enum(["summary", "experience", "project", "skill"]),
  text: z.string().min(1).max(4000),
  jd: z.string().max(4000).optional(),
});

/** AI 接口限流：每用户每分钟（LLM 成本保护） */
const aiLimiter = new RateLimiter(10, 60_000);
setInterval(() => aiLimiter.sweep(), 60_000).unref();

export function createAiRoutes() {
  const r = new Hono<{ Variables: AppVariables }>();
  r.use("*", requireAuth);

  // AI 写作助手（F-A5）
  r.post("/polish", async (c) => {
    if (!aiLimiter.allow(`ai:${c.get("user")!.id}`)) {
      return c.json({ ok: false, error: "操作过于频繁，请稍后再试" }, 429);
    }
    const config = await getLlmConfig();
    if (!config) return c.json({ ok: false, error: "LLM 未配置（LLM_API_KEY/ARK_API_KEY），AI 能力不可用" }, 503);

    const parsed = polishSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ ok: false, error: parsed.error.issues[0]?.message ?? "请求格式错误" }, 400);

    try {
      const result = await polishResumeText(config, parsed.data);
      return c.json({ ok: true, ...result });
    } catch (err) {
      console.error("[ai] polish 失败:", (err as Error).message);
      return c.json({ ok: false, error: "AI 润色失败，请稍后再试" }, 502);
    }
  });

  // 旧简历导入（F-A6）：图片 OCR / PDF / docx → 结构化草稿
  r.post("/import", async (c) => {
    if (!aiLimiter.allow(`ai:${c.get("user")!.id}`)) {
      return c.json({ ok: false, error: "操作过于频繁，请稍后再试" }, 429);
    }

    const form = await c.req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return c.json({ ok: false, error: "缺少文件字段 file" }, 400);
    if (file.size > 10 * 1024 * 1024) return c.json({ ok: false, error: "文件过大（最大 10MB）" }, 400);
    const allowed =
      file.type.startsWith("image/") ||
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx");
    if (!allowed) return c.json({ ok: false, error: "仅支持图片（jpg/png/webp）、PDF 或 Word（docx）" }, 400);

    const config = await getLlmConfig();
    if (!config) return c.json({ ok: false, error: "LLM 未配置（LLM_API_KEY/ARK_API_KEY），AI 能力不可用" }, 503);

    try {
      const result = await importResume(config, {
        mime: file.type,
        fileName: file.name,
        buffer: Buffer.from(await file.arrayBuffer()),
      });
      return c.json({ ok: true, ...result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "导入失败";
      console.error("[ai] import 失败:", msg);
      return c.json({ ok: false, error: msg.includes("仅支持") || msg.includes("PDF") || msg.includes("Word") ? msg : "AI 导入失败，请稍后再试" }, 400);
    }
  });

  return r;
}
