import HeroSection from "@/components/HeroSection";
import SectionTitle from "@/components/SectionTitle";
import ProjectCard from "@/components/ProjectCard";
import SkillBar from "@/components/SkillBar";
import Timeline from "@/components/Timeline";
import { getContent } from "@/lib/content";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getContent();
  const { profile, projects, skills, timeline } = content;
  const featured = projects.filter((p) => p.featured);

  return (
    <>
      <HeroSection profile={profile} />

      {/* 精选作品 */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-8">
          <SectionTitle title="精选作品" subtitle="AIGC 漫剧制作 + 全栈开发双线成果" />
          <Link
            href="/portfolio"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:gap-2 transition-all"
          >
            查看全部 <FiArrowRight />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"
          >
            查看全部作品 <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* 技能概览 */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <SectionTitle
            title="技能概览"
            subtitle="前端 / 后端 / 部署运维 / AIGC / AI 工程实践"
            center
          />
          <SkillBar skills={skills} />
        </div>
      </section>

      {/* 经历时间线 */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <SectionTitle title="经历时间线" subtitle="从电子商务到军旅，再到 AIGC 与全栈开发" center />
        <Timeline timeline={timeline} />
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-10 sm:p-14 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">想了解更多？</h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            查看完整简历与作品集，或直接通过邮件与我联系。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/resume"
              className="px-6 py-3 rounded-xl bg-white text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
            >
              查看简历
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl bg-indigo-500/40 text-white font-medium hover:bg-indigo-500/60 transition-colors border border-white/30"
            >
              联系我
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
