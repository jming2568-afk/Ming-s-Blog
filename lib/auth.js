import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const FALLBACK_SECRET =
  "dev-fallback-secret-change-me-in-production-please-123456789";

const AUTH_SECRET = process.env.AUTH_SECRET || FALLBACK_SECRET;

// 生产环境必须显式配置 AUTH_SECRET：在首次使用时报错，避免构建时就崩（构建时 session/密码 API 不会被调用）
let _checked = false;
function ensureSecret() {
  if (_checked) return;
  _checked = true;
  const isDev = process.env.NODE_ENV !== "production";
  if (AUTH_SECRET === FALLBACK_SECRET) {
    if (isDev) {
      console.warn(
        "[auth] 警告：使用了默认 AUTH_SECRET fallback。生产部署请在构建/运行环境注入环境变量 AUTH_SECRET（可用 `openssl rand -hex 32` 生成）。"
      );
    } else {
      throw new Error(
        "[auth] 生产环境必须显式设置 AUTH_SECRET 环境变量，不能使用内置 fallback。请在构建或部署平台注入后重启。"
      );
    }
  }
}

const encoder = new TextEncoder();
const SESSION_COOKIE = "session";
const TTL_DAYS = 7;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId) {
  ensureSecret();
  const SECRET_KEY = encoder.encode(AUTH_SECRET);
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_DAYS}d`)
    .sign(SECRET_KEY);

  return {
    token,
    cookieOptions: {
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: TTL_DAYS * 24 * 60 * 60,
    },
  };
}

export async function verifySession(token) {
  ensureSecret();
  if (!token) return null;
  const SECRET_KEY = encoder.encode(AUTH_SECRET);
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (!payload || !payload.sub) return null;
    return { userId: Number(payload.sub) };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
