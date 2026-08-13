import ProjectFilter from "@/components/ProjectFilter";
import { getContent } from "@/lib/content";

export const metadata = {
  title: "作品集 | 李佳铭",
  description: "李佳铭作品集 — AIGC 漫剧项目 + 全栈开发项目",
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const content = await getContent();
  const { projects, projectCategories } = content;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">作品集</h1>
      <p className="text-slate-500 mb-10">
        AIGC 漫剧制作项目（6 部，累计 400+ 集）与全栈开发项目。点击分类筛选。
      </p>
      <ProjectFilter projects={projects} projectCategories={projectCategories} />
    </div>
  );
}
