import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = createApp();

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[api] listening on http://localhost:${info.port}`);
});

// 优雅退出
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`[api] received ${signal}, shutting down`);
    server.close(() => process.exit(0));
  });
}
