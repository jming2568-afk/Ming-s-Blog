import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@platform/shared/db/schema";

/** 懒加载的单例 DB 客户端（无 DATABASE_URL 时返回 null，不阻断健康检查） */
let client: ReturnType<typeof createClient> | null = null;

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const sql = postgres(url, { max: 10, idle_timeout: 20, connect_timeout: 10 });
  return { sql, db: drizzle(sql, { schema }) };
}

export function getDb() {
  if (!client) client = createClient();
  return client;
}

export { schema };
