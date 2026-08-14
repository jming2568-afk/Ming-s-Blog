// admin 角色守卫集成测试（临时 SQLite）
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { setupTestDb, type TestDb } from "../../test/sqlite-test.js";

async function register(app: ReturnType<typeof createApp>, name: string) {
  const res = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: name, email: `${name}@test.local`, password: "pass-12345678" }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  return { cookie: setCookie.split(";")[0]!, body: (await res.json()) as { user: { role: string } } };
}

describe("admin API（SQLite）", () => {
  let testDb: TestDb;
  const app = createApp();
  const base = Date.now().toString(36);
  const normalUser = `an_${base}`;
  const adminUser = `aa_${base}`;

  beforeAll(async () => {
    testDb = await setupTestDb();
    // 注册前设置 ADMIN_USERNAMES，使 adminUser 自动提升
    process.env.ADMIN_USERNAMES = adminUser;
  });
  afterAll(() => {
    delete process.env.ADMIN_USERNAMES;
    testDb.cleanup();
  });

  it("普通用户访问 /api/admin/users → 403", async () => {
    const a = await register(app, normalUser);
    expect(a.body.user.role).toBe("user");
    const res = await app.request("/api/admin/users", { headers: { cookie: a.cookie } });
    expect(res.status).toBe(403);
  });

  it("ADMIN_USERNAMES 用户自动提升为 admin，可访问用户列表", async () => {
    const b = await register(app, adminUser);
    expect(b.body.user.role).toBe("admin");
    const res = await app.request("/api/admin/users", { headers: { cookie: b.cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { users: Array<{ username: string; resumeCount: number }> };
    expect(body.users.some((u) => u.username === normalUser)).toBe(true);
  });
});
