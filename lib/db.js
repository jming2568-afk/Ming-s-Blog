import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { profile as defaultProfile } from "../data/profile.js";
import { resumeVersions as defaultResume } from "../data/resume.js";

// ============== 路径与单例 ==============
// 默认路径策略：
//   1) 显式环境变量 DB_PATH：最高优先级。
//   2) 若检测到 Vercel/Lambda/Serverless 典型环境（VERCEL/AWS_LAMBDA_FUNCTION_NAME/VERCEL_URL），
//      或 cwd=/var/task、或 VERCEL_DEPLOYMENT_ID 存在：强制走 /tmp，避免只读任务目录。
//   3) 否则优先从 __dirname 向上定位项目根（有 package.json 且含 next 依赖的目录），写到 <root>/data。
//      这样不再依赖 TRAE_ENV_WORKSPACE env var，Vercel 打包后依然能推导项目根。
//   4) 最后回退到 process.cwd()/data，若不可写再降级到 /tmp/<project>/data。
// Vercel 约定：Serverless Function 只有 /tmp 可写，且实例间不共享；该临时数据库仅用于 Preview/演示。
function detectProjectRoot() {
  let cur = path.dirname(new URL(import.meta.url).pathname); // lib/db.js → lib
  // URL pathname 在 Windows 上的异常不需要担心，这里只跑 Linux
  for (let i = 0; i < 8; i++) {
    try {
      const pj = path.join(cur, "package.json");
      if (fs.existsSync(pj)) {
        const txt = fs.readFileSync(pj, "utf8");
        if (/"next"\s*:/.test(txt)) return cur;
      }
    } catch {}
    const up = path.dirname(cur);
    if (up === cur) break;
    cur = up;
  }
  return null;
}
function looksLikeVercelServerless() {
  return Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.VERCEL_URL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT
  );
}
function computeDefaultDbPath() {
  const tmpSlug =
    (process.env.npm_package_name || process.env.VERCEL_GIT_REPO_SLUG || "portfolio")
      .replace(/[^a-zA-Z0-9_-]/g, "_") || "portfolio";

  if (looksLikeVercelServerless()) {
    // Vercel Serverless Function 仅 /tmp 可写
    return path.join("/tmp", tmpSlug, "data", "portfolio.db");
  }

  // 如果 cwd 明确是 /var/task（非 Vercel 环境变量被设置，但仍然运行在 Lambda-like 任务目录），也直接用 /tmp
  const cwd = process.cwd();
  if (cwd === "/var/task" || path.resolve(cwd).startsWith("/var/task")) {
    return path.join("/tmp", tmpSlug, "data", "portfolio.db");
  }

  // 从 lib/db.js 向上定位项目根（稳定，不随 cwd 漂移）
  const root = detectProjectRoot();
  if (root) {
    const candidate = path.join(root, "data", "portfolio.db");
    const dataDir = path.dirname(candidate);
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      if (isDirWritable(dataDir)) return candidate;
    } catch {}
  }

  // 回退：cwd/data
  const cwdCandidate = path.join(cwd, "data", "portfolio.db");
  try {
    fs.mkdirSync(path.dirname(cwdCandidate), { recursive: true });
    if (isDirWritable(path.dirname(cwdCandidate))) return cwdCandidate;
  } catch {}

  // 最终兜底 /tmp
  return path.join("/tmp", tmpSlug, "data", "portfolio.db");
}

