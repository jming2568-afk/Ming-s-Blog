import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { media } from "@platform/shared/db/schema";
import { requireAuth } from "../../middleware/auth.js";
import type { AppVariables } from "../../types.js";
import { getDb } from "../../db/index.js";
import { getStorage } from "../../storage.js";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

/** 媒体上传（头像/证书等图片）→ TOS/MinIO 公网直链 */
export function createMediaRoutes() {
  const r = new Hono<{ Variables: AppVariables }>();
  r.use("*", requireAuth);

  r.post("/", async (c) => {
    const storage = getStorage();
    if (!storage) {
      return c.json({ ok: false, error: "对象存储未配置：请设置 STORAGE_ENDPOINT / STORAGE_ACCESS_KEY_ID / STORAGE_SECRET_ACCESS_KEY / STORAGE_BUCKET" }, 500);
    }
    const db = getDb();
    if (!db) throw new Error("数据库未配置（DATABASE_URL）");

    const form = await c.req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return c.json({ ok: false, error: "缺少文件字段 file" }, 400);
    if (file.size > MAX_SIZE) return c.json({ ok: false, error: "文件过大（最大 8MB）" }, 400);
    if (!ALLOWED_TYPES.has(file.type)) {
      return c.json({ ok: false, error: "仅支持图片（jpeg/png/webp/gif/svg）" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split("/")[1] === "svg+xml" ? "svg" : file.type.split("/")[1];
    const key = `media/${c.get("user")!.id}/${randomUUID()}.${ext}`;
    const url = await storage.put(key, buffer, { contentType: file.type });

    await db.db.insert(media).values({
      userId: c.get("user")!.id,
      key,
      url,
      mime: file.type,
      size: buffer.length,
    });

    return c.json({ ok: true, media: { key, url, mime: file.type, size: buffer.length } }, 201);
  });

  return r;
}
