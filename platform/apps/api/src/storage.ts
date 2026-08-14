import { createS3Storage, type StorageClient } from "@platform/shared";
import { getStorageConfig } from "./modules/config/config.service.js";

/** 懒加载存储客户端（合并配置：DB > env；未配置时返回 null） */
let storage: StorageClient | null | undefined;

export async function getStorage(): Promise<StorageClient | null> {
  if (storage !== undefined) return storage;
  const config = await getStorageConfig();
  storage = config ? createS3Storage(config) : null;
  if (!storage) console.warn("[storage] 存储未配置（STORAGE_ENDPOINT/AK/SK/BUCKET），上传不可用");
  return storage;
}
