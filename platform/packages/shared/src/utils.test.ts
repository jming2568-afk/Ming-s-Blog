import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, truncate } from "./utils.js";

describe("slugify", () => {
  it("英文短语转 kebab", () => {
    expect(slugify("My Resume 2026")).toBe("my-resume-2026");
  });
  it("保留中文", () => {
    expect(slugify("李佳铭 简历")).toBe("李佳铭-简历");
  });
  it("空输入返回空串", () => {
    expect(slugify("   ")).toBe("");
  });
});

describe("isValidSlug", () => {
  it("合法 slug 通过", () => {
    expect(isValidSlug("ljm-2026")).toBe(true);
    expect(isValidSlug("李佳铭-简历")).toBe(true);
  });
  it("非法 slug 拒绝", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("-ljm")).toBe(false);
    expect(isValidSlug("ljm-")).toBe(false);
    expect(isValidSlug("a b")).toBe(false);
  });
});

describe("truncate", () => {
  it("超长截断", () => {
    expect(truncate("1234567890", 4)).toBe("1234…");
  });
  it("未超长原样返回", () => {
    expect(truncate("abc", 5)).toBe("abc");
  });
});
