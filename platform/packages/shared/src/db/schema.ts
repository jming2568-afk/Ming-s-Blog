import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/** 用户表 */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    themeId: integer("theme_id"),
    role: text("role").notNull().default("user"), // user | admin
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    usernameIdx: uniqueIndex("users_username_idx").on(t.username),
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

/** 会话表（httpOnly cookie，可撤销） */
export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(t.tokenHash),
    userIdx: index("sessions_user_idx").on(t.userId),
  })
);

/** 简历表（data 为 JSONB 结构化内容，slug 为专属链接） */
export const resumes = pgTable(
  "resumes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    isPublic: boolean("is_public").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("resumes_slug_idx").on(t.slug),
    userIdx: index("resumes_user_idx").on(t.userId),
  })
);

/** 简历历史版本（P4 启用） */
export const resumeVersions = pgTable(
  "resume_versions",
  {
    id: serial("id").primaryKey(),
    resumeId: integer("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    resumeIdx: index("resume_versions_resume_idx").on(t.resumeId),
  })
);

/** 主题表（系统预置 + 用户自定义，tokens 为设计令牌） */
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tokens: jsonb("tokens").$type<Record<string, string>>().notNull().default({}),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 媒体表（TOS 对象登记，P4 启用） */
export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    url: text("url").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("media_user_idx").on(t.userId),
  })
);
