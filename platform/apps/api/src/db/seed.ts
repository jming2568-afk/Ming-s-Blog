import { themes as systemThemes } from "@platform/ui";
import { themes } from "@platform/shared/db/schema";
import { getDb } from "./index.js";

/** 启动时把 5 套系统主题种入 DB（幂等：themes 表为空时才写入） */
export async function seedSystemThemes(): Promise<void> {
  const db = getDb();
  if (!db) return;
  const existing = await db.db.select({ id: themes.id }).from(themes).limit(1);
  if (existing.length > 0) return;
  await db.db.insert(themes).values(
    systemThemes.map((t, i) => ({
      name: t.name,
      tokens: t.tokens,
      isSystem: true,
      // 保证 id 稳定：1..5 与 systemThemes 顺序一致（memphis=1 … cream=5）
      id: i + 1,
    }))
  );
  console.log(`[seed] 已种入 ${systemThemes.length} 套系统主题`);
}
