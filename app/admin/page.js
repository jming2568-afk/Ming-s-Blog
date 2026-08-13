"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiLogOut, FiSave, FiUpload, FiExternalLink, FiCopy, FiLock } from "react-icons/fi";

export default function AdminPage() {
  const [authed, setAuthed] = useState(null); // null=加载中
  const [password, setPassword] = useState("");
  const [contentText, setContentText] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setAuthed(Boolean(d.ok));
        if (d.ok) loadContent();
      })
      .catch(() => setAuthed(false));
  }, []);

  async function loadContent() {
    try {
      const res = await fetch("/api/content");
      const data = await res.json();
      if (res.ok) {
        setContentText(JSON.stringify(data, null, 2));
        setStatus("内容已加载，直接编辑下方 JSON，保存后网站即时生效。");
      } else {
        setStatus("加载内容失败：" + (data.error || res.status));
      }
    } catch (err) {
      setStatus("加载内容失败：" + err.message);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setStatus("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok) {
      setAuthed(true);
      setPassword("");
      loadContent();
    } else {
      setStatus(data.error || "登录失败");
    }
  }

  async function handleSave() {
    setStatus("");
    let parsed;
    try {
      parsed = JSON.parse(contentText);
    } catch (err) {
      setStatus("JSON 解析失败，未保存：" + err.message);
      return;
    }
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const data = await res.json();
    if (res.ok) {
      const where = data.storage === "blob" ? "已写入 Vercel Blob" : "已写入本地文件";
      setStatus(`保存成功（${where}），刷新网站页面即可看到新内容。`);
    } else {
      setStatus(data.error || "保存失败");
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus("请先选择要上传的文件");
      return;
    }
    setUploading(true);
    setStatus("");
    setUploadedUrl("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setUploadedUrl(data.url);
        setStatus(`上传成功（${(data.size / 1024).toFixed(1)} KB）。把 URL 填入内容 JSON 的对应字段即可。`);
      } else {
        setStatus(data.error || "上传失败");
      }
    } catch (err) {
      setStatus("上传失败：" + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthed(false);
    setContentText("");
    setUploadedUrl("");
    setStatus("已退出登录");
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(uploadedUrl);
      setStatus("URL 已复制到剪贴板");
    } catch {
      setStatus("复制失败，请手动选中复制");
    }
  }

  if (authed === null) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-slate-500">
        加载中…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <FiLock size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">内容管理后台</h1>
              <p className="text-sm text-slate-500">请输入管理员密码</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理员密码"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              登录
            </button>
          </form>
          {status && <p className="mt-4 text-sm text-red-600">{status}</p>}
          <p className="mt-6 text-xs text-slate-400">
            本地开发默认密码 admin123；生产环境请在 Vercel 环境变量配置 ADMIN_PASSWORD。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">内容管理</h1>
          <p className="text-sm text-slate-500">
            编辑 JSON 保存后，网站公开页面即时生效（无需重新部署）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 transition-colors"
          >
            <FiExternalLink /> 查看网站
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            <FiLogOut /> 退出
          </button>
        </div>
      </div>

      {status && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-indigo-800">
          {status}
        </div>
      )}

      {/* 内容编辑 */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">网站内容（content.json）</h2>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <FiSave /> 保存
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          结构：profile（个人信息）/ projects（作品集）/ skills（技能）/ timeline（经历）/ resume（两版简历）
        </p>
        <textarea
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          spellCheck={false}
          className="w-full h-[480px] font-mono text-xs leading-relaxed p-4 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 媒体上传 */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-3">上传图片 / 视频</h2>
        <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="text-sm text-slate-600"
          />
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <FiUpload /> {uploading ? "上传中…" : "上传"}
          </button>
        </form>
        {uploadedUrl && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 break-all">
              {uploadedUrl}
            </code>
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 transition-colors"
            >
              <FiCopy /> 复制
            </button>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          上传后把返回的 URL 填入内容 JSON 对应字段（如 profile.avatar、projects[].cover）。图片可直接使用；单个视频若超过约 4MB，Vercel Hobby 的函数请求体限制会拒绝，建议先用工具压缩或后续升级方案。
        </p>
      </div>
    </div>
  );
}
