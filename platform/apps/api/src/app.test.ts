import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("GET /api/health", () => {
  it("返回 ok 与版本信息", async () => {
    const app = createApp();
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe("api");
  });
});

describe("404", () => {
  it("未知接口返回 404 与错误结构", async () => {
    const app = createApp();
    const res = await app.request("/api/nope");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });
});

describe("安全响应头（P5）", () => {
  it("响应携带安全头", async () => {
    const app = createApp();
    const res = await app.request("/api/health");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
});
