"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiUser, FiLock } from "react-icons/fi";
import { useAuth } from "@/components/AuthContext";
import UiButton from "@/components/UiButton";
import UiInput from "@/components/UiInput";
import { cn } from "@/lib/utils";

export default function LoginModal({ open, onClose }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setUsername("");
      setPassword("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  const fillDemo = () => {
    setUsername("admin");
    setPassword("admin123");
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ username, password });
      onClose?.();
    } catch (err) {
      setError(err.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay with big polka dot pattern */}
          <div
            className="absolute inset-0 bg-mem-black/60"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.15) 3px, transparent 3px)",
              backgroundSize: "28px 28px",
            }}
            onClick={onClose}
          />

          <motion.div
            initial={{ y: 40, scale: 0.9, rotate: -2 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            exit={{ y: 40, scale: 0.9, rotate: 2 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-[92%] max-w-md bg-cream border-memphis-thick shadow-memphis-lg overflow-hidden"
          >
            {/* Colorful top bar */}
            <div className="flex h-3">
              <div className="flex-1 bg-mem-red" />
              <div className="flex-1 bg-mem-yellow" />
              <div className="flex-1 bg-mem-green" />
              <div className="flex-1 bg-mem-blue" />
              <div className="flex-1 bg-mem-purple" />
            </div>

            {/* Close X */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 bg-white border-memphis shadow-memphis-sm flex items-center justify-center hover:bg-mem-red hover:text-white transition-colors"
              aria-label="关闭"
            >
              <FiX size={20} />
            </button>

            <div className="p-7 sm:p-9">
              {/* Title with decorations */}
              <div className="mb-6 flex items-center gap-3">
                <span className="w-7 h-7 bg-mem-red border-memphis shrink-0" />
                <h2 className="font-display text-2xl sm:text-3xl tracking-tighter text-mem-black">
                  管理员登录
                </h2>
                <span className="w-5 h-5 rounded-full border-memphis border-mem-black shrink-0" />
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <UiInput
                  label="用户名"
                  icon={<FiUser />}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  required
                />
                <UiInput
                  label="密码"
                  type="password"
                  icon={<FiLock />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />

                {error && (
                  <motion.div
                    initial={{ x: -8, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="bg-mem-red text-white font-bold text-sm px-4 py-2 border-memphis shadow-memphis-sm"
                  >
                    ⚠ {error}
                  </motion.div>
                )}

                <UiButton
                  type="submit"
                  color="red"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "登录中…" : "🔐 登 录"}
                </UiButton>
              </form>

              <div className="mt-6 pt-5 border-t-2 border-mem-black/20 space-y-3">
                <button
                  type="button"
                  onClick={fillDemo}
                  className="text-sm font-bold text-mem-blue hover:marker-yellow"
                >
                  ✨ 一键填充演示账号
                </button>
                <p className="text-xs font-body text-mem-black/60 leading-relaxed">
                  <span className="font-display text-mem-black">演示账号：</span>
                  <span className="marker-yellow">admin</span> /{" "}
                  <span className="marker-green">admin123</span>
                  <br />
                  当前数据存储于本地 SQLite 数据库与文件系统。
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
