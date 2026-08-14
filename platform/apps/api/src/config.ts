/** 环境配置：集中读取，缺失即报错（早失败） */
export interface ApiConfig {
  port: number;
  sqlitePath: string;
  corsOrigins: string[];
  nodeEnv: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) throw new Error(`PORT 非法: ${env.PORT}`);
  const sqlitePath = env.SQLITE_PATH ?? "./data/resume.db";
  if (!env.SQLITE_PATH) {
    console.warn("[config] SQLITE_PATH 未设置，使用默认 ./data/resume.db");
  }
  const corsOrigins = (env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { port, sqlitePath, corsOrigins, nodeEnv: env.NODE_ENV ?? "development" };
}
