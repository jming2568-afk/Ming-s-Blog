import type { Context, Next } from "hono";
import { getSessionUser } from "../modules/auth/auth.service.js";

/** 从 cookie 读取会话 token（与 auth.routes 的 SESSION_COOKIE 一致） */
export function readSessionToken(c: Context): string | undefined {
  const header = c.req.header("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "sid") return rest.join("=");
  }
  return undefined;
}

/** 认证中间件：把当前用户挂到 context（c.get("user")），未登录可继续但 user 为 null */
export async function authOptional(c: Context, next: Next): Promise<void> {
  const token = readSessionToken(c);
  const user = await getSessionUser(token);
  c.set("user", user);
  await next();
}

/** 认证守卫：未登录直接 401 */
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const token = readSessionToken(c);
  const user = await getSessionUser(token);
  if (!user) return c.json({ ok: false, error: "请先登录" }, 401);
  c.set("user", user);
  await next();
}
