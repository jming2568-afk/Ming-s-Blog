import { and, desc, eq } from "drizzle-orm";
import { resumes, users } from "@platform/shared/db/schema";
import { parseResumeData, slugify, type ResumeData } from "@platform/shared";
import { getDb } from "../../db/index.js";

export interface ResumeRow {
  id: number;
  userId: number;
  title: string;
  slug: string;
  data: ResumeData;
  isPublic: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function toResumeRow(r: typeof resumes.$inferSelect): ResumeRow {
  return {
    id: r.id,
    userId: r.userId,
    title: r.title,
    slug: r.slug,
    data: parseResumeData(r.data),
    isPublic: r.isPublic,
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("数据库未配置（DATABASE_URL）");
  return db;
}

/** 生成唯一 slug：基于标题拼音/中文，冲突时追加 -2/-3… */
export async function uniqueSlug(base: string): Promise<string> {
  const db = requireDb();
  const slugBase = slugify(base) || "resume";
  for (let i = 1; ; i += 1) {
    const candidate = i === 1 ? slugBase : `${slugBase}-${i}`;
    const rows = await db.db.select({ id: resumes.id }).from(resumes).where(eq(resumes.slug, candidate)).limit(1);
    if (rows.length === 0) return candidate;
  }
}

export async function listByUser(userId: number): Promise<ResumeRow[]> {
  const db = requireDb();
  const rows = await db.db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.updatedAt));
  return rows.map(toResumeRow);
}

export async function getById(id: number, userId: number): Promise<ResumeRow | null> {
  const db = requireDb();
  const [row] = await db.db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1);
  return row ? toResumeRow(row) : null;
}

export async function createResume(userId: number, title: string): Promise<ResumeRow> {
  const db = requireDb();
  const slug = await uniqueSlug(title);
  const [row] = await db.db
    .insert(resumes)
    .values({ userId, title: title || "未命名简历", slug, data: {} })
    .returning();
  if (!row) throw new Error("创建简历失败");
  return toResumeRow(row);
}

export async function updateResume(
  id: number,
  userId: number,
  patch: { title?: string; slug?: string; data?: unknown }
): Promise<ResumeRow | null> {
  const db = requireDb();
  const existing = await getById(id, userId);
  if (!existing) return null;

  const values: Partial<typeof resumes.$inferInsert> = { updatedAt: new Date() };
  if (patch.title !== undefined) values.title = patch.title;
  if (patch.data !== undefined) values.data = parseResumeData(patch.data);
  if (patch.slug !== undefined) {
    const newSlug = slugify(patch.slug) || existing.slug;
    if (newSlug !== existing.slug) {
      const taken = await db.db.select({ id: resumes.id }).from(resumes).where(eq(resumes.slug, newSlug)).limit(1);
      if (taken.length > 0) throw new SlugTakenError();
      values.slug = newSlug;
    }
  }

  const [row] = await db.db.update(resumes).set(values).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).returning();
  if (!row) return null;
  return toResumeRow(row);
}

export async function setPublished(id: number, userId: number, isPublic: boolean): Promise<ResumeRow | null> {
  const db = requireDb();
  const existing = await getById(id, userId);
  if (!existing) return null;
  const [row] = await db.db
    .update(resumes)
    .set({
      isPublic,
      publishedAt: isPublic && !existing.publishedAt ? new Date() : existing.publishedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .returning();
  return row ? toResumeRow(row) : null;
}

export async function removeResume(id: number, userId: number): Promise<boolean> {
  const db = requireDb();
  const result = await db.db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .returning({ id: resumes.id });
  return result.length > 0;
}

export interface PublicResume {
  slug: string;
  title: string;
  data: ResumeData;
  updatedAt: Date;
  owner: { displayName: string; themeId: number | null };
}

/** 公共接口：仅已发布简历 */
export async function getPublicBySlug(slug: string): Promise<PublicResume | null> {
  const db = requireDb();
  const [row] = await db.db
    .select({ resume: resumes, user: users })
    .from(resumes)
    .innerJoin(users, eq(resumes.userId, users.id))
    .where(and(eq(resumes.slug, slug), eq(resumes.isPublic, true)))
    .limit(1);
  if (!row) return null;
  return {
    slug: row.resume.slug,
    title: row.resume.title,
    data: parseResumeData(row.resume.data),
    updatedAt: row.resume.updatedAt,
    owner: { displayName: row.user.displayName ?? row.user.username, themeId: row.user.themeId },
  };
}

export class SlugTakenError extends Error {
  constructor() {
    super("slug 已被占用");
    this.name = "SlugTakenError";
  }
}
