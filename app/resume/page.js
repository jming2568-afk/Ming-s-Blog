import ResumeTabs from "@/components/ResumeTabs";
import { getContent } from "@/lib/content";

export const metadata = {
  title: "简历 | 李佳铭",
  description: "李佳铭简历 — AIGC 漫剧制片方向 / 全栈开发方向双版本",
};

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const content = await getContent();
  const { resume } = content;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">简历</h1>
      <p className="text-slate-500 mb-10">
        双版本简历，点击切换方向。支持打印（点击右上角打印按钮）。
      </p>
      <ResumeTabs resume={resume} />
    </div>
  );
}
