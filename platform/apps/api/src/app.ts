import { Hono } from "hono";
import { cors } from "hono/cors";
import { loadConfig } from "./config.js";
import { getDb } from "./db/index.js";
import { createAuthRoutes } from "./modules/auth/auth.routes.js";
import { createResumeRoutes } from "./modules/resumes/resume.routes.js";
import { createPublicRoutes } from "./modules/public/public.routes.js";
import { createUserRoutes } from "./modules/users/user.routes.js";
import { createThemeRoutes } from "./modules/themes/theme.routes.js";
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

  // ---- 404 ----
  app.notFound((c) => jsonError("接口不存在", 404));

  return app;
}
