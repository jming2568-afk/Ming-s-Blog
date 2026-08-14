import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiCreateResume, apiImportResume, apiListResumes, apiUpdateResume, type ResumeItem } from "../lib/api.js";

export function AppHome() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiListResumes();
        setResumes(res.resumes);
      } catch (err) {
        alert(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const create = async () => {
    setBusy(true);
    try {
      const res = await apiCreateResume("我的简历");
      navigate(`/app/resumes/${res.resume.id}/edit`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "创建失败");
    } finally {
      setBusy(false);
    }
  };

  // AI 导入旧简历（P5 F-A6）：上传图片/PDF/Word → 结构化草稿 → 进编辑器
  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      const result = await apiImportResume(file);
      const title = result.data.basic.name ? `${result.data.basic.name} 的简历` : "导入的简历";
      const created = await apiCreateResume(title);
      await apiUpdateResume(created.resume.id, { data: result.data });
      navigate(`/app/resumes/${created.resume.id}/edit`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "导入失败");
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <p className="text-sm" style={{ color: "var(--color-muted)" }}>加载中…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">我的简历</h1>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded px-4 py-2 text-sm font-bold" style={{ border: "1px solid var(--color-border)" }}>
            {importing ? "AI 导入中…" : "🤖 AI 导入旧简历"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => void onImportFile(e.target.files?.[0])}
            />
          </label>
          <button onClick={() => void create()} disabled={busy} className="rounded px-4 py-2 text-sm font-bold disabled:opacity-50" style={{ background: "var(--color-primary)", color: "#fff" }}>
            {busy ? "创建中…" : "+ 新建简历"}
          </button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="mt-8 rounded border-2 border-dashed p-10 text-center" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>还没有简历，点击右上角创建</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {resumes.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded p-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{r.title}</span>
                  {r.isPublic ? (
                    <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ background: "var(--color-primary)", color: "#fff" }}>已发布</span>
                  ) : (
                    <span className="rounded px-2 py-0.5 text-xs" style={{ border: "1px solid var(--color-border)" }}>草稿</span>
                  )}
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                  /r/{r.slug} · 更新于 {new Date(r.updatedAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {r.isPublic && (
                  <a href={`/r/${r.slug}`} target="_blank" rel="noreferrer" className="text-sm" style={{ color: "var(--color-accent)" }}>
                    查看 ↗
                  </a>
                )}
                <Link to={`/app/resumes/${r.id}/edit`} className="rounded px-3 py-1.5 text-sm font-bold" style={{ background: "var(--color-primary)", color: "#fff" }}>
                  编辑
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
