import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { profile as defaultProfile } from "../data/profile.js";
import { resumeVersions as defaultResume } from "../data/resume.js";

const DB_PATH = path.join(process.cwd(), "data", "portfolio.db");

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export default db;

export function ensureTables() {
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

// 运行时 seed：幂等，只在缺失时插入；旧 admin/admin123 保留（不破坏既有环境）
export function ensureDefaultUsers() {
  const defaults = [
    { username: "useradmin", password: "useradmin123" },
  ];
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

// 运行时 seed：站点设置单行（id=1），缺失时用静态默认值初始化（幂等）
export function ensureSiteSettings() {
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
