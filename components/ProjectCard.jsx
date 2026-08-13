"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiDownload, FiEdit3, FiTrash2 } from "react-icons/fi";
import { cn } from "@/lib/utils";
import UiTag from "@/components/UiTag";
import { useAuth } from "@/components/AuthContext";

const CATEGORY_BG = {
  manga: "bg-mem-red",
  dev: "bg-mem-blue",
};

// Cover background color palette for no-image placeholders
const COVER_PALETTE = [
  { bg: "bg-mem-yellow", accent: "text-mem-red", dot: "bg-mem-purple" },
  { bg: "bg-mem-green", accent: "text-mem-black", dot: "bg-mem-blue" },
  { bg: "bg-mem-orange", accent: "text-mem-black", dot: "bg-mem-green" },
  { bg: "bg-mem-purple", accent: "text-white", dot: "bg-mem-yellow" },
  { bg: "bg-mem-blue", accent: "text-white", dot: "bg-mem-red" },
  { bg: "bg-pink-300", accent: "text-mem-black", dot: "bg-mem-orange" },
];

function paletteFor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return COVER_PALETTE[h % COVER_PALETTE.length];
}

export default function ProjectCard({
  project,
  index = 0,
  onEdit,
  onDelete,
  className,
}) {
  const { isLoggedIn, isLoading } = useAuth();
  const isManga = project.category === "manga";
  const palette = paletteFor(project.slug || project.title);
  const mediaUrl = project.mediaUrl ?? project.media_url;
  const mediaType = project.mediaType ?? project.media_type;
  const hasImage = mediaType === "image" && !!mediaUrl;
  const hasVideo = mediaType === "video" && !!mediaUrl;
  const initial = (project.title || "?").trim().charAt(0).toUpperCase();
  const videoRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -1 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 22,
        delay: Math.min(index * 0.04, 0.3),
      }}
      whileHover={{ y: -6, rotate: 0.5 }}
      className={cn(
        "group relative bg-white border-memphis shadow-memphis hover:shadow-memphis-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-[shadow,transform] duration-75 overflow-hidden",
        className
      )}
    >
      {/* Edit buttons (only logged in) */}
      {!isLoading && isLoggedIn && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="w-9 h-9 bg-mem-blue text-white border-memphis shadow-memphis-sm flex items-center justify-center hover:bg-white hover:text-mem-blue transition-colors"
              aria-label="编辑"
            >
              <FiEdit3 size={14} />
            </button>
          )}
          {onDelete && (
            <>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-9 h-9 bg-mem-red text-white border-memphis shadow-memphis-sm flex items-center justify-center hover:bg-white hover:text-mem-red transition-colors"
                aria-label="删除"
              >
                <FiTrash2 size={14} />
              </button>
              <AnimatePresence>
                {confirmDelete && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="bg-white border-memphis-thick shadow-memphis-lg p-3 w-56 space-y-2 -mr-2"
                  >
                    <p className="font-display text-mem-black text-sm">
                      确认删除《{project.title}》？
                    </p>
                    <p className="text-xs text-mem-black/60">此操作不可撤销</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 px-2 py-1.5 bg-white text-mem-black border-memphis font-display text-xs"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDelete(false);
                          onDelete(project);
                        }}
                        className="flex-1 px-2 py-1.5 bg-mem-red text-white border-memphis font-display text-xs"
                      >
                        删除
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}

      {/* Category label (top-left) */}
      <div
        className={cn(
          "absolute top-0 left-0 z-10 px-3 py-1.5 text-white text-xs font-display tracking-widest uppercase border-r-[3px] border-b-[3px] border-mem-black",
          CATEGORY_BG[project.category] || "bg-mem-black"
        )}
      >
        {isManga ? "漫剧" : "开发"}
      </div>

      {/* Cover */}
      <div
        className="h-48 relative border-b-[3px] border-mem-black overflow-hidden"
        onMouseEnter={() => hasVideo && videoRef.current?.play?.()}
        onMouseLeave={() => hasVideo && videoRef.current?.pause?.()}
      >
        {hasImage && (
          <img
            src={mediaUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {hasVideo && (
          <video
            ref={videoRef}
            src={mediaUrl}
            muted
            loop
            playsInline
            poster=""
            preload="metadata"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-mem-black"
          />
        )}
        {!hasImage && !hasVideo && (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center relative",
              palette.bg
            )}
          >
            {/* Decorative shapes */}
            <div className={cn("absolute top-4 right-4 w-10 h-10 rounded-full border-[3px] border-mem-black", palette.dot)} />
            <div className="absolute bottom-3 left-4 w-6 h-6 border-memphis bg-white/80 rotate-12" />
            <div className="absolute top-8 left-8 w-3 h-3 bg-mem-black rotate-45" />

            <span
              className={cn(
                "font-display text-7xl sm:text-8xl tracking-tighter select-none",
                palette.accent
              )}
              style={{ filter: "drop-shadow(3px 3px 0 #1A1A1A)" }}
            >
              {initial}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-display text-xl tracking-tighter text-mem-black leading-tight">
            {project.title}
          </h3>
          {project.tagline && (
            <p className="mt-1 text-sm font-body text-mem-black/70 line-clamp-1">
              {project.tagline}
            </p>
          )}
        </div>

        {(project.role || project.episodes || project.team) && (
          <div className="space-y-1 text-sm">
            {project.role && (
              <p className="font-body text-mem-black/80">
                <span className="font-display text-mem-red">角色：</span>
                {project.role}
              </p>
            )}
            {(project.episodes || project.team) && (
              <p className="font-body text-mem-black/80 line-clamp-1">
                <span className="font-display text-mem-blue">产出：</span>
                {[project.episodes, project.team].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        )}

        {project.result && (
          <p className="text-sm font-body text-mem-black/75 leading-relaxed line-clamp-2 marker-yellow inline">
            {project.result}
          </p>
        )}

        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.tags.map((t, i) => (
              <UiTag
                key={t + i}
                size="sm"
                color={["red", "blue", "green", "orange", "purple", "yellow"][i % 6]}
              >
                {t}
              </UiTag>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
