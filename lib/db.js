import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { profile as defaultProfile } from "../data/profile.js";
import { resumeVersions as defaultResume } from "../data/resume.js";

// ============== 路径与单例 ==============
const DEFAULT_DB_DIR = path.join(process.cwd(), "data");
const DEFAULT_DB_PATH = path.join(DEFAULT_DB_DIR, "portfolio.db");

const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

let _db = null;
let _ensured = false;

// ============== 错误提示封装 ==============
function buildInitError(err) {
  const msg = err?.message || String(err);
  const hints = [];
  if (/Cannot find module|Missing native|better-sqlite3/i.test(msg)) {
    hints.push(
      "better-sqlite3 原生绑定缺失，请在部署/运行机器执行 `npm rebuild better-sqlite3`（构建/运行架构不一致时常发生）。"
    );
  }
  if (/permission denied|EACCES|EROFS|read-only/i.test(msg)) {
    hints.push(
      "数据库路径无写权限。若部署到 Vercel/Netlify 等 Serverless 环境，本地磁盘不可写，请改用 Turso/Postgres 等远端数据库，或通过 DB_PATH 指向可持久化卷。"
    );
  }
  if (/no such directory|ENOENT/i.test(msg)) {
    hints.push(`数据目录不存在，当前 DB_PATH=${DB_PATH}，请确认父目录已创建且可写。`);
  }
  hints.push(`当前 DB_PATH = ${DB_PATH}`);
  const err2 = new Error(`[db] 初始化失败：${msg}\n  - ${hints.join("\n  - ")}`);
  err2.cause = err;
  return err2;
}

// ============== 核心导出：getDb（懒加载） ==============
export default function getDb() {
  if (_db) return _db;
  try {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    // 延迟 import，避免模块加载阶段就触发原生绑定解析，利于 next build
    // eslint-disable-next-line global-require
    const Database = require("better-sqlite3");
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  } catch (err) {
    _db = null;
    throw buildInitError(err);
  }
  return _db;
}

// 允许外部显式拿到当前已解析的 DB_PATH（供日志/调试用）
export function getDbPath() {
  return DB_PATH;
}

// ============== 建表与幂等 seed ==============
export function ensureTables() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'manga',
      role TEXT,
      tagline TEXT,
      episodes TEXT,
      team TEXT,
      result TEXT,
      tags TEXT DEFAULT '[]',
      featured INTEGER NOT NULL DEFAULT 0,
      media_url TEXT,
      media_type TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS login_failures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      ip TEXT DEFAULT '',
      failed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_login_failures_username_failed_at ON login_failures(username, failed_at);

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      display_name TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      cert_photo_url TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      github TEXT NOT NULL DEFAULT '',
      github_url TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      wechat_id TEXT NOT NULL DEFAULT '',
      wechat_qr_url TEXT NOT NULL DEFAULT '',
      bio_short TEXT NOT NULL DEFAULT '',
      bio_long TEXT NOT NULL DEFAULT '',
      titles_json TEXT NOT NULL DEFAULT '[]',
      resume_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);
}

export function ensureDefaultUsers() {
  const db = getDb();
  const defaults = [{ username: "useradmin", password: "useradmin123" }];
  for (const u of defaults) {
    const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(u.username);
    if (!exists) {
      const hash = bcrypt.hashSync(u.password, 10);
      db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
        u.username,
        hash
      );
      console.log(`[db] created default user: ${u.username}`);
    }
  }
}

export function ensureSiteSettings() {
  const db = getDb();
  const row = db.prepare("SELECT id FROM site_settings WHERE id = 1").get();
  if (row) return;
  db.prepare(
    `INSERT INTO site_settings (
      id, display_name, avatar_url, cert_photo_url, email, github, github_url,
      location, wechat_id, wechat_qr_url, bio_short, bio_long, titles_json, resume_json, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`
  ).run(
    defaultProfile.name || "",
    defaultProfile.avatar || "",
    "",
    defaultProfile.email || "",
    defaultProfile.github || "",
    defaultProfile.githubUrl || "",
    defaultProfile.location || "",
    defaultProfile.wechatId || "",
    defaultProfile.wechatQrUrl || "",
    defaultProfile.bioShort || "",
    defaultProfile.bioLong || "",
    JSON.stringify(defaultProfile.titles || []),
    JSON.stringify(defaultResume)
  );
  console.log("[db] seeded site_settings defaults");
}

// 幂等的一次性初始化：handler 入口处调用
export function ensureDb() {
  if (_ensured) return;
  try {
    ensureTables();
    ensureDefaultUsers();
    ensureSiteSettings();
    _ensured = true;
  } catch (err) {
    // ensureTables 内部已调用 getDb，错误信息已被 buildInitError 增强过
    throw buildInitError(err);
  }
}
