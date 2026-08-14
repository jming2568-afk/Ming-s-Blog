import { Hono } from "hono";
import type { Context } from "hono";
import { loginSchema, registerSchema } from "@platform/shared";
import { AuthError, createSession, destroySession, getSessionUser, registerUser, syncRoleIfAdmin, verifyCredentials } from "./auth.service.js";
import { RateLimiter } from "./rate-limit.js";

export const SESSION_COOKIE = "sid";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 注册/登录限流：每 IP 每分钟 */
const registerLimiter = new RateLimiter(10, 60_000);
const loginLimiter = new RateLimiter(20, 60_000);
// 定期清理
setInterval(() => {
  registerLimiter.sweep();
  loginLimiter.sweep();
}, 60_000).unref();

function clientIp(c: Context): string {
  const env = (c.env ?? {}) as {
    incoming?: { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
  };
  const forwarded = env.incoming?.headers?.["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return first?.split(",")[0]?.trim() || env.incoming?.socket?.remoteAddress || "unknown";
}

function cookieOptions(nodeEnv: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: nodeEnv === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function createAuthRoutes(config: { nodeEnv: string }) {
  const auth = new Hono<{ Variables: { ip: string } }>();

  auth.use("*", async (c, next) => {
    c.set("ip", clientIp(c));
    await next();
  });

  // 注册
  auth.post("/register", async (c) => {
    if (!registerLimiter.allow(`register:${c.get("ip")}`)) {
      return c.json({ ok: false, error: "注册过于频繁，请稍后再试" }, 429);
    }
    const parsed = registerSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.issues[0]?.message ?? "请求格式错误" }, 400);
    }
    try {
      const rawUser = await registerUser(parsed.data);
      const user = await syncRoleIfAdmin(rawUser);
      const token = await createSession(user.id);
      c.header("set-cookie", buildCookie(token, config.nodeEnv));
      return c.json({ ok: true, user }, 201);
    } catch (err) {
      if (err instanceof AuthError) return c.json({ ok: false, error: err.message }, 409);
      throw err;
    }
  });

  // 登录
  auth.post("/login", async (c) => {
    if (!loginLimiter.allow(`login:${c.get("ip")}`)) {
      return c.json({ ok: false, error: "尝试过于频繁，请稍后再试" }, 429);
    }
    const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.issues[0]?.message ?? "请求格式错误" }, 400);
    }
    try {
      const rawUser = await verifyCredentials(parsed.data.username, parsed.data.password);
      const user = await syncRoleIfAdmin(rawUser);
      const token = await createSession(user.id);
      c.header("set-cookie", buildCookie(token, config.nodeEnv));
      return c.json({ ok: true, user });
    } catch (err) {
      if (err instanceof AuthError) return c.json({ ok: false, error: err.message }, 401);
      throw err;
    }
  });

  // 登出
  auth.post("/logout", async (c) => {
    const token = readCookie(c.req.header("cookie"));
    await destroySession(token);
    c.header(
      "set-cookie",
      `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${config.nodeEnv === "production" ? "; Secure" : ""}`
    );
    return c.json({ ok: true });
  });

  // 当前用户
  auth.get("/me", async (c) => {
    const token = readCookie(c.req.header("cookie"));
    const user = await getSessionUser(token);
    if (!user) return c.json({ ok: false, error: "未登录" }, 401);
    return c.json({ ok: true, user });
  });

  return auth;
}

function buildCookie(token: string, nodeEnv: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${SESSION_TTL_MS / 1000}`,
    "SameSite=Lax",
  ];
  if (nodeEnv === "production") parts.push("Secure");
  return parts.join("; ");
}

function readCookie(header: string | undefined): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=");
  }
  return undefined;
}
