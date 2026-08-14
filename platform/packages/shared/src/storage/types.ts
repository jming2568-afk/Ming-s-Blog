// 对象存储抽象（S3 兼容）：生产接 TOS（火山引擎，S3 兼容端点），本地开发用 MinIO。
// 依赖注入存储客户端，便于测试与切换厂商。

export interface StoragePutOptions {
  contentType: string;
  /** 是否公开可读（默认 true：简历头像等需公网直链） */
  public?: boolean;
}

export interface StorageClient {
  /** 上传对象，返回公网可访问的 URL */
  put(key: string, data: Buffer | Uint8Array, options: StoragePutOptions): Promise<string>;
  /** 删除对象 */
  delete(key: string): Promise<void>;
  /** 确保 bucket 存在（并设置匿名读策略，供头像等公网直链） */
  ensureBucket?(): Promise<void>;
}

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** 公开访问的基础 URL（例如 MinIO 直链域名）；为空则从 endpoint 推导 */
  publicUrlBase?: string;
}
