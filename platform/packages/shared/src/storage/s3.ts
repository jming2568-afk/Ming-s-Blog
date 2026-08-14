import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageClient, StorageConfig, StoragePutOptions } from "./types.js";

/**
 * S3 兼容存储实现（@aws-sdk/client-s3 + 自定义 endpoint）。
 * TOS / MinIO / 阿里 OSS / 腾讯 COS 均可通过 S3 兼容端点接入。
 */
export function createS3Storage(config: StorageConfig): StorageClient {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // MinIO / TOS 需 path-style
  });

  function publicUrl(key: string): string {
    if (config.publicUrlBase) {
      return `${config.publicUrlBase.replace(/\/$/, "")}/${encodeURIComponent(key)}`;
    }
    return `${config.endpoint.replace(/\/$/, "")}/${config.bucket}/${encodeURIComponent(key)}`;
  }

  return {
    async put(key: string, data: Buffer | Uint8Array, options: StoragePutOptions) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: data,
          ContentType: options.contentType,
          ...(options.public === false ? {} : { ACL: "public-read" }),
        })
      );
      return publicUrl(key);
    },
    async delete(key: string) {
      await client.send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: key })
      );
    },
    async ensureBucket() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
      } catch {
        await client.send(new CreateBucketCommand({ Bucket: config.bucket }));
      }
      // 匿名读策略（头像/证书公网直链；生产 TOS 用桶 ACL/CDN 策略，此处对 MinIO 有效）
      try {
        await client.send(
          new PutBucketPolicyCommand({
            Bucket: config.bucket,
            Policy: JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Principal: { AWS: ["*"] },
                  Action: ["s3:GetObject"],
                  Resource: [`arn:aws:s3:::${config.bucket}/*`],
                },
              ],
            }),
          })
        );
      } catch {
        /* 生产桶可能由平台管控，忽略 */
      }
    },
  };
}

/** 从环境变量构造存储配置；未配置时返回 null（上传接口将报错提示） */
export function storageConfigFromEnv(env: NodeJS.ProcessEnv = process.env): StorageConfig | null {
  const endpoint = env.STORAGE_ENDPOINT;
  const accessKeyId = env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = env.STORAGE_SECRET_ACCESS_KEY;
  const bucket = env.STORAGE_BUCKET;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    endpoint,
    region: env.STORAGE_REGION ?? "us-east-1",
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrlBase: env.STORAGE_PUBLIC_URL_BASE,
  };
}