// 在真实 fs.existsSync 之前判定"目录是否可写"，使用最小化试探，不抛出。
function isDirWritable(dir) {
  try {
    if (!fs.existsSync(dir)) return false;
    const probe = path.join(dir, `.db_probe_${process.pid}_${Date.now()}`);
    fs.writeFileSync(probe, "");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

const DEFAULT_DB_PATH = computeDefaultDbPath();
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

// 允许外部显式拿到当前已解析的 DB_PATH（供日志/调试用）
export { DEFAULT_DB_PATH };

let _db = null;
let _ensured = false;

// ============== 错误提示封装 ==============
// 错误信息去重与"反嵌套"：如果底层消息已经带 [db] 前缀，直接取原始内容不再套前缀。
function stripDbPrefix(s) {
  return String(s || "")
    .replace(/^\[db\]\s*初始化失败：\s*/g, "")
    .replace(/^\[db\]\s*/g, "")
    .trim();
}
function buildInitError(err) {
  const rawMsg = stripDbPrefix(err?.message || String(err));
  const hints = [];
  if (/Cannot find module|Missing native|better-sqlite3/i.test(rawMsg)) {
    hints.push(
      "better-sqlite3 原生绑定缺失：构建机与运行机架构不一致时常见，在部署机器执行 `npm rebuild better-sqlite3`。若部署到 Vercel，Vercel 会自动 rebuild，无需手动操作。"
    );
  }
  if (/permission denied|EACCES|EROFS|read-only/i.test(rawMsg)) {
    hints.push(
      "数据库路径无写权限。部署到 Vercel/Netlify 时应自动降级到 /tmp；若仍出现，请设置 DB_PATH 指向可写目录，或切换为 Turso/Postgres 这类远端数据库。"
    );
  }
  const looksServerless =
    looksLikeVercelServerless() ||
    process.cwd() === "/var/task" ||
    DB_PATH.startsWith("/var/task/");
  if (/unable to open database file|ENOENT|no such file|cannot open/i.test(rawMsg) && looksServerless) {
    hints.push(
      "检测到 Vercel/Lambda 风格运行环境：其默认任务目录只读。修复逻辑已默认把数据库放到 /tmp/<repo>/data/portfolio.db（Preview 仅会话级临时数据，冷启动后会重置）。"
    );
  }
  if (!hints.length) {
    hints.push(`数据目录不存在或无法写入：当前 DB_PATH = ${DB_PATH}，请确认父目录已创建且可写。`);
  }
  hints.push(`当前 DB_PATH = ${DB_PATH}`);
  // 消息只带一层 [db] 前缀，且不再嵌套原始 prefix
  const err2 = new Error(`[db] 初始化失败：${rawMsg} — ${hints.join(" ")}`);
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
    // Vercel/Lambda /tmp 是短暂磁盘：关闭 WAL，仅保留主 db 文件，避免 -wal/-shm 分散带来的问题
    // 同时 SQLite 在只读文件系统上启用 WAL 也会失败，这里根据路径保守地只在非临时路径启用
    const useWal = !DB_PATH.startsWith("/tmp/") && !DB_PATH.startsWith("/var/task/");
    try {
      if (useWal) {
        _db.pragma("journal_mode = WAL");
      } else {
        _db.pragma("journal_mode = DELETE");
      }
    } catch {
      // 模式切换失败通常影响不大，忽略即可
    }
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
  const DEFAULT_INIT_USERNAME = "useradmin";
  const DEFAULT_INIT_PASSWORD = "useradmin123";
  const initUsername =
    (process.env.INIT_ADMIN_USERNAME || "").trim() || DEFAULT_INIT_USERNAME;
  const initPassword =
    (process.env.INIT_ADMIN_PASSWORD || "").trim() || DEFAULT_INIT_PASSWORD;

  // 密码长度校验只在第一次 seed 时做；已经有用户的库不报错，避免影响线上正常读取
  const userCount = getDb()
    .prepare("SELECT COUNT(*) AS c FROM users")
    .get().c;
  if (
    userCount === 0 &&
    (initPassword.length < 6 || initPassword.length > 72)
  ) {
    throw new Error(
      `[db] INIT_ADMIN_PASSWORD 长度必须在 6-72 位之间（当前 ${initPassword.length} 位），请在环境变量中修正后再启动。`
    );
  }

  const db = getDb();
  const defaults = [{ username: initUsername, password: initPassword }];
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
