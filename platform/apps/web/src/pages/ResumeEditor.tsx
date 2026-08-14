import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  emptyResumeData,
  type BasicSection,
  type CertItem,
  type EducationItem,
  type ExperienceItem,
  type ProjectItem,
  type ResumeData,
  type SkillItem,
} from "@platform/shared";
import { ResumeView } from "@platform/ui";
import { apiGetResume, apiGetThemes, apiPublishResume, apiUpdateMe, apiUpdateResume, type ThemeItem } from "../lib/api.js";

// ---------- 通用表单小组件 ----------
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs" style={{ color: "var(--color-muted)" }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border px-3 py-2 text-sm"
        style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs" style={{ color: "var(--color-muted)" }}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded border px-3 py-2 text-sm"
        style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5 rounded p-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ItemCard({ title, onRemove, children }: { title: string; onRemove: () => void; children: ReactNode }) {
  return (
    <div className="rounded p-3" style={{ border: "1px dashed var(--color-border)" }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{title}</span>
        <button type="button" onClick={onRemove} className="text-xs" style={{ color: "var(--color-primary)" }}>
          删除
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded px-3 py-1.5 text-sm font-bold" style={{ background: "var(--color-primary)", color: "#fff" }}>
      {children}
    </button>
  );
}

// ---------- 编辑器主页面 ----------
type SaveState = "saved" | "saving" | "error";

export function ResumeEditor() {
  const { id } = useParams<{ id: string }>();
  const resumeId = Number(id);

  const [title, setTitle] = useState("未命名简历");
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState<number | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(false);
  const [publicLink, setPublicLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载简历 + 主题
  useEffect(() => {
    void (async () => {
      try {
        const [res, themeRes] = await Promise.all([apiGetResume(resumeId), apiGetThemes()]);
        setTitle(res.resume.title);
        setData(res.resume.data);
        setSlug(res.resume.slug);
        setPublished(res.resume.isPublic);
        setPublicLink(`${window.location.origin}/r/${res.resume.slug}`);
        setThemes(themeRes.themes);
      } catch (err) {
        alert(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    })();
    // 当前用户主题
    void (async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        const body = (await res.json()) as { user: { themeId: number | null } };
        setCurrentThemeId(body.user.themeId);
      } catch {
        /* ignore */
      }
    })();
  }, [resumeId]);

  // 自动保存（1s 防抖）
  const scheduleSave = useCallback(
    (next: ResumeData) => {
      setSaveState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await apiUpdateResume(resumeId, { data: next });
          setSaveState("saved");
        } catch {
          setSaveState("error");
        }
      }, 1000);
    },
    [resumeId]
  );

  const update = useCallback(
    (mutate: (d: ResumeData) => ResumeData) => {
      setData((prev) => {
        const next = mutate(structuredClone(prev));
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const setBasic = (patch: Partial<BasicSection>) => update((d) => ({ ...d, basic: { ...d.basic, ...patch } }));

  // 数组字段更新辅助：updateWork(i)({ company: v })
  const updateWork = (i: number) => (patch: Partial<ExperienceItem>) =>
    update((d) => ({ ...d, workExperience: d.workExperience.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const updateProject = (i: number) => (patch: Partial<ProjectItem>) =>
    update((d) => ({ ...d, projects: d.projects.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const updateEdu = (i: number) => (patch: Partial<EducationItem>) =>
    update((d) => ({ ...d, education: d.education.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const updateSkill = (i: number) => (patch: Partial<SkillItem>) =>
    update((d) => ({ ...d, skills: d.skills.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const updateCert = (i: number) => (patch: Partial<CertItem>) =>
    update((d) => ({ ...d, certs: d.certs.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  // 发布
  const doPublish = async () => {
    setBusy(true);
    try {
      if (slug.trim()) await apiUpdateResume(resumeId, { slug: slug.trim() });
      const res = await apiPublishResume(resumeId, true);
      setPublished(true);
      setPublicLink(`${window.location.origin}/r/${res.resume.slug}`);
      setPublishOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "发布失败");
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    setBusy(true);
    try {
      await apiPublishResume(resumeId, false);
      setPublished(false);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    void navigator.clipboard?.writeText(publicLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // 主题切换：本地预览 + 持久化
  const applyThemePreview = useCallback((theme: ThemeItem | null) => {
    const tokens = theme?.tokens ?? {};
    document.documentElement.style.cssText = Object.entries(tokens)
      .map(([k, v]) => `${k}: ${v};`)
      .join("\n");
  }, []);
  const selectTheme = (theme: ThemeItem) => {
    setCurrentThemeId(theme.id);
    applyThemePreview(theme);
    void apiUpdateMe({ themeId: theme.id }).catch(() => undefined);
  };

  const saveStatus = saveState === "saving" ? "保存中…" : saveState === "error" ? "保存失败，请重试" : "已保存";

  if (loading) return <p className="text-sm" style={{ color: "var(--color-muted)" }}>加载中…</p>;

  return (
    <div>
      {/* 顶栏 */}
      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <Link to="/app" className="text-sm" style={{ color: "var(--color-muted)" }}>← 工作台</Link>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => void apiUpdateResume(resumeId, { title }).catch(() => undefined)}
          className="flex-1 rounded border px-3 py-1.5 text-sm font-bold"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        />
        <span className="text-xs" style={{ color: "var(--color-muted)" }}>{saveStatus}</span>
        <select
          value={currentThemeId ?? ""}
          onChange={(e) => {
            const t = themes.find((x) => x.id === Number(e.target.value));
            if (t) selectTheme(t);
          }}
          className="rounded border px-2 py-1.5 text-sm"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <option value="" disabled>选择主题</option>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {published ? (
          <button onClick={() => void unpublish()} disabled={busy} className="rounded px-4 py-1.5 text-sm font-bold" style={{ border: "1px solid var(--color-border)" }}>
            已发布 · 下架
          </button>
        ) : (
          <button onClick={() => setPublishOpen(true)} className="rounded px-4 py-1.5 text-sm font-bold" style={{ background: "var(--color-primary)", color: "#fff" }}>
            发布
          </button>
        )}
        {published && (
          <span className="flex items-center gap-2 text-xs" style={{ color: "var(--color-muted)" }}>
            <a href={publicLink} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>查看分享页 ↗</a>
            <button onClick={copyLink} className="rounded px-2 py-1" style={{ border: "1px solid var(--color-border)" }}>
              {copied ? "已复制 ✓" : "复制链接"}
            </button>
          </span>
        )}
      </div>

      {/* 分栏：左表单 / 右预览 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左：编辑表单 */}
        <div>
          <Section title="基本信息">
            <div className="grid grid-cols-2 gap-3">
              <Field label="姓名" value={data.basic.name ?? ""} onChange={(v) => setBasic({ name: v })} placeholder="李佳铭" />
              <Field label="求职意向" value={data.basic.title ?? ""} onChange={(v) => setBasic({ title: v })} placeholder="全栈开发工程师" />
              <Field label="邮箱" value={data.basic.email ?? ""} onChange={(v) => setBasic({ email: v })} placeholder="you@example.com" />
              <Field label="电话" value={data.basic.phone ?? ""} onChange={(v) => setBasic({ phone: v })} placeholder="13800000000" />
            </div>
            <Field label="所在地" value={data.basic.location ?? ""} onChange={(v) => setBasic({ location: v })} placeholder="北京" />
          </Section>

          <Section title="个人简介">
            <TextArea label="一句话介绍自己" value={data.summary} onChange={(v) => update((d) => ({ ...d, summary: v }))} rows={3} />
          </Section>

          <Section title="工作经历">
            {data.workExperience.map((item, i) => (
              <ItemCard
                key={i}
                title={`${item.company || "经历"} ${i + 1}`}
                onRemove={() => update((d) => ({ ...d, workExperience: d.workExperience.filter((_, j) => j !== i) }))}
              >
                <div className="grid grid-cols-2 gap-2">
                  <Field label="公司" value={item.company} onChange={(v) => updateWork(i)({ company: v })} />
                  <Field label="职位" value={item.role} onChange={(v) => updateWork(i)({ role: v })} />
                </div>
                <Field label="时间段" value={item.period} onChange={(v) => updateWork(i)({ period: v })} placeholder="2022.06 - 2024.08" />
                <TextArea label="工作描述（每行一条）" value={item.description.join("\n")} onChange={(v) => updateWork(i)({ description: v.split("\n") })} rows={3} />
              </ItemCard>
            ))}
            <AddButton onClick={() => update((d) => ({ ...d, workExperience: [...d.workExperience, { company: "", role: "", period: "", description: [] }] }))}>
              + 添加经历
            </AddButton>
          </Section>

          <Section title="项目经历">
            {data.projects.map((item, i) => (
              <ItemCard
                key={i}
                title={`${item.name || "项目"} ${i + 1}`}
                onRemove={() => update((d) => ({ ...d, projects: d.projects.filter((_, j) => j !== i) }))}
              >
                <div className="grid grid-cols-2 gap-2">
                  <Field label="项目名" value={item.name} onChange={(v) => updateProject(i)({ name: v })} />
                  <Field label="角色" value={item.role} onChange={(v) => updateProject(i)({ role: v })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="时间段" value={item.period} onChange={(v) => updateProject(i)({ period: v })} />
                  <Field label="链接" value={item.link} onChange={(v) => updateProject(i)({ link: v })} />
                </div>
                <TextArea label="项目描述（每行一条）" value={item.description.join("\n")} onChange={(v) => updateProject(i)({ description: v.split("\n") })} rows={3} />
              </ItemCard>
            ))}
            <AddButton onClick={() => update((d) => ({ ...d, projects: [...d.projects, { name: "", role: "", period: "", link: "", description: [] }] }))}>
              + 添加项目
            </AddButton>
          </Section>

          <Section title="教育经历">
            {data.education.map((item, i) => (
              <ItemCard key={i} title={`${item.school || "教育"} ${i + 1}`} onRemove={() => update((d) => ({ ...d, education: d.education.filter((_, j) => j !== i) }))}>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="学校" value={item.school} onChange={(v) => updateEdu(i)({ school: v })} />
                  <Field label="学历" value={item.degree} onChange={(v) => updateEdu(i)({ degree: v })} />
                </div>
                <Field label="时间段" value={item.period} onChange={(v) => updateEdu(i)({ period: v })} />
              </ItemCard>
            ))}
            <AddButton onClick={() => update((d) => ({ ...d, education: [...d.education, { school: "", degree: "", period: "" }] }))}>
              + 添加教育
            </AddButton>
          </Section>

          <Section title="技能">
            {data.skills.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <Field label={`技能 ${i + 1}`} value={item.name} onChange={(v) => updateSkill(i)({ name: v })} />
                <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-muted)" }}>
                  熟练度 {item.level}
                  <input type="range" min={0} max={5} value={item.level} onChange={(e) => updateSkill(i)({ level: Number(e.target.value) })} />
                </label>
                <button type="button" onClick={() => update((d) => ({ ...d, skills: d.skills.filter((_, j) => j !== i) }))} className="text-xs" style={{ color: "var(--color-primary)" }}>
                  删除
                </button>
              </div>
            ))}
            <AddButton onClick={() => update((d) => ({ ...d, skills: [...d.skills, { name: "", level: 3 }] }))}>
              + 添加技能
            </AddButton>
          </Section>

          <Section title="证书">
            {data.certs.map((item, i) => (
              <ItemCard key={i} title={`${item.name || "证书"} ${i + 1}`} onRemove={() => update((d) => ({ ...d, certs: d.certs.filter((_, j) => j !== i) }))}>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="证书名" value={item.name} onChange={(v) => updateCert(i)({ name: v })} />
                  <Field label="颁发机构" value={item.issuer} onChange={(v) => updateCert(i)({ issuer: v })} />
                </div>
                <Field label="日期" value={item.date} onChange={(v) => updateCert(i)({ date: v })} />
              </ItemCard>
            ))}
            <AddButton onClick={() => update((d) => ({ ...d, certs: [...d.certs, { name: "", issuer: "", date: "" }] }))}>
              + 添加证书
            </AddButton>
          </Section>
        </div>

        {/* 右：实时预览（与公共页同一 ResumeView 组件 → 打印一致） */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs" style={{ color: "var(--color-muted)" }}>实时预览</p>
          <div className="rounded p-6" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <ResumeView data={data} />
          </div>
        </div>
      </div>

      {/* 发布弹窗 */}
      {publishOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPublishOpen(false)}>
          <div className="w-full max-w-md rounded-lg p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">发布简历</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
              生成专属分享链接（发布后修改内容自动生效；未发布时链接返回 404）
            </p>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs" style={{ color: "var(--color-muted)" }}>专属链接后缀 slug</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }} />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setPublishOpen(false)} className="rounded px-4 py-2 text-sm" style={{ border: "1px solid var(--color-border)" }}>
                取消
              </button>
              <button onClick={() => void doPublish()} disabled={busy} className="rounded px-4 py-2 text-sm font-bold disabled:opacity-50" style={{ background: "var(--color-primary)", color: "#fff" }}>
                {busy ? "发布中…" : "确认发布"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
