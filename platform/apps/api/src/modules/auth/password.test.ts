import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password", () => {
  it("hash 后能正确校验", async () => {
    const hash = await hashPassword("my-secret-123");
    expect(hash).not.toBe("my-secret-123");
    expect(await verifyPassword("my-secret-123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
  it("同一密码两次 hash 不同（加盐）", async () => {
    const a = await hashPassword("same-pass");
    const b = await hashPassword("same-pass");
    expect(a).not.toBe(b);
  });
});
