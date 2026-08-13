"use client";

import { useState, useEffect } from "react";
import SectionTitle from "@/components/SectionTitle";
import SettingsPage from "@/components/SettingsPage";
import LoginModal from "@/components/LoginModal";
import UiButton from "@/components/UiButton";
import { useAuth } from "@/components/AuthContext";
import MemphisDecor, {
  DecorSolidSquare,
  DecorSolidCircle,
} from "@/components/MemphisDecor";

export default function SettingsRoute() {
  const { isLoggedIn, isLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [tab, setTab] = useState("profile");

  // 从 URL 读取 tab（避免 useSearchParams 的 Suspense 约束）
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t) setTab(t);
  }, []);

  return (
    <div className="relative min-h-screen bg-cream">
      <DecorSolidSquare
        className="absolute top-6 left-6 w-8 h-8 border-memphis hidden md:block rotate-6"
        color="mem-red"
      />
      <DecorSolidCircle
        className="absolute top-10 right-12 w-10 h-10 border-memphis hidden md:block"
        color="mem-blue"
      />
      <MemphisDecor
        className="absolute inset-0 pointer-events-none opacity-30"
        seed={77}
        density="sparse"
      />

      <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-10">
          <SectionTitle
            title="个人中心"
            subtitle="登录后可修改个人资料、登录密码与双版本简历内容"
          />
        </div>

        {isLoading ? (
          <div className="p-8 bg-white border-memphis shadow-memphis-sm animate-pulse">
            <div className="h-6 bg-cream border-memphis w-1/2 mb-4" />
            <div className="h-4 bg-cream/60 w-full mb-2" />
            <div className="h-4 bg-cream/60 w-5/6" />
          </div>
        ) : isLoggedIn ? (
          <SettingsPage initialTab={tab} />
        ) : (
          <div className="p-8 sm:p-10 bg-white border-memphis-thick shadow-memphis text-center">
            <p className="font-display text-2xl sm:text-3xl tracking-tighter text-mem-black mb-3">
              🔒 需要登录
            </p>
            <p className="font-body text-sm text-mem-black/70 mb-8">
              请使用管理员账号登录后，即可进入个人中心修改个人资料、密码与简历。
            </p>
            <UiButton color="red" size="lg" onClick={() => setLoginOpen(true)}>
              登 录
            </UiButton>
          </div>
        )}
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
