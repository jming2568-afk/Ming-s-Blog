import ResumeTabs from "@/components/ResumeTabs";
import SectionTitle from "@/components/SectionTitle";
import {
  DecorSolidSquare,
  DecorSolidCircle,
  DecorOutlineCircle,
} from "@/components/MemphisDecor";

export const metadata = {
  title: "简历 | 李佳铭",
  description: "李佳铭简历 — AIGC 漫剧制片方向 / 全栈开发方向双版本",
};

export default function ResumePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <div className="relative mb-12">
        <DecorSolidSquare
          className="absolute -top-4 -left-2 w-8 h-8 opacity-60"
          color="mem-orange"
        />
        <DecorSolidCircle
          className="absolute top-10 -right-1 w-5 h-5"
          color="mem-purple"
        />
        <DecorOutlineCircle
          className="absolute -top-6 right-20 w-10 h-10 opacity-60"
          color="mem-blue"
        />
        <SectionTitle
          title="RESUME · 个人简历"
          subtitle="双版本简历，点击上方标签切换方向。右上角按钮可直接打印为 PDF。"
        />
      </div>
      <ResumeTabs />
    </div>
  );
}
