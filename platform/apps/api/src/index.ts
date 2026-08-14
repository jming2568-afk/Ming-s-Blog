import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { runMigrations } from "./db/migrate.js";

const config = loadConfig();

async function main() {
  // 启动时执行迁移（无 DATABASE_URL 时自动跳过）
  await runMigrations();

  const app = createApp();
  const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
    console.log(`[api] listening on http://localhost:${info.port}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      console.log(`[api] received ${signal}, shutting down`);
      server.close(() => process.exit(0));
    });
  }
}

main().catch((err) => {
  console.error("[api] 启动失败:", err);
  process.exit(1);
});
