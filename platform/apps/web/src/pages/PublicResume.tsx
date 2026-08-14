import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ResumeView } from "@platform/ui";
import { apiGetPublicResume, type PublicResumePayload } from "../lib/api.js";

const DEFAULT_TOKENS: Record<string, string> = {
  "--color-primary": "#e63946",
  "--color-bg": "#fdf6ec",
  "--color-surface": "#ffffff",
  "--color-text": "#1a1a1a",
  "--color-muted": "#6b6b6b",
  "--color-accent": "#007aff",
  "--color-border": "#1a1a1a",
};

/** 公共分享页：按主人主题渲染（一致性内核：与编辑器预览/打印同源组件） */
export function PublicResume() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<{ payload: PublicResumePayload; themeTokens: Record<string, string> } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      try {
        const payload = await apiGetPublicResume(slug);
        const tokens = payload.resume.owner.theme?.tokens ?? DEFAULT_TOKENS;
        // 覆盖全局主题变量为主人的主题
        document.documentElement.style.cssText = Object.entries(tokens)
          .map(([k, v]) => `${k}: ${v};`)
          .join("\n");
        setState({ payload, themeTokens: tokens });
      } catch {
        setNotFound(true);
      }
    })();
    return () => {
      document.documentElement.style.cssText = "";
    };
  }, [slug]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-black">简历不存在或未发布</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>请确认链接是否正确</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm" style={{ color: "var(--color-muted)" }}>
        加载中…
      </div>
    );
  }

  const { payload } = state;
  const { resume } = payload;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* 顶部工具栏（打印时隐藏） */}
      <div className="no-print mx-auto flex max-w-3xl items-center justify-between px-4 py-3 text-sm">
        <span style={{ color: "var(--color-muted)" }}>
          {resume.owner.displayName} 的简历
        </span>
        <button
          onClick={() => window.print()}
          className="rounded px-4 py-1.5 font-bold"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          🖨 打印 / 存 PDF
        </button>
      </div>

      {/* 简历主体（打印区域） */}
      <div className="print-area mx-auto max-w-3xl px-4 pb-12">
        <div className="rounded-lg p-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow)" }}>
          <ResumeView data={resume.data} />
        </div>
        <p className="no-print mt-4 text-center text-xs" style={{ color: "var(--color-muted)" }}>
          更新于 {new Date(resume.updatedAt).toLocaleString("zh-CN")} · 简历一站到底
        </p>
      </div>
    </div>
  );
}
