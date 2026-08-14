import { Hono } from "hono";
import { cors } from "hono/cors";
import { loadConfig } from "./config.js";
import { getDb } from "./db/index.js";
import { createAuthRoutes } from "./modules/auth/auth.routes.js";
import { createResumeRoutes } from "./modules/resumes/resume.routes.js";
import { createPublicRoutes } from "./modules/public/public.routes.js";
import { createUserRoutes } from "./modules/users/user.routes.js";
import { createThemeRoutes } from "./modules/themes/theme.routes.js";
import { createMediaRoutes } from "./modules/media/media.routes.js";
import { createExportRoutes } from "./modules/export/export.routes.js";
import { createAiRoutes } from "./modules/ai/ai.routes.js";
import { createAdminRoutes } from "./modules/admin/admin.routes.js";
import { authOptional } from "./middleware/auth.js";
import type { AppVariables } from "./types.js";

/** 统一响应错误结构：{ ok:false, error: string } */
export function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function createApp() {
  const config = loadConfig();
  const app = new Hono<{ Variables: AppVariables }>();

  app.use("*", cors({ origin: config.corsOrigins, credentials: true }));
  app.use("*", async (c, next) => {
    c.set("config", config);
    await next();
  });
  // 可选认证：把当前用户挂到 context
  app.use("*", authOptional);

  // 安全响应头（P5 加固）
  app.use("*", async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("X-XSS-Protection", "0");
    await next();
  });

  // 统一错误处理
  app.onError((err, c) => {
    console.error("[api] 未处理错误:", err);
    return c.json({ ok: false, error: "服务器内部错误" }, 500);
  });

  // ---- 健康检查（P1 验收点）----
  app.get("/api/health", (c) => {
    const db = getDb();
    return c.json({
      ok: true,
      service: "api",
      version: "0.3.0",
      time: new Date().toISOString(),
      db: db ? "configured" : "not-configured",
    });
  });

  // ---- 认证模块（P2）----
  app.route("/api/auth", createAuthRoutes(config));

  // ---- 简历模块（P3）----
  app.route("/api/resumes", createResumeRoutes());

  // ---- 用户资料（P3：主题选择）----
  app.route("/api/users", createUserRoutes());

  // ---- 主题列表（P3）----
  app.route("/api/themes", createThemeRoutes());

  // ---- 公共接口（P3：分享页数据源）----
  app.route("/api/public", createPublicRoutes());

  // ---- 媒体上传（P4）----
  app.route("/api/media", createMediaRoutes());

  // ---- 导出（P4：Word；PDF 走客户端打印，TECH-001）----
  app.route("/api/export", createExportRoutes());

  // ---- AI 能力（P5：写作助手 + 旧简历导入）----
  app.route("/api/ai", createAiRoutes());

  // ---- 管理端（P5：admin 角色）----
  app.route("/api/admin", createAdminRoutes());

  // ---- 404 ----
  app.notFound((c) => jsonError("接口不存在", 404));

  return app;
}
