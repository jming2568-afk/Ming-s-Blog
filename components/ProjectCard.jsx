"use client";

import { FiFilm, FiCode, FiUsers, FiClock } from "react-icons/fi";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ProjectCard({ project, index = 0 }) {
  const isManga = project.category === "manga";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-shadow"
    >
      {/* 封面占位 */}
      <div
        className={cn(
          "h-32 flex items-center justify-center relative overflow-hidden",
          isManga
            ? "bg-gradient-to-br from-indigo-500 to-purple-600"
            : "bg-gradient-to-br from-slate-700 to-indigo-800"
        )}
      >
        {isManga ? (
          <FiFilm className="text-white/80 text-5xl group-hover:scale-110 transition-transform" />
        ) : (
          <FiCode className="text-white/80 text-5xl group-hover:scale-110 transition-transform" />
        )}
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-slate-700">
          {isManga ? "AIGC 漫剧" : "开发项目"}
        </span>
      </div>

      {/* 内容 */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{project.title}</h3>
        <p className="text-sm text-slate-500 mb-3">{project.tagline}</p>

        <div className="space-y-1.5 mb-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <FiUsers className="text-slate-400 shrink-0" size={14} />
            <span className="truncate">{project.role}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <FiClock className="text-slate-400 shrink-0" size={14} />
            <span className="truncate">{project.episodes} · {project.team}</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{project.result}</p>

        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium",
                isManga
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
