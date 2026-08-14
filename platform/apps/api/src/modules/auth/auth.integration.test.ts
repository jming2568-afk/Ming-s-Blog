// 认证接口集成测试：需要真实 PostgreSQL（DATABASE_URL），本地 compose 起 postgres 后运行；
// CI 无 DATABASE_URL 时自动跳过。
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("auth API 集成", () => {
  const app = createApp();
  const uname = `u${Date.now().toString(36)}`;

  it("注册 → 登录 → me → 登出 全流程", async () => {
    // 注册
    const reg = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: uname, email: `${uname}@test.local`, password: "pass-12345678" }),
    });
    expect(reg.status).toBe(201);
    const regBody = (await reg.json()) as { ok: boolean; user: { username: string } };
    expect(regBody.ok).toBe(true);
    expect(regBody.user.username).toBe(uname);

    // 重复注册 → 409
    const dup = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: uname, email: `${uname}@test.local`, password: "pass-12345678" }),
    });
    expect(dup.status).toBe(409);

    // 登录拿 cookie
    const login = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: uname, password: "pass-12345678" }),
    });
    expect(login.status).toBe(200);
    const setCookie = login.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("sid=");

    // me
    const me = await app.request("/api/auth/me", { headers: { cookie: setCookie.split(";")[0]! } });
    expect(me.status).toBe(200);
    const meBody = (await me.json()) as { user: { username: string } };
    expect(meBody.user.username).toBe(uname);

    // 登出后 me → 401
    await app.request("/api/auth/logout", { method: "POST", headers: { cookie: setCookie.split(";")[0]! } });
    const me2 = await app.request("/api/auth/me", { headers: { cookie: setCookie.split(";")[0]! } });
    expect(me2.status).toBe(401);
  });

  it("错误密码 401、格式非法 400", async () => {
    const bad = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: uname, password: "wrong-pass" }),
    });
    expect(bad.status).toBe(401);

    const invalid = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "x", email: "not-an-email", password: "short" }),
    });
    expect(invalid.status).toBe(400);
  });
});
