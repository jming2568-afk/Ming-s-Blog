// 配置合并服务测试：优先级 DB > env、敏感值加密存取
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appSettings } from "@platform/shared/db/schema";
import { setupTestDb, type TestDb } from "../../test/sqlite-test.js";
import { getDb } from "../../db/index.js";
import { encryptSecret } from "./crypto.js";
import { getAdminUsernames, getConfigValue, getLlmConfig, getStorageConfig, invalidateConfigCache, updateConfigEntries } from "./config.service.js";

const MASTER = "a".repeat(64);

describe("config.service（DB > env 合并）", () => {
  let testDb: TestDb;

  beforeAll(async () => {
    testDb = await setupTestDb();
    process.env.CONFIG_MASTER_KEY = MASTER;
  });
  afterAll(() => {
    delete process.env.CONFIG_MASTER_KEY;
    testDb.cleanup();
  });
  beforeEach(async () => {
    // 清空 app_settings，隔离用例
    const db = getDb()!;
    await db.db.delete(appSettings);
    invalidateConfigCache();
  });

  it("DB 值优先于 env", async () => {
    process.env.LLM_TEXT_MODEL = "env-model";
    await updateConfigEntries([{ key: "LLM_TEXT_MODEL", value: "db-model" }]);
    expect(await getConfigValue("LLM_TEXT_MODEL")).toBe("db-model");
    delete process.env.LLM_TEXT_MODEL;
  });

  it("无 DB 值时回退 env", async () => {
    process.env.LLM_TEXT_MODEL = "env-model";
    expect(await getConfigValue("LLM_TEXT_MODEL")).toBe("env-model");
    delete process.env.LLM_TEXT_MODEL;
  });

  it("敏感键加密存储 + 解密读取", async () => {
    await updateConfigEntries([{ key: "LLM_API_KEY", value: "db-secret-key" }]);
    const db = getDb()!;
    const [row] = await db.db.select().from(appSettings).where(eq(appSettings.key, "LLM_API_KEY"));
    expect(row!.value).not.toContain("db-secret-key"); // 密文入库
    expect(await getConfigValue("LLM_API_KEY")).toBe("db-secret-key"); // 解密读取
  });

  it("历史明文值兼容读取", async () => {
    const db = getDb()!;
    await db.db.insert(appSettings).values({ key: "LLM_API_KEY", value: "plain-old" });
    invalidateConfigCache();
    expect(await getConfigValue("LLM_API_KEY")).toBe("plain-old");
  });

  it("清空某项 = 删除 DB 记录（回退 env）", async () => {
    process.env.LLM_TEXT_MODEL = "env-model";
    await updateConfigEntries([{ key: "LLM_TEXT_MODEL", value: "db-model" }]);
    await updateConfigEntries([{ key: "LLM_TEXT_MODEL", value: "  " }]);
    expect(await getConfigValue("LLM_TEXT_MODEL")).toBe("env-model");
    delete process.env.LLM_TEXT_MODEL;
  });

  it("不允许的键被拒绝", async () => {
    await expect(updateConfigEntries([{ key: "SQLITE_PATH", value: "/hack" }])).rejects.toThrow("不允许");
  });

  it("getLlmConfig 合并各字段（含 ARK_API_KEY 回退）", async () => {
    process.env.ARK_API_KEY = "ark-key";
    await updateConfigEntries([
      { key: "LLM_TEXT_MODEL", value: "db-model" },
      { key: "LLM_PROTOCOL", value: "chat" },
    ]);
    const cfg = await getLlmConfig();
    expect(cfg?.textModel).toBe("db-model");
    expect(cfg?.protocol).toBe("chat");
    expect(cfg?.apiKey).toBe("ark-key");
    delete process.env.ARK_API_KEY;
  });

  it("getStorageConfig 合并 + pathStyle 解析", async () => {
    await updateConfigEntries([
      { key: "STORAGE_ENDPOINT", value: "http://minio:9000" },
      { key: "STORAGE_ACCESS_KEY_ID", value: "ak" },
      { key: "STORAGE_SECRET_ACCESS_KEY", value: "sk" },
      { key: "STORAGE_BUCKET", value: "resume" },
      { key: "STORAGE_PATH_STYLE", value: "true" },
    ]);
    const cfg = await getStorageConfig();
    expect(cfg?.endpoint).toBe("http://minio:9000");
    expect(cfg?.accessKeyId).toBe("ak");
    expect(cfg?.pathStyle).toBe(true);
  });

  it("getAdminUsernames 合并 DB > env", async () => {
    process.env.ADMIN_USERNAMES = "envadmin";
    await updateConfigEntries([{ key: "ADMIN_USERNAMES", value: "dbadmin, boss" }]);
    expect(await getAdminUsernames()).toEqual(["dbadmin", "boss"]);
    delete process.env.ADMIN_USERNAMES;
  });

  it("master key 缺失时读取加密值报错", async () => {
    await updateConfigEntries([{ key: "LLM_API_KEY", value: "secret" }]);
    delete process.env.CONFIG_MASTER_KEY;
    await expect(getConfigValue("LLM_API_KEY")).rejects.toThrow("CONFIG_MASTER_KEY");
    process.env.CONFIG_MASTER_KEY = MASTER;
  });
});
