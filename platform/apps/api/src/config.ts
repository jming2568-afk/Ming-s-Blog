/** 环境配置：集中读取，缺失即报错（早失败） */
export interface ApiConfig {
  port: number;
  databaseUrl: string;
  corsOrigins: string[];
  nodeEnv: string;
  /** PDF 渲染服务地址（P4，apps/pdf） */
  pdfServiceUrl: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) throw new Error(`PORT 非法: ${env.PORT}`);
  const databaseUrl = env.DATABASE_URL ?? "";
  if (!databaseUrl) {
    // 健康检查等不依赖 DB 的能力在无 DATABASE_URL 时仍可用；业务模块按需报错
    console.warn("[config] DATABASE_URL 未设置，数据库相关能力不可用");
  }
  const corsOrigins = (env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    port,
    databaseUrl,
    corsOrigins,
    nodeEnv: env.NODE_ENV ?? "development",
    pdfServiceUrl: env.PDF_SERVICE_URL ?? "http://localhost:3210",
  };
}
