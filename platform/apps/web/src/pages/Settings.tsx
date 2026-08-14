import { useEffect, useState } from "react";
import { apiGetThemes, apiUpdateMe, type ThemeItem } from "../lib/api.js";

/** 设置页：主题选择（卡片墙预览） */
export function Settings() {
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [themeRes, meRes] = await Promise.all([
          apiGetThemes(),
          fetch("/api/users/me", { credentials: "include" }).then((r) => r.json()),
        ]);
        setThemes(themeRes.themes);
        setCurrentThemeId((meRes as { user: { themeId: number | null } }).user.themeId);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const apply = (theme: ThemeItem) => {
    document.documentElement.style.cssText = Object.entries(theme.tokens)
      .map(([k, v]) => `${k}: ${v};`)
      .join("\n");
  };

  const select = async (theme: ThemeItem) => {
    setCurrentThemeId(theme.id);
    apply(theme);
    setSaved(false);
    try {
      await apiUpdateMe({ themeId: theme.id });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-black">设置</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
        选择你的简历主页主题（分享页与打印将使用该主题）
      </p>
      {saved && <p className="mt-2 text-sm" style={{ color: "var(--color-accent)" }}>已保存 ✓</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => {
          const active = t.id === currentThemeId;
          return (
            <button
              key={t.id}
              onClick={() => void select(t)}
              className="overflow-hidden rounded text-left"
              style={{
                border: active ? "3px solid var(--color-primary)" : "1px solid var(--color-border)",
                background: t.tokens["--color-surface"] ?? "#fff",
                color: t.tokens["--color-text"] ?? "#111",
                boxShadow: active ? "var(--shadow)" : undefined,
              }}
            >
              {/* 迷你预览 */}
              <div className="p-4">
                <div className="h-2.5 w-16 rounded-sm" style={{ background: t.tokens["--color-primary"] }} />
                <div className="mt-2 h-2 w-24 rounded-sm" style={{ background: t.tokens["--color-text"] ?? "#111", opacity: 0.8 }} />
                <div className="mt-1.5 h-1.5 w-32 rounded-sm" style={{ background: t.tokens["--color-muted"] ?? "#888", opacity: 0.5 }} />
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full rounded-sm" style={{ background: t.tokens["--color-border"] ?? "#ddd" }} />
                  <div className="h-1.5 w-5/6 rounded-sm" style={{ background: t.tokens["--color-border"] ?? "#ddd" }} />
                </div>
              </div>
              <div className="px-4 py-2 text-sm font-bold" style={{ background: t.tokens["--color-bg"] }}>
                {t.name} {active ? "✓" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
