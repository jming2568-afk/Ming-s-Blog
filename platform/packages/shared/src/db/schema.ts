import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

/**
 * 数据模型（TECH-001：PostgreSQL → SQLite，Drizzle ORM 保留）。
 * 字段名/表名/业务语义与 PG 版完全一致，仅方言变化：
 *   serial → integer autoIncrement；jsonb → text(mode:json)；timestamp → integer(mode:timestamp_ms)
 *  ⚠️ 时间戳统一用 timestamp_ms（毫秒）：drizzle-kit 的 defaultNow() 生成毫秒默认值，
 *     mode:"timestamp"(秒) 会与 DB 默认值单位不一致，导致日期显示为 58589 年。见 OPS-001 部署记录。
 */

/** 用户表 */
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    themeId: integer("theme_id"),
    role: text("role").notNull().default("user"), // user | admin
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
  },
  (t) => ({
    usernameIdx: uniqueIndex("users_username_idx").on(t.username),
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

/** 会话表（httpOnly cookie，可撤销） */
export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(t.tokenHash),
    userIdx: index("sessions_user_idx").on(t.userId),
  })
);

/** 简历表（data 为 JSON 结构化内容，slug 为专属链接） */
export const resumes = sqliteTable(
  "resumes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("resumes_slug_idx").on(t.slug),
    userIdx: index("resumes_user_idx").on(t.userId),
  })
);

/** 简历历史版本（P4 启用） */
export const resumeVersions = sqliteTable(
  "resume_versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    resumeId: integer("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
  },
  (t) => ({
    resumeIdx: index("resume_versions_resume_idx").on(t.resumeId),
  })
);

/** 主题表（系统预置 + 用户自定义，tokens 为设计令牌） */
export const themes = sqliteTable("themes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tokens: text("tokens", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
});

/** 媒体表（OSS 对象登记，P4 启用） */
export const media = sqliteTable(
  "media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    url: text("url").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("media_user_idx").on(t.userId),
  })
);

/** 平台配置表（配置中心：全量入库 + 敏感值 AES-GCM 加密，见 docs/03-tech） */
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().defaultNow(),
});
