// 管理员登录：ADMIN_PASSWORD 校验 + AUTH_SECRET 签名 cookie（HMAC-SHA256，零依赖）
//
// 安全守卫（与你之前遇到的报错同一规则）：
//   - 生产环境必须显式设置 AUTH_SECRET / ADMIN_PASSWORD，否则拒绝工作（抛错）
//   - 本地开发可用内置 fallback / 默认密码，仅限调试

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 天

function isProd() {
  return process.env.NODE_ENV === "production";
}

export function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (isProd()) {
    throw new Error(
      "[auth] 生产环境必须显式设置 AUTH_SECRET 环境变量，不能使用内置 fallback。请在构建或部署平台注入后重启。"
    );
  }
  console.warn("[auth] 警告：开发环境使用内置 fallback 密钥，仅限本地调试。");
  return "dev-fallback-secret-change-me-in-production";
}

export function getAdminPassword() {
  const pw = process.env.ADMIN_PASSWORD;
  if (pw) return pw;
  if (isProd()) {
    throw new Error(
      "[auth] 生产环境必须显式设置 ADMIN_PASSWORD 环境变量（管理员登录密码）。请在构建或部署平台注入后重启。"
    );
  }
  console.warn("[auth] 警告：开发环境使用默认管理员密码 admin123，仅限本地调试。");
  return "admin123";
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload) {
  const secret = getSecret();
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function createSessionToken() {
  const now = Math.floor(Date.now() / 1000);
  return sign({ role: "admin", iat: now, exp: now + MAX_AGE });
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, sig] = parts;
  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  let sigBuf;
  let expBuf;
  try {
    sigBuf = Buffer.from(sig, "base64url");
    expBuf = Buffer.from(expected, "base64url");
  } catch {
    return false;
  }
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.role !== "admin") return false;
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function isAuthed() {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
