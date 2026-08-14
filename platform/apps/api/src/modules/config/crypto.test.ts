import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, getMasterKey, isEncrypted } from "./crypto.js";

const MASTER = "a".repeat(64); // 合法 64 hex

describe("crypto AES-256-GCM", () => {
  it("roundtrip 加解密", () => {
    const stored = encryptSecret("sk-secret-123", MASTER);
    expect(isEncrypted(stored)).toBe(true);
    expect(stored.startsWith("enc:v1:")).toBe(true);
    expect(stored).not.toContain("sk-secret-123");
    expect(decryptSecret(stored, MASTER)).toBe("sk-secret-123");
  });
  it("同一明文两次加密密文不同（随机 IV）", () => {
    expect(encryptSecret("x", MASTER)).not.toBe(encryptSecret("x", MASTER));
  });
  it("错误 master key 解密失败", () => {
    const stored = encryptSecret("secret", MASTER);
    expect(() => decryptSecret(stored, "b".repeat(64))).toThrow();
  });
  it("篡改密文解密失败（GCM 完整性）", () => {
    const stored = encryptSecret("secret", MASTER);
    const tampered = stored.slice(0, -2) + "00";
    expect(() => decryptSecret(tampered, MASTER)).toThrow();
  });
  it("明文兼容：非 enc:v1: 原样返回", () => {
    expect(decryptSecret("plain-value", MASTER)).toBe("plain-value");
  });
});

describe("getMasterKey", () => {
  it("缺失返回 null", () => {
    expect(getMasterKey({})).toBeNull();
  });
  it("非法长度报错", () => {
    expect(() => getMasterKey({ CONFIG_MASTER_KEY: "short" })).toThrow();
  });
  it("合法 64 hex 通过", () => {
    expect(getMasterKey({ CONFIG_MASTER_KEY: MASTER })).toBe(MASTER);
  });
});
