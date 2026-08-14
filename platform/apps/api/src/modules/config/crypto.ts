import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** AES-256-GCM 加密存储格式：enc:v1:<iv hex>:<tag hex>:<ciphertext hex> */
export const ENC_PREFIX = "enc:v1:";

export function getMasterKey(env: NodeJS.ProcessEnv = process.env): string | null {
  const key = env.CONFIG_MASTER_KEY;
  if (!key) return null;
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error("CONFIG_MASTER_KEY 必须是 64 位 hex（openssl rand -hex 32）");
  }
  return key;
}

export function encryptSecret(plain: string, masterKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(masterKey, "hex"), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${ct.toString("hex")}`;
}

export function decryptSecret(stored: string, masterKey: string): string {
  if (!stored.startsWith(ENC_PREFIX)) return stored; // 兼容历史明文
  const parts = stored.slice(ENC_PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("加密值格式错误");
  const [ivHex, tagHex, ctHex] = parts as [string, string, string];
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(masterKey, "hex"), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(ctHex, "hex")), decipher.final()]).toString("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}
