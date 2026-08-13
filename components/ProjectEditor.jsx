"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiPlus, FiEye } from "react-icons/fi";
import UiButton from "@/components/UiButton";
import UiInput from "@/components/UiInput";
import UiTag from "@/components/UiTag";
import MediaUploader from "@/components/MediaUploader";
import ProjectCard from "@/components/ProjectCard";
import { createProject, updateProject } from "@/lib/projectsStore";
import { cn } from "@/lib/utils";

const TAG_COLORS = ["red", "blue", "green", "orange", "purple", "yellow", "pink"];

export default function ProjectEditor({ open, onClose, project, onSaved }) {
  const isEdit = !!project;

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "manga",
    role: "",
    tagline: "",
    episodes: "",
    team: "",
    result: "",
    tags: [],
    featured: false,
    mediaUrl: "",
    mediaType: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (project) {
        setForm({
          title: project.title || "",
          slug: project.slug || "",
          category: project.category || "manga",
          role: project.role || "",
          tagline: project.tagline || "",
          episodes: project.episodes || "",
          team: project.team || "",
          result: project.result || "",
          tags: Array.isArray(project.tags) ? [...project.tags] : [],
          featured: !!project.featured,
          mediaUrl: project.mediaUrl || project.media_url || "",
          mediaType: project.mediaType || project.media_type || "",
        });
      } else {
        setForm({
          title: "",
          slug: "",
          category: "manga",
          role: "",
          tagline: "",
          episodes: "",
          team: "",
          result: "",
          tags: [],
          featured: false,
          mediaUrl: "",
          mediaType: "",
        });
      }
      setTagInput("");
      setError("");
      setSaving(false);
    }
  }, [open, project]);

  const updateField = (key, value) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "title" && !isEdit && !f.slug) {
        const slug = value
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
          .replace(/^-+|-+$/g, "");
        next.slug = slug;
      }
      return next;
    });

  const addTag = (e) => {
    e?.preventDefault();
    const t = tagInput.trim();
    if (!t) return;
    if (form.tags.includes(t)) {
      setTagInput("");
      return;
    }
    updateField("tags", [...form.tags, t]);
    setTagInput("");
  };

  const removeTag = (idx) => {
    const copy = [...form.tags];
    copy.splice(idx, 1);
    updateField("tags", copy);
  };

  const previewProject = useMemo(() => {
    const p = {
      id: form.slug || "preview",
      slug: form.slug || "preview",
      title: form.title || "作品标题预览",
      category: form.category,
      role: form.role,
      tagline: form.tagline,
      episodes: form.episodes,
      team: form.team,
      result: form.result,
      tags: form.tags,
      featured: form.featured,
      mediaUrl: form.mediaUrl,
      mediaType: form.mediaType,
    };
    return p;
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("标题不能为空");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: form.slug || undefined,
        title: form.title,
        category: form.category,
        role: form.role,
        tagline: form.tagline,
        episodes: form.episodes,
        team: form.team,
        result: form.result,
        tags: form.tags,
        featured: form.featured,
        mediaUrl: form.mediaUrl || null,
        mediaType: form.mediaType || null,
      };
      const saved = isEdit
        ? await updateProject(project.id, payload)
        : await createProject(payload);
      onSaved?.(saved, isEdit ? "update" : "create");
      onClose?.();
    } catch (err) {
      setError(err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-stretch justify-end"
        >
          <div
            className="absolute inset-0 bg-mem-black/50"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,215,0,0.15) 2px, transparent 2px)",
              backgroundSize: "20px 20px",
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 600, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 600, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
            className="relative w-full sm:w-[640px] max-w-full bg-cream border-l-[3px] border-mem-black shadow-memphis-lg overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-cream border-b-[3px] border-mem-black">
              <div className="flex h-3">
                <div className="flex-1 bg-mem-red" />
                <div className="flex-1 bg-mem-orange" />
                <div className="flex-1 bg-mem-yellow" />
                <div className="flex-1 bg-mem-green" />
                <div className="flex-1 bg-mem-blue" />
                <div className="flex-1 bg-mem-purple" />
              </div>
              <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xs text-mem-blue tracking-widest uppercase mb-1">
                    {isEdit ? "Edit Project" : "New Project"}
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl tracking-tighter text-mem-black">
                    {isEdit ? "编辑作品" : "➕ 添加作品"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 bg-white border-memphis shadow-memphis-sm flex items-center justify-center shrink-0 hover:bg-mem-red hover:text-white"
                  aria-label="关闭"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-5">
              {error && (
                <div className="bg-mem-red text-white font-bold text-sm px-4 py-2.5 border-memphis shadow-memphis-sm">
                  ⚠ {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <UiInput
                    label="作品标题"
                    required
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="如：《重生之一条蛇》"
                  />
                </div>
                <UiInput
                  label="Slug（URL 标识）"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="auto-generate"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-bold font-display tracking-tight text-mem-black">
                  分类 <span className="text-mem-red">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "manga", label: "🎬 AIGC 漫剧", color: "red" },
                    { id: "dev", label: "💻 开发项目", color: "blue" },
                  ].map((opt) => {
                    const active = form.category === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateField("category", opt.id)}
                        className={cn(
                          "p-4 font-display tracking-tight border-memphis transition-all text-left",
                          active
                            ? opt.color === "red"
                              ? "bg-mem-red text-white shadow-memphis"
                              : "bg-mem-blue text-white shadow-memphis"
                            : "bg-white hover:shadow-memphis-sm"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UiInput
                  label="担任角色"
                  value={form.role}
                  onChange={(e) => updateField("role", e.target.value)}
                  placeholder="如：组长 / 独立开发"
                />
                <UiInput
                  label="团队/规模"
                  value={form.team}
                  onChange={(e) => updateField("team", e.target.value)}
                  placeholder="如：5-6 人团队"
                />
                <UiInput
                  label="标语/一句话"
                  value={form.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="红果收藏破 100 万的爆款漫剧"
                />
                <UiInput
                  label="集数/版本"
                  value={form.episodes}
                  onChange={(e) => updateField("episodes", e.target.value)}
                  placeholder="如：64 集（3D 版）"
                />
              </div>

              <UiInput
                label="成果/成果描述"
                textarea
                rows={3}
                value={form.result}
                onChange={(e) => updateField("result", e.target.value)}
                placeholder="项目成果、数据、影响力..."
              />

              {/* Tags */}
              <div className="space-y-2">
                <label className="block text-sm font-bold font-display tracking-tight text-mem-black">
                  标签（回车新增）
                </label>
                <form onSubmit={addTag} className="flex gap-2">
                  <UiInput
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="输入标签后按回车"
                    className="flex-1"
                  />
                  <button
                    type="submit"
                    className="shrink-0 w-12 h-[50px] bg-mem-green text-mem-black font-display border-memphis shadow-memphis-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    aria-label="添加标签"
                  >
                    <FiPlus className="mx-auto" size={20} />
                  </button>
                </form>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {form.tags.map((t, i) => (
                      <UiTag
                        key={t + i}
                        color={TAG_COLORS[i % TAG_COLORS.length]}
                        onRemove={() => removeTag(i)}
                      >
                        {t}
                      </UiTag>
                    ))}
                  </div>
                )}
              </div>

              {/* Featured */}
              <label className="flex items-center gap-3 p-3 bg-white border-memphis shadow-memphis-sm cursor-pointer hover:shadow-memphis transition-shadow">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => updateField("featured", e.target.checked)}
                  className="w-5 h-5 accent-mem-red"
                />
                <div>
                  <p className="font-display text-mem-black tracking-tight">
                    ⭐ 精选作品
                  </p>
                  <p className="text-xs font-body text-mem-black/60">
                    勾选后将在首页精选区块展示
                  </p>
                </div>
              </label>

              {/* Upload cover */}
              <div>
                <label className="block text-sm font-bold font-display tracking-tight text-mem-black mb-2">
                  封面 / 展示媒体
                </label>
                <MediaUploader
                  accept="image/*,video/*"
                  value={{ url: form.mediaUrl, type: form.mediaType }}
                  onUploaded={({ url, type }) => {
                    updateField("mediaUrl", url);
                    updateField("mediaType", type);
                  }}
                />
              </div>

              {/* Preview */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiEye className="text-mem-blue" />
                  <p className="font-display text-sm tracking-tight text-mem-black">
                    实时预览卡片
                  </p>
                </div>
                <div className="max-w-sm bg-cream-pink p-4 border-memphis shadow-memphis-sm">
                  <ProjectCard project={previewProject} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t-2 border-mem-black/20 sticky bottom-0 bg-cream/95 backdrop-blur p-2 sm:p-0 sm:bg-transparent">
                <UiButton
                  type="button"
                  color="black"
                  variant="outline"
                  className="sm:flex-1"
                  onClick={onClose}
                  disabled={saving}
                >
                  取消
                </UiButton>
                <UiButton
                  type="submit"
                  color="red"
                  size="lg"
                  className="sm:flex-[2]"
                  disabled={saving}
                >
                  {saving
                    ? "保存中..."
                    : isEdit
                      ? "💾 保存修改"
                      : "✨ 创建作品"}
                </UiButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
