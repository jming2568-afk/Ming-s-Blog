// 集成测试助手（TECH-001 §4.6）：自动创建临时 SQLite + 迁移，CI 无需外部数据库
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runMigrations } from "../db/migrate.js";
import { closeDb } from "../db/index.js";

export interface TestDb {
  dbPath: string;
  cleanup: () => void;
}

/** 每个测试文件调用一次：设置 SQLITE_PATH 到独立临时库并执行迁移 */
export async function setupTestDb(): Promise<TestDb> {
  const dir = mkdtempSync(join(tmpdir(), "resume-test-"));
  const dbPath = join(dir, "test.db");
  process.env.SQLITE_PATH = dbPath;
  await runMigrations();
  return {
    dbPath,
    cleanup: () => {
      // 先关闭连接再删文件（Windows 上文件锁会导致 EBUSY）
      closeDb();
      delete process.env.SQLITE_PATH;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
