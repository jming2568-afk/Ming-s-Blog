// Database initialization script
// Run once with: node scripts/init-db.js
// Idempotent: safe to run multiple times (only seeds when tables are empty)

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// init-db 明确以项目 ROOT 为基准，但也允许通过 DB_PATH/UPLOAD_DIR 覆盖，保持与 lib/db.js 一致。
const DEFAULT_DB_PATH = path.join(ROOT, "data", "portfolio.db");
const DEFAULT_UPLOAD_DIR = path.join(ROOT, "public", "uploads");
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;
const UPLOAD_DIR = process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR;

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Read default projects (esm import with JSON hack via dynamic import of .js file)
const { projects } = await import("../data/projects.js");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("🔧 Creating tables...");
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
`);
console.log("✅ Tables ready.");

// Seed default admin user（支持从环境变量 INIT_ADMIN_USERNAME / INIT_ADMIN_PASSWORD 覆盖；留空回退到 useradmin/useradmin123）
const DEFAULT_INIT_USERNAME = "useradmin";
const DEFAULT_INIT_PASSWORD = "useradmin123";
const initUsername =
  (process.env.INIT_ADMIN_USERNAME || "").trim() || DEFAULT_INIT_USERNAME;
const initPassword =
  (process.env.INIT_ADMIN_PASSWORD || "").trim() || DEFAULT_INIT_PASSWORD;

const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
if (userCount === 0) {
  if (initPassword.length < 6 || initPassword.length > 72) {
    console.error(
      `❌ INIT_ADMIN_PASSWORD 长度必须在 6-72 位之间（当前 ${initPassword.length} 位），初始化已终止。`
    );
    process.exit(1);
  }
  const hash = bcrypt.hashSync(initPassword, 10);
  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
    initUsername,
    hash
  );
  console.log(
    `👤 Created default admin user: ${initUsername} / ${
      process.env.INIT_ADMIN_PASSWORD ? "***(来自 INIT_ADMIN_PASSWORD)***" : initPassword
    }`
  );
} else {
  // 迁移：如果旧环境里存在 admin/admin123，保留 useradmin；也不再额外插 admin。
  console.log(`👤 Users table has ${userCount} user(s), skipping admin seed.`);
}

// Seed default projects
const projCount = db.prepare("SELECT COUNT(*) AS c FROM projects").get().c;
if (projCount === 0) {
  const insert = db.prepare(`
    INSERT INTO projects
      (slug, title, category, role, tagline, episodes, team, result, tags, featured)
    VALUES
      (@slug, @title, @category, @role, @tagline, @episodes, @team, @result, @tags, @featured)
  `);
  const tx = db.transaction((list) => {
    for (const p of list) {
      insert.run({
        slug: p.slug,
        title: p.title,
        category: p.category,
        role: p.role ?? null,
        tagline: p.tagline ?? null,
        episodes: p.episodes ?? null,
        team: p.team ?? null,
        result: p.result ?? null,
        tags: JSON.stringify(p.tags ?? []),
        featured: p.featured ? 1 : 0,
      });
    }
  });
  tx(projects);
  console.log(`📦 Seeded ${projects.length} default projects.`);
} else {
  console.log(
    `📦 Projects table has ${projCount} record(s), skipping default seed.`
  );
}

console.log("\n🎉 Database initialization complete!");
console.log(`DB path: ${DB_PATH}`);
