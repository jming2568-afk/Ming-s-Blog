// 迁移 CLI 入口：pnpm db:migrate（独立进程，避免与 API 服务进程耦合）
import { runMigrations } from "./migrate.js";

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] 迁移失败:", err);
    process.exit(1);
  });
