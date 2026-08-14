import { useParams } from "react-router-dom";

/** 公共分享页：P3 实现（按主人主题渲染），目前为占位 */
export function PublicResume() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded p-8 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          简历页 /r/{slug}
        </p>
        <h1 className="mt-3 text-2xl font-black">该简历尚未发布</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
          P3 阶段实现：按主人主题渲染 + 打印一致
        </p>
      </div>
    </div>
  );
}
