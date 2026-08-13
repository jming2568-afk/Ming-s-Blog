"use client";

import { useState } from "react";
import UiButton from "@/components/UiButton";
import UiInput from "@/components/UiInput";
import { changePassword } from "@/lib/settingsStore";

export default function PasswordSettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!oldPassword || !newPassword || !confirm) {
      setError("请填写完整原密码、新密码与确认密码");
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 72) {
      setError("新密码长度需在 6-72 位之间");
      return;
    }
    if (newPassword !== confirm) {
      setError("两次输入的新密码不一致");
      return;
    }
    setSaving(true);
    try {
      await changePassword(oldPassword, newPassword);
      setMsg("✅ 密码修改成功，下次登录请使用新密码");
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message || "修改失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PanelTitle icon="🔑" title="修改登录密码" desc="需验证原密码；新密码长度 6-72 位" />

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

      <form onSubmit={onSubmit} className="p-6 bg-white border-memphis shadow-memphis space-y-5">
        <UiInput
          label="原密码"
          type="password"
          required
          autoComplete="current-password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="请输入当前登录密码"
        />
        <UiInput
          label="新密码"
          type="password"
          required
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="6-72 位新密码"
        />
        <UiInput
          label="确认新密码"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="再次输入新密码"
        />
        <UiButton type="submit" color="red" size="lg" className="w-full" disabled={saving}>
          {saving ? "提交中..." : "🔐 确认修改密码"}
        </UiButton>
      </form>
    </div>
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
