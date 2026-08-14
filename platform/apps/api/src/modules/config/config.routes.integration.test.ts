// 配置中心路由集成测试（临时 SQLite）：GET 打码 / PUT 保存 / 权限 / 测试按钮
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { setupTestDb, type TestDb } from "../../test/sqlite-test.js";

const MASTER = "a".repeat(64);

async function register(app: ReturnType<typeof createApp>, name: string) {
  const res = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: name, email: `${name}@test.local`, password: "pass-12345678" }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  return setCookie.split(";")[0]!;
}

describe("配置中心路由（SQLite）", () => {
  let testDb: TestDb;
  const app = createApp();
  const base = Date.now().toString(36);
  const adminUser = `ca_${base}`;
  const normalUser = `cn_${base}`;
  let adminCookie = "";
  let normalCookie = "";

  beforeAll(async () => {
    testDb = await setupTestDb();
    process.env.CONFIG_MASTER_KEY = MASTER;
    process.env.ADMIN_USERNAMES = adminUser;
    adminCookie = await register(app, adminUser);
    normalCookie = await register(app, normalUser);
  });
  afterAll(() => {
    delete process.env.CONFIG_MASTER_KEY;
    delete process.env.ADMIN_USERNAMES;
    testDb.cleanup();
  });

  it("非 admin → 403", async () => {
    const res = await app.request("/api/admin/config", { headers: { cookie: normalCookie } });
    expect(res.status).toBe(403);
  });

  it("GET：密钥打码 + 来源标注；PUT：保存/清空生效", async () => {
    // PUT 保存（含敏感键）
    const put = await app.request("/api/admin/config", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({
        config: [
          { key: "LLM_API_KEY", value: "super-secret" },
          { key: "LLM_TEXT_MODEL", value: "panel-model" },
          { key: "LLM_PROTOCOL", value: "chat" },
        ],
      }),
    });
    expect(put.status).toBe(200);

    // GET：敏感值打码，非敏感值显示；来源为 db
    const get = await app.request("/api/admin/config", { headers: { cookie: adminCookie } });
    expect(get.status).toBe(200);
    const body = (await get.json()) as {
      masterKeyOk: boolean;
      config: Array<{ key: string; value: string; sensitive: boolean; source: string }>;
    };
    expect(body.masterKeyOk).toBe(true);
    const apiKeyEntry = body.config.find((c) => c.key === "LLM_API_KEY")!;
    expect(apiKeyEntry.sensitive).toBe(true);
    expect(apiKeyEntry.value).toBe("••••••••");
    expect(apiKeyEntry.value).not.toContain("super-secret");
    const modelEntry = body.config.find((c) => c.key === "LLM_TEXT_MODEL")!;
    expect(modelEntry.value).toBe("panel-model");
    expect(modelEntry.source).toBe("db");

    // 清空 LLM_TEXT_MODEL → 删除记录
    const clear = await app.request("/api/admin/config", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ config: [{ key: "LLM_TEXT_MODEL", value: "" }] }),
    });
    expect(clear.status).toBe(200);
    const get2 = await app.request("/api/admin/config", { headers: { cookie: adminCookie } });
    const body2 = (await get2.json()) as { config: Array<{ key: string; value: string; source: string }> };
    expect(body2.config.find((c) => c.key === "LLM_TEXT_MODEL")!.source).not.toBe("db");
  });

  it("非法配置键被拒 400", async () => {
    const res = await app.request("/api/admin/config", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ config: [{ key: "SQLITE_PATH", value: "/hack" }] }),
    });
    expect(res.status).toBe(400);
  });

  it("LLM 未配置时 test-llm → 400；存储未配置时 test-storage → 400", async () => {
    // 先清空可能被上一用例写入的键，确保"未配置"状态
    await app.request("/api/admin/config", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: adminCookie },
      body: JSON.stringify({
        config: [
          { key: "LLM_API_KEY", value: "" },
          { key: "STORAGE_ACCESS_KEY_ID", value: "" },
          { key: "STORAGE_SECRET_ACCESS_KEY", value: "" },
          { key: "STORAGE_ENDPOINT", value: "" },
          { key: "STORAGE_BUCKET", value: "" },
        ],
      }),
    });
    const llm = await app.request("/api/admin/config/test-llm", { method: "POST", headers: { cookie: adminCookie } });
    expect(llm.status).toBe(400);
    const storage = await app.request("/api/admin/config/test-storage", { method: "POST", headers: { cookie: adminCookie } });
    expect(storage.status).toBe(400);
  });
});
