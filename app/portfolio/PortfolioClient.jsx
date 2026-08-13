"use client";

import ProjectFilter from "@/components/ProjectFilter";
import SectionTitle from "@/components/SectionTitle";
import { useAuth } from "@/components/AuthContext";
import UiButton from "@/components/UiButton";
import { FiRefreshCw, FiPlus, FiUser } from "react-icons/fi";
import MemphisDecor, {
  DecorSolidSquare,
  DecorSolidCircle,
  DecorTriangle,
} from "@/components/MemphisDecor";
import { useState } from "react";
import { invalidateProjectsCache } from "@/lib/projectsStore";

export default function PortfolioClient() {
  const { isLoggedIn, user, isLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const forceRefresh = async () => {
    invalidateProjectsCache();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="relative bg-cream min-h-screen">
      {/* Top corner decor */}
      <DecorSolidSquare
        className="absolute top-6 left-6 w-8 h-8 border-memphis hidden md:block rotate-6"
        color="mem-red"
      />
      <DecorSolidCircle
        className="absolute top-10 right-12 w-10 h-10 border-memphis hidden md:block"
        color="mem-blue"
      />
      <DecorTriangle
        className="absolute top-40 left-20 hidden md:block"
        color="mem-orange"
        rotate={-15}
      />
      <MemphisDecor className="absolute inset-0 pointer-events-none opacity-30" seed={99} density="sparse" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Page header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-mem-yellow border-memphis shadow-memphis-sm mb-5">
            <span className="w-2.5 h-2.5 bg-mem-blue rounded-full border-memphis animate-pulse" />
            <span className="font-display tracking-wider text-xs sm:text-sm text-mem-black">
              PORTFOLIO / 作品档案库
            </span>
          </div>
          <SectionTitle
            title="作品集"
            subtitle="AIGC 漫剧制作项目（6 部，累计 400+ 集）与全栈开发项目成果 — 点击分类筛选浏览"
          />
        </div>

        {/* Admin banner */}
        {!isLoading && isLoggedIn && (
          <div className="mb-8 p-4 sm:p-5 bg-mem-green border-memphis shadow-memphis flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-mem-purple text-white border-memphis flex items-center justify-center font-display text-lg shrink-0">
                {user?.username?.[0]?.toUpperCase() || "A"}
              </div>
              <div>
                <p className="font-display tracking-tight text-mem-black text-lg">
                  🔓 管理员模式：{user?.username}
                </p>
                <p className="text-xs sm:text-sm font-body text-mem-black/80">
                  可以创建新作品、编辑已有作品、删除，或为作品上传图片/视频封面。
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <UiButton
                color="black"
                variant="outline"
                onClick={forceRefresh}
              >
                <FiRefreshCw /> 刷新
              </UiButton>
              <UiButton
                color="red"
                onClick={() => {
                  document
                    .querySelector('button[aria-label*="添加作品"]')
                    ?.click();
                }}
              >
                <FiPlus /> 快速添加
              </UiButton>
            </div>
          </div>
        )}

        {/* Guest call to action hint */}
        {!isLoading && !isLoggedIn && (
          <div className="mb-8 p-4 sm:p-5 bg-white border-memphis shadow-memphis-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-mem-yellow border-memphis flex items-center justify-center shrink-0 mt-0.5">
                <FiUser className="text-mem-black" />
              </div>
              <div>
                <p className="font-display tracking-tight text-mem-black text-base">
                  👋 访客浏览模式
                </p>
                <p className="text-xs sm:text-sm font-body text-mem-black/70 mt-0.5">
                  点击右上角的<span className="marker-yellow">「登录」</span>按钮，
                  使用管理员账号可手动上传作品图片/视频、创建或编辑作品条目。
                </p>
              </div>
            </div>
          </div>
        )}

        <ProjectFilter key={refreshKey} />
      </div>
    </div>
  );
}
