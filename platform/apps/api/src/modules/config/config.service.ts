import { eq } from "drizzle-orm";
import { appSettings } from "@platform/shared/db/schema";
import { getDb } from "../../db/index.js";
import { decryptSecret, encryptSecret, getMasterKey, isEncrypted } from "./crypto.js";
import type { LlmConfig } from "../ai/llm.js";
import type { StorageConfig } from "@platform/shared";

/** 敏感键：入库时加密，读取时解密 */
const SECRET_KEYS = new Set(["LLM_API_KEY", "STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY"]);

/** 面板可管理的键（白名单） */
export const MANAGEABLE_KEYS = new Set([
  "LLM_API_KEY",
  "LLM_BASE_URL",
  "LLM_TEXT_MODEL",
  "LLM_VISION_MODEL",
  "LLM_PROTOCOL",
  "STORAGE_ACCESS_KEY_ID",
  "STORAGE_SECRET_ACCESS_KEY",
  "STORAGE_ENDPOINT",
  "STORAGE_REGION",
  "STORAGE_BUCKET",
  "STORAGE_PUBLIC_URL_BASE",
  "STORAGE_PATH_STYLE",
  "CORS_ORIGINS",
  "ADMIN_USERNAMES",
]);

const CACHE_TTL_MS = 10_000;
let cache: { at: number; map: Map<string, string> } | null = null;

async function loadSettingsMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.map;
  const db = getDb();
  const map = new Map<string, string>();
  if (db) {
    const rows = await db.db.select().from(appSettings);
    for (const row of rows) map.set(row.key, row.value);
  }
  cache = { at: now, map };
  return map;
}

export function invalidateConfigCache(): void {
  cache = null;
}

/** DB 值（敏感键解密）> 环境变量 > undefined */
export async function getConfigValue(key: string): Promise<string | undefined> {
  const map = await loadSettingsMap();
  const dbValue = map.get(key);
  if (dbValue !== undefined) {
    if (SECRET_KEYS.has(key) && isEncrypted(dbValue)) {
      const masterKey = getMasterKey();
      if (!masterKey) throw new Error("CONFIG_MASTER_KEY 未配置，无法解密密钥项");
      return decryptSecret(dbValue, masterKey);
    }
    return dbValue;
  }
  return process.env[key];
}

/** 合并后的 LLM 配置（DB > env > 默认） */
export async function getLlmConfig(): Promise<LlmConfig | null> {
  const apiKey = (await getConfigValue("LLM_API_KEY")) ?? process.env.ARK_API_KEY;
  if (!apiKey) return null;
  const protocol = ((await getConfigValue("LLM_PROTOCOL")) ?? "auto") as LlmConfig["protocol"];
  if (protocol !== "chat" && protocol !== "responses" && protocol !== "auto") {
    throw new Error(`LLM_PROTOCOL 非法: ${protocol}`);
  }
  return {
    baseUrl: ((await getConfigValue("LLM_BASE_URL")) ?? "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, ""),
    apiKey,
    textModel: (await getConfigValue("LLM_TEXT_MODEL")) ?? "deepseek-v4-flash-ga-260731",
    visionModel: (await getConfigValue("LLM_VISION_MODEL")) ?? "doubao-seed-2-0-lite-260428",
    protocol,
  };
}

/** 合并后的存储配置（DB > env > null） */
export async function getStorageConfig(): Promise<StorageConfig | null> {
  const endpoint = await getConfigValue("STORAGE_ENDPOINT");
  const accessKeyId = await getConfigValue("STORAGE_ACCESS_KEY_ID");
  const secretAccessKey = await getConfigValue("STORAGE_SECRET_ACCESS_KEY");
  const bucket = await getConfigValue("STORAGE_BUCKET");
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    endpoint,
    region: (await getConfigValue("STORAGE_REGION")) ?? "us-east-1",
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrlBase: await getConfigValue("STORAGE_PUBLIC_URL_BASE"),
    pathStyle: (await getConfigValue("STORAGE_PATH_STYLE")) === "true",
  };
}

export async function getAdminUsernames(): Promise<string[]> {
  const value = (await getConfigValue("ADMIN_USERNAMES")) ?? "";
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function getCorsOrigins(): Promise<string[]> {
  const value = (await getConfigValue("CORS_ORIGINS")) ?? "http://localhost:5173";
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

/** 面板保存：upsert / 空值删除；敏感键加密存储 */
export async function updateConfigEntries(entries: Array<{ key: string; value: string }>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("数据库未配置（SQLITE_PATH）");
  const masterKey = getMasterKey();
  if (!masterKey) throw new Error("CONFIG_MASTER_KEY 未配置，无法保存密钥项");

  for (const entry of entries) {
    const { key, value } = entry;
    if (!MANAGEABLE_KEYS.has(key)) throw new Error(`不允许的配置键: ${key}`);
    const trimmed = value.trim();
    if (trimmed === "") {
      await db.db.delete(appSettings).where(eq(appSettings.key, key));
      continue;
    }
    const stored = SECRET_KEYS.has(key) ? encryptSecret(trimmed, masterKey) : trimmed;
    await db.db
      .insert(appSettings)
      .values({ key, value: stored })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: stored, updatedAt: new Date() } });
  }
  invalidateConfigCache();
}

/** 面板 GET 展示形态：敏感值打码 + 来源标注 */
export async function listConfigForAdmin(): Promise<
  Array<{ key: string; value: string; sensitive: boolean; source: "db" | "env" | "default"; configured: boolean }>
> {
  const map = await loadSettingsMap();
  const masterKeyOk = getMasterKey() !== null;
  const out: Array<{ key: string; value: string; sensitive: boolean; source: "db" | "env" | "default"; configured: boolean }> = [];
  for (const key of MANAGEABLE_KEYS) {
    const dbValue = map.get(key);
    const envValue = process.env[key];
    const sensitive = SECRET_KEYS.has(key);
    const configured = dbValue !== undefined || envValue !== undefined;
    let display = "";
    let source: "db" | "env" | "default" = "default";
    if (dbValue !== undefined) {
      source = "db";
      display = sensitive ? "••••••••" : dbValue;
      if (sensitive && isEncrypted(dbValue) && !masterKeyOk) display = "⚠ master key 缺失";
    } else if (envValue !== undefined) {
      source = "env";
      display = sensitive ? "••••••••" : envValue;
    }
    out.push({ key, value: display, sensitive, source, configured });
  }
  return out;
}
