"use client";

import { useState, useEffect } from "react";
import UiButton from "@/components/UiButton";
import UiInput from "@/components/UiInput";
import MediaUploader from "@/components/MediaUploader";
import { fetchSettings, updateSettings } from "@/lib/settingsStore";

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    github: "",
    githubUrl: "",
    location: "",
    wechatId: "",
    bioShort: "",
    bioLong: "",
    titlesStr: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [certPhotoUrl, setCertPhotoUrl] = useState("");
  const [wechatQrUrl, setWechatQrUrl] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { settings } = await fetchSettings({ force: true });
        setForm({
          displayName: settings.displayName || "",
          email: settings.email || "",
          github: settings.github || "",
          githubUrl: settings.githubUrl || "",
          location: settings.location || "",
          wechatId: settings.wechatId || "",
          bioShort: settings.bioShort || "",
          bioLong: settings.bioLong || "",
          titlesStr: Array.isArray(settings.titles) ? settings.titles.join("，") : "",
        });
        setAvatarUrl(settings.avatarUrl || "");
        setCertPhotoUrl(settings.certPhotoUrl || "");
        setWechatQrUrl(settings.wechatQrUrl || "");
      } catch (err) {
        setError(err.message || "读取设置失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setSaving(true);
    try {
      const titles = form.titlesStr
        .split(/[,，、]/)
        .map((t) => t.trim())
        .filter(Boolean);
      await updateSettings({
        displayName: form.displayName,
        email: form.email,
        github: form.github,
        githubUrl: form.githubUrl,
        location: form.location,
        wechatId: form.wechatId,
        bioShort: form.bioShort,
        bioLong: form.bioLong,
        titles,
        avatarUrl,
        certPhotoUrl,
        wechatQrUrl,
      });
      setMsg("✅ 个人资料已保存，全站同步生效");
    } catch (err) {
      setError(err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-white border-memphis shadow-memphis-sm animate-pulse">
        <div className="h-6 bg-cream border-memphis w-1/2 mb-4" />
        <div className="h-4 bg-cream/60 w-full mb-2" />
        <div className="h-4 bg-cream/60 w-5/6" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PanelTitle
        icon="👤"
        title="个人资料"
        desc="展示名称、头像、联系方式等将全站同步（导航栏 / 首页 / 简历 / 联系页 / 页脚）"
      />

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

      {/* 展示媒体上传 */}
      <div className="p-6 bg-white border-memphis shadow-memphis">
        <h4 className="font-display tracking-tight text-mem-black text-lg mb-4 flex items-center gap-2">
          🖼 展示媒体
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-bold font-display tracking-tight text-mem-black mb-2">
              个人头像
            </label>
            <MediaUploader
              key={`avatar-${avatarUrl}`}
              accept="image/*"
              value={{ url: avatarUrl, type: "image" }}
              onUploaded={({ url }) => setAvatarUrl(url)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold font-display tracking-tight text-mem-black mb-2">
              简历证件照
            </label>
            <MediaUploader
              key={`cert-${certPhotoUrl}`}
              accept="image/*"
              value={{ url: certPhotoUrl, type: "image" }}
              onUploaded={({ url }) => setCertPhotoUrl(url)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold font-display tracking-tight text-mem-black mb-2">
              微信二维码
            </label>
            <MediaUploader
              key={`qr-${wechatQrUrl}`}
              accept="image/*"
              value={{ url: wechatQrUrl, type: "image" }}
              onUploaded={({ url }) => setWechatQrUrl(url)}
            />
          </div>
        </div>
        <p className="mt-3 text-xs font-body text-mem-black/50">
          头像显示在导航栏与作品集管理员模式；证件照显示在简历右上角（约两寸方框）；微信二维码显示在联系页底部。
        </p>
      </div>

      {/* 基本信息 */}
      <div className="p-6 bg-white border-memphis shadow-memphis space-y-5">
        <h4 className="font-display tracking-tight text-mem-black text-lg flex items-center gap-2">
          📋 基本信息
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UiInput
            label="展示名称"
            value={form.displayName}
            onChange={(e) => update("displayName", e.target.value)}
            placeholder="如：李佳铭"
          />
          <UiInput
            label="头衔（逗号分隔）"
            value={form.titlesStr}
            onChange={(e) => update("titlesStr", e.target.value)}
            placeholder="AIGC 漫剧制片，全栈开发工程师"
          />
          <UiInput
            label="邮箱"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
          />
          <UiInput
            label="GitHub 昵称"
            value={form.github}
            onChange={(e) => update("github", e.target.value)}
            placeholder="github.com/你的用户名"
          />
          <UiInput
            label="GitHub 链接"
            value={form.githubUrl}
            onChange={(e) => update("githubUrl", e.target.value)}
            placeholder="https://github.com/..."
          />
          <UiInput
            label="意向城市"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="如：杭州"
          />
          <UiInput
            label="微信号"
            value={form.wechatId}
            onChange={(e) => update("wechatId", e.target.value)}
            placeholder="填写后显示在联系页微信号栏"
          />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <UiInput
            label="个人简介（短）"
            textarea
            rows={3}
            value={form.bioShort}
            onChange={(e) => update("bioShort", e.target.value)}
            placeholder="用于首页 Hero 与页脚简介"
          />
          <UiInput
            label="个人简介（长）"
            textarea
            rows={4}
            value={form.bioLong}
            onChange={(e) => update("bioLong", e.target.value)}
            placeholder="完整个人经历介绍"
          />
        </div>
      </div>

      <UiButton type="submit" color="red" size="lg" disabled={saving}>
        {saving ? "保存中..." : "💾 保存个人资料"}
      </UiButton>
    </form>
  );
}

function PanelTitle({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 flex items-center justify-center bg-mem-yellow text-mem-black border-memphis shadow-memphis-sm">
        {icon}
      </span>
      <div>
        <h3 className="font-display tracking-tighter text-xl sm:text-2xl text-mem-black">
          {title}
        </h3>
        {desc && <p className="text-xs font-body text-mem-black/60">{desc}</p>}
      </div>
    </div>
  );
}
