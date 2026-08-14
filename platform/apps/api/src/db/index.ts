import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@platform/shared/db/schema";

/**
 * 懒加载的单例 DB 客户端（SQLite，TECH-001）。
 * 未配置 SQLITE_PATH 时返回 null，不阻断健康检查。
 */
let client: { db: BetterSQLite3Database<typeof schema> } | null = null;
let sqlite: InstanceType<typeof Database> | null = null;

function createClient() {
  const path = process.env.SQLITE_PATH;
  if (!path) return null;
  sqlite = new Database(path);
  // 并发写与完整性（TECH-001 §4.1）
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = ON");
  return { db: drizzle(sqlite, { schema }) };
}

export function getDb() {
  if (!client) client = createClient();
  return client;
}

/** 关闭连接并重置单例（测试清理用；生产进程退出时 OS 回收） */
export function closeDb(): void {
  try {
    sqlite?.close();
  } catch {
    /* ignore */
  }
  sqlite = null;
  client = null;
}

export { schema };
