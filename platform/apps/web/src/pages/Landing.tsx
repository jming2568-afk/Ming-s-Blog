import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "../lib/api.js";
import { useTheme } from "../components/ThemeProvider.js";

export function Landing() {
  const { data: health } = useQuery({ queryKey: ["health"], queryFn: fetchHealth });
  const { availableThemes, themeId, setThemeId } = useTheme();

  return (
    <div>
      <section className="py-16 text-center">
        <h1 className="text-4xl font-black">简历一站到底</h1>
        <p className="mt-4 text-lg" style={{ color: "var(--color-muted)" }}>
          创建 / 展示 / 交付——线上看到什么，打印出来就是什么
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a href="/register" className="rounded px-6 py-3 font-bold" style={{ background: "var(--color-primary)", color: "#fff" }}>
            免费创建简历
          </a>
          <a href="/app" className="rounded px-6 py-3 font-bold" style={{ border: "2px solid var(--color-border)" }}>
            进入工作台
          </a>
        </div>
      </section>

      <section className="mt-8 rounded p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-bold">主题预览（P1 骨架演示）</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableThemes.map((t) => (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              className="rounded px-3 py-1 text-sm"
              style={{
                background: themeId === t.id ? "var(--color-primary)" : "transparent",
                color: themeId === t.id ? "#fff" : "var(--color-text)",
                border: "1px solid var(--color-border)",
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--color-muted)" }}>
          当前主题：{themeId}（存于 localStorage，注册后落到 users.theme_id）
        </p>
      </section>

      <section className="mt-4 text-xs" style={{ color: "var(--color-muted)" }}>
        API 状态：{health ? `✅ ${health.service} v${health.version} · db=${health.db}` : "⏳ 检测中…"}
      </section>
    </div>
  );
}
