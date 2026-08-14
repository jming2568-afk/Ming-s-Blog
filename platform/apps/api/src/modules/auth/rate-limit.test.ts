import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limit.js";

describe("RateLimiter", () => {
  it("窗口内超限拒绝", () => {
    const limiter = new RateLimiter(3, 60_000);
    const now = 1_000_000;
    expect(limiter.allow("k", now)).toBe(true);
    expect(limiter.allow("k", now)).toBe(true);
    expect(limiter.allow("k", now)).toBe(true);
    expect(limiter.allow("k", now)).toBe(false);
  });
  it("窗口过后重置", () => {
    const limiter = new RateLimiter(2, 60_000);
    expect(limiter.allow("k", 0)).toBe(true);
    expect(limiter.allow("k", 0)).toBe(true);
    expect(limiter.allow("k", 0)).toBe(false);
    expect(limiter.allow("k", 61_000)).toBe(true);
  });
  it("不同 key 互不影响", () => {
    const limiter = new RateLimiter(1, 60_000);
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("b", 0)).toBe(true);
  });
  it("sweep 清理过期桶", () => {
    const limiter = new RateLimiter(1, 60_000);
    limiter.allow("old", 0);
    limiter.allow("fresh", 61_000);
    limiter.sweep(120_000);
    // old 已过期被清；fresh 仍在窗口内
    expect(limiter.allow("old", 120_000)).toBe(true);
    expect(limiter.allow("fresh", 120_000)).toBe(false);
  });
});
