import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import type { AppVariables } from "../../types.js";
import { RateLimiter } from "../auth/rate-limit.js";
import { getLlmConfig, getStorageConfig, listConfigForAdmin, updateConfigEntries } from "./config.service.js";
import { getMasterKey } from "./crypto.js";
import { chat, lastProtocol } from "../ai/llm.js";
import { createS3Storage } from "@platform/shared";

const updateSchema = z.object({
  config: z.array(z.object({ key: z.string(), value: z.string() })).max(50),
});

/** 管理端限流 */
const configLimiter = new RateLimiter(30, 60_000);
setInterval(() => configLimiter.sweep(), 60_000).unref();

/** 平台配置中心（P5.5）：读取 / 保存 / LLM 测试 / 存储测试，仅 admin */
export function createConfigRoutes() {
  const r = new Hono<{ Variables: AppVariables }>();
  r.use("*", requireAuth);

  r.use("*", async (c, next) => {
    if (c.get("user")!.role !== "admin") return c.json({ ok: false, error: "无权限" }, 403);
    if (!configLimiter.allow(`config:${c.get("user")!.id}`)) {
      return c.json({ ok: false, error: "操作过于频繁，请稍后再试" }, 429);
    }
    await next();
  });

  // 读取（密钥打码 + 来源标注）
  r.get("/", async (c) => {
    const config = await listConfigForAdmin();
    return c.json({ ok: true, masterKeyOk: getMasterKey() !== null, config });
  });

  // 保存（upsert；空值删除回退 env）
  r.put("/", async (c) => {
    const parsed = updateSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ ok: false, error: parsed.error.issues[0]?.message ?? "请求格式错误" }, 400);
    try {
      await updateConfigEntries(parsed.data.config);
      return c.json({ ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "保存失败";
      return c.json({ ok: false, error: msg }, msg.includes("不允许") || msg.includes("master") ? 400 : 500);
    }
  });

  // LLM 测试：用当前合并配置发极短提示
  r.post("/test-llm", async (c) => {
    const llm = await getLlmConfig();
    if (!llm) return c.json({ ok: false, error: "LLM 未配置（LLM_API_KEY 或 ARK_API_KEY 为空）" }, 400);
    const start = Date.now();
    try {
      const reply = await chat(llm, [{ role: "user", content: "请只回复：ok" }], { temperature: 0, maxTokens: 8 });
      const protocol: string = lastProtocol() ?? "unknown";
      return c.json({
        ok: true,
        latencyMs: Date.now() - start,
        protocol,
        model: llm.textModel,
        reply: reply.slice(0, 50),
      });
    } catch (err) {
      return c.json({ ok: false, error: `LLM 测试失败: ${(err as Error).message}`, latencyMs: Date.now() - start }, 502);
    }
  });

  // 存储测试：写删探针
  r.post("/test-storage", async (c) => {
    const storageConfig = await getStorageConfig();
    if (!storageConfig) {
      return c.json({ ok: false, error: "存储未配置（STORAGE_ENDPOINT/AK/SK/BUCKET 不完整）" }, 400);
    }
    const start = Date.now();
    const storage = createS3Storage(storageConfig);
    const probeKey = `config-probe-${Date.now()}.txt`;
    try {
      await storage.ensureBucket?.();
      await storage.put(probeKey, Buffer.from("probe"), { contentType: "text/plain" });
      await storage.delete(probeKey);
      return c.json({
        ok: true,
        latencyMs: Date.now() - start,
        endpoint: storageConfig.endpoint,
        bucket: storageConfig.bucket,
        pathStyle: storageConfig.pathStyle ?? false,
      });
    } catch (err) {
      return c.json({ ok: false, error: `存储测试失败: ${(err as Error).message}`, latencyMs: Date.now() - start }, 502);
    }
  });

  return r;
}
