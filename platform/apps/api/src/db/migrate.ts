import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "./index.js";

/** 启动时执行数据库迁移（幂等） */
export async function runMigrations(): Promise<void> {
  const db = getDb();
  if (!db) return;
  // 迁移目录候选：
  // - dev(tsx)：apps/api/drizzle
  // - dist 构建：tsup publicDir 把 drizzle 内容拷到 dist 根（dist/meta）
  const candidates = [
    fileURLToPath(new URL("../../drizzle", import.meta.url)),
    fileURLToPath(new URL(".", import.meta.url)),
  ];
  const folder = candidates.find((p) => existsSync(join(p, "meta")));
  if (!folder) {
    console.warn("[migrate] 未找到迁移目录（drizzle/meta），跳过迁移");
    return;
  }
  await migrate(db.db, { migrationsFolder: folder });
  console.log("[migrate] 数据库迁移完成");
}
