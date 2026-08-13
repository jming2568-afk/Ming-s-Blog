"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UiButton from "@/components/UiButton";
import UiInput from "@/components/UiInput";
import { fetchSettings, saveResume } from "@/lib/settingsStore";
import { resumeVersions as defaultResume } from "@/data/resume";

const clone = (v) => JSON.parse(JSON.stringify(v));

export default function ResumeEditor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { resume: r } = await fetchSettings({ force: true });
        setResume(r);
      } catch (err) {
        setError(err.message || "读取简历失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !resume) {
    return (
      <div className="p-8 bg-white border-memphis shadow-memphis-sm animate-pulse">
        <div className="h-6 bg-cream border-memphis w-1/2 mb-4" />
        <div className="h-4 bg-cream/60 w-full mb-2" />
        <div className="h-4 bg-cream/60 w-5/6" />
      </div>
    );
  }

  const patchVersion = (id, updater) => {
    setResume((r) => ({ ...r, [id]: updater(r[id]) }));
  };

  const onSave = async () => {
    setError("");
    setMsg("");
    setSaving(true);
    try {
      const saved = await saveResume(resume);
      setResume(saved);
      setMsg("✅ 简历已保存，可在「简历」页查看效果");
    } catch (err) {
      setError(err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setError("");
    setMsg("");
    setResume(clone(defaultResume));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display tracking-tighter text-xl sm:text-2xl text-mem-black">
            📄 简历内容管理
          </h3>
          <p className="text-xs font-body text-mem-black/60">
            双版本结构化编辑；展示媒体（证件照）请在「个人资料」面板上传
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UiButton color="black" variant="outline" onClick={() => router.push("/resume")}>
            👁 预览
          </UiButton>
          <UiButton color="blue" variant="outline" onClick={onReset}>
            ↺ 恢复默认
          </UiButton>
          <UiButton color="red" onClick={onSave} disabled={saving}>
            {saving ? "保存中..." : "💾 保存简历"}
          </UiButton>
        </div>
      </div>

      {error && (
        <div className="bg-mem-red text-white font-bold text-sm px-4 py-2.5 border-memphis shadow-memphis-sm">
          ⚠ {error}
        </div>
      )}
      {msg && (
        <div className="bg-mem-green text-mem-black font-bold text-sm px-4 py-2.5 border-memphis shadow-memphis-sm">
          {msg}
        </div>
      )}

      {/* AIGC 版本 */}
      <VersionPanel
        id="aigc"
        version={resume.aigc}
        colorHeader="bg-mem-red text-white"
        onChange={(v) => patchVersion("aigc", () => v)}
        extraSections={
          <>
            {resume.aigc.works && (
              <ListEditor
                title="代表作品"
                items={resume.aigc.works}
                fields={[
                  { key: "name", label: "作品名称" },
                  { key: "role", label: "角色" },
                  { key: "result", label: "成果", textarea: true },
                ]}
                addLabel="添加作品"
                onChange={(list) => patchVersion("aigc", (v) => ({ ...v, works: list }))}
              />
            )}
            {resume.aigc.abilities && (
              <ListEditor
                title="核心能力"
                items={resume.aigc.abilities}
                fields={[
                  { key: "item", label: "能力项" },
                  { key: "desc", label: "描述", textarea: true },
                ]}
                addLabel="添加能力"
                onChange={(list) => patchVersion("aigc", (v) => ({ ...v, abilities: list }))}
              />
            )}
          </>
        }
      />

      {/* DEV 版本 */}
      <VersionPanel
        id="dev"
        version={resume.dev}
        colorHeader="bg-mem-blue text-white"
        onChange={(v) => patchVersion("dev", () => v)}
        extraSections={
          <>
            {resume.dev.projects && (
              <ListEditor
                title="核心项目"
                items={resume.dev.projects}
                fields={[
                  { key: "name", label: "项目名称" },
                  { key: "role", label: "角色/说明" },
                  { key: "points", label: "要点（一行一条）", lines: true, textarea: true },
                ]}
                addLabel="添加项目"
                onChange={(list) => patchVersion("dev", (v) => ({ ...v, projects: list }))}
              />
            )}
            {resume.dev.techStack && (
              <ListEditor
                title="技术栈"
                items={resume.dev.techStack}
                fields={[
                  { key: "cat", label: "分类" },
                  { key: "items", label: "技术点", textarea: true },
                ]}
                addLabel="添加分类"
                onChange={(list) => patchVersion("dev", (v) => ({ ...v, techStack: list }))}
              />
            )}
          </>
        }
      />
    </div>
  );
}

/* ===== 单个版本面板 ===== */
function VersionPanel({ id, version, colorHeader, onChange, extraSections }) {
  const set = (key, value) => onChange({ ...version, [key]: value });
  return (
    <div className="bg-white border-memphis shadow-memphis overflow-hidden">
      <div className={`px-5 py-3 font-display tracking-tight ${colorHeader}`}>
        {version.label || (id === "aigc" ? "AIGC 漫剧制片" : "全栈开发工程师")}
      </div>
      <div className="p-5 space-y-5">
        <UiInput
          label="求职意向标题"
          value={version.title || ""}
          onChange={(e) => set("title", e.target.value)}
        />
        <UiInput
          label="个人简介"
          textarea
          rows={4}
          value={version.summary || ""}
          onChange={(e) => set("summary", e.target.value)}
        />
        <UiInput
          label="证书"
          textarea
          rows={2}
          value={version.certs || ""}
          onChange={(e) => set("certs", e.target.value)}
        />

        <ListEditor
          title="工作经历"
          items={version.workExperience || []}
          fields={[
            { key: "company", label: "公司" },
            { key: "period", label: "时间" },
            { key: "role", label: "职位" },
            { key: "points", label: "工作要点（一行一条）", lines: true, textarea: true },
          ]}
          addLabel="添加工作经历"
          onChange={(list) => set("workExperience", list)}
        />

        <ListEditor
          title="服役与教育"
          items={version.education || []}
          fields={[
            { key: "period", label: "时间" },
            { key: "school", label: "机构" },
            { key: "desc", label: "说明", textarea: true },
          ]}
          addLabel="添加条目"
          onChange={(list) => set("education", list)}
        />

        {extraSections}
      </div>
    </div>
  );
}

/* ===== 通用列表编辑器 ===== */
function ListEditor({ title, items, fields, onChange, addLabel }) {
  const setItem = (idx, key, value) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [key]: value };
    onChange(copy);
  };
  const add = () => {
    const empty = {};
    for (const f of fields) empty[f.key] = f.lines ? [] : "";
    onChange([...items, empty]);
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-display tracking-tight text-mem-black">{title}</h5>
        <button
          type="button"
          onClick={add}
          className="text-sm font-display px-3 py-1 bg-mem-green text-mem-black border-memphis shadow-memphis-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          + {addLabel || "添加"}
        </button>
      </div>
      <div className="space-y-4">
        {(items || []).length === 0 && (
          <p className="text-xs font-body text-mem-black/40 border border-dashed border-mem-black/30 px-4 py-3">
            暂无条目，点击「{addLabel || "添加"}」新增
          </p>
        )}
        {(items || []).map((item, idx) => (
          <div key={idx} className="relative p-4 bg-cream border-memphis-sm space-y-3">
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-2 right-2 w-7 h-7 bg-mem-red text-white border-memphis flex items-center justify-center text-xs hover:bg-white hover:text-mem-red transition-colors"
              aria-label="删除"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
              {fields.map((f) =>
                f.textarea ? (
                  <div key={f.key} className={f.lines ? "sm:col-span-2" : "sm:col-span-2"}>
                    <UiInput
                      label={f.label}
                      textarea
                      rows={f.lines ? 3 : 2}
                      value={f.lines ? (item[f.key] || []).join("\n") : item[f.key] || ""}
                      onChange={(e) =>
                        setItem(
                          idx,
                          f.key,
                          f.lines
                            ? e.target.value
                                .split("\n")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : e.target.value
                        )
                      }
                    />
                  </div>
                ) : (
                  <UiInput
                    key={f.key}
                    label={f.label}
                    value={item[f.key] || ""}
                    onChange={(e) => setItem(idx, f.key, e.target.value)}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
