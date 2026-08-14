import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { sessions, users } from "@platform/shared/db/schema";
import { getDb } from "../../db/index.js";
import { getAdminUsernames } from "../config/config.service.js";
import { hashPassword, verifyPassword } from "./password.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  themeId: number | null;
  role: string;
}

function toPublicUser(u: typeof users.$inferSelect): PublicUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    themeId: u.themeId,
    role: u.role,
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** 注册：返回 PublicUser；用户名/邮箱已存在时抛特定错误 */
export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  const db = getDb();
  if (!db) throw new Error("数据库未配置（DATABASE_URL）");

  const existing = await db.db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, input.username))
    .limit(1);
  if (existing.length > 0) throw new AuthError("用户名已被占用", "USERNAME_TAKEN");

  const emailExists = await db.db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (emailExists.length > 0) throw new AuthError("邮箱已被注册", "EMAIL_TAKEN");

  const passwordHash = await hashPassword(input.password);
  const [row] = await db.db
    .insert(users)
    .values({
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.username,
      themeId: 1, // 默认主题：memphis（seed 保证 id=1 存在）
    })
    .returning();
  if (!row) throw new Error("注册失败：未返回用户记录");
  return toPublicUser(row);
}

/** 登录校验：返回 PublicUser；凭据错误抛 AuthError */
export async function verifyCredentials(username: string, password: string): Promise<PublicUser> {
  const db = getDb();
  if (!db) throw new Error("数据库未配置（DATABASE_URL）");

  const [row] = await db.db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (!row) throw new AuthError("用户名或密码错误", "INVALID_CREDENTIALS");
  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) throw new AuthError("用户名或密码错误", "INVALID_CREDENTIALS");
  return toPublicUser(row);
}

/** 创建会话，返回明文 token（只存哈希） */
export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  if (!db) throw new Error("数据库未配置（DATABASE_URL）");

  const token = randomBytes(32).toString("hex");
  await db.db.insert(sessions).values({
    userId,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

/** 按 token 取当前用户；无效/过期返回 null */
export async function getSessionUser(token: string | undefined): Promise<PublicUser | null> {
  if (!token) return null;
  const db = getDb();
  if (!db) return null;

  const [row] = await db.db
    .select({ user: users, sessionExpiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ? toPublicUser(row.user) : null;
}

/** 销毁会话（登出） */
export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = getDb();
  if (!db) return;
  await db.db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
}

export class AuthError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

/** 管理员角色同步：ADMIN_USERNAMES（配置中心 DB > env）中的用户自动提升为 admin（P5） */
export async function syncRoleIfAdmin(user: PublicUser): Promise<PublicUser> {
  const admins = await getAdminUsernames();
  if (!admins.includes(user.username) || user.role === "admin") return user;
  const db = getDb();
  if (!db) return user;
  const [row] = await db.db.update(users).set({ role: "admin" }).where(eq(users.id, user.id)).returning();
  return row ? toPublicUser(row) : user;
}
