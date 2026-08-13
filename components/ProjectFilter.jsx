"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import ProjectCard from "@/components/ProjectCard";
import UiButton from "@/components/UiButton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import ProjectEditor from "@/components/ProjectEditor";
import {
  fetchProjects,
  deleteProject,
  invalidateProjectsCache,
} from "@/lib/projectsStore";

const projectCategories = [
  { id: "all", label: "全部作品", color: "black" },
  { id: "manga", label: "🎬 AIGC 漫剧", color: "red" },
  { id: "dev", label: "💻 开发项目", color: "blue" },
];

export default function ProjectFilter() {
  const [active, setActive] = useState("all");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const load = async (force = false) => {
    setLoading(true);
    try {
      const list = await fetchProjects({ force });
      setProjects(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered =
    active === "all"
      ? projects
      : projects.filter((p) => p.category === active);

  const onEdit = (project) => {
    setEditing(project);
    setEditorOpen(true);
  };

  const onDelete = async (project) => {
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (e) {
      alert(e.message || "删除失败");
    }
  };

  return (
    <div>
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {projectCategories.map((cat) => {
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={cn(
                  "px-4 py-2.5 font-display tracking-tight border-memphis transition-all",
                  isActive
                    ? cat.color === "red"
                      ? "bg-mem-red text-white shadow-memphis"
                      : cat.color === "blue"
                        ? "bg-mem-blue text-white shadow-memphis"
                        : "bg-mem-black text-white shadow-memphis"
                    : "bg-white hover:shadow-memphis-sm"
                )}
              >
                {cat.label}
                <span className="ml-2 text-xs opacity-70">
                  {cat.id === "all"
                    ? projects.length
                    : projects.filter((p) => p.category === cat.id).length}
                </span>
              </button>
            );
          })}
        </div>

        {!authLoading && isLoggedIn && (
          <UiButton
            color="red"
            size="lg"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <FiPlus /> 添加作品
          </UiButton>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border-memphis bg-white animate-pulse h-[380px]"
            >
              <div className="h-48 bg-mem-grid border-b-[3px] border-mem-black" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-cream border-memphis w-3/4" />
                <div className="h-4 bg-cream/60 w-full" />
                <div className="h-4 bg-cream/60 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project.id || project.slug}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                <ProjectCard
                  project={project}
                  index={i}
                  onEdit={isLoggedIn ? onEdit : undefined}
                  onDelete={isLoggedIn ? onDelete : undefined}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="p-10 sm:p-16 bg-white border-memphis shadow-memphis text-center">
          <p className="font-display text-2xl tracking-tighter mb-2">
            暂无作品
          </p>
          <p className="font-body text-mem-black/60 text-sm mb-5">
            当前分类下没有作品
            {isLoggedIn && "，点击右上角「添加作品」来创建第一个吧"}
          </p>
          {isLoggedIn && (
            <UiButton
              color="orange"
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <FiPlus /> 创建首个作品
            </UiButton>
          )}
        </div>
      )}

      <ProjectEditor
        open={editorOpen}
        project={editing}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSaved={() => load(true)}
      />
    </div>
  );
}
