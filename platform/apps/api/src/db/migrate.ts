import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "./index.js";

/** 定位迁移目录（兼容 dev-ESM / dist-CJS / cwd 三种运行形态） */
function resolveMigrationsFolder(): string | null {
  const candidates: string[] = [];
  try {
    // dev（tsx ESM）：apps/api/drizzle
    candidates.push(fileURLToPath(new URL("../../drizzle", import.meta.url)));
  } catch {
    /* CJS 环境无 import.meta.url */
  }
  if (typeof __dirname !== "undefined") {
    // dist（CJS）：tsup publicDir 把 drizzle 内容拷到 dist 根（dist/meta 或 dist/drizzle/meta）
    candidates.push(join(__dirname, "drizzle"), __dirname);
  }
  candidates.push(join(process.cwd(), "drizzle"));
  return candidates.find((p) => existsSync(join(p, "meta"))) ?? null;
}

/** 启动时执行数据库迁移（幂等） */
export async function runMigrations(): Promise<void> {
  const db = getDb();
  if (!db) return;
  const folder = resolveMigrationsFolder();
  if (!folder) {
    console.warn("[migrate] 未找到迁移目录（drizzle/meta），跳过迁移");
    return;
  }
  await migrate(db.db, { migrationsFolder: folder });
  console.log("[migrate] 数据库迁移完成");
}
