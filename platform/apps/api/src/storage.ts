import { createS3Storage, storageConfigFromEnv, type StorageClient } from "@platform/shared";

/** 懒加载存储客户端（未配置时返回 null，上传接口给出明确提示） */
let storage: StorageClient | null | undefined;

export function getStorage(): StorageClient | null {
  if (storage !== undefined) return storage;
  const config = storageConfigFromEnv();
  storage = config ? createS3Storage(config) : null;
  if (!storage) console.warn("[storage] 未配置 STORAGE_* 环境变量，上传不可用");
  return storage;
}
