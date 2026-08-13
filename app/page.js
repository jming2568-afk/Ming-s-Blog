"use client";

import { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import SectionTitle from "@/components/SectionTitle";
import ProjectCard from "@/components/ProjectCard";
import SkillBar from "@/components/SkillBar";
import Timeline from "@/components/Timeline";
import Link from "next/link";
import { FiArrowRight, FiMail, FiDownload } from "react-icons/fi";
import UiButton from "@/components/UiButton";
import MemphisDecor, {
  DecorSolidCircle,
  DecorSolidSquare,
  DecorOutlineCircle,
  DecorTriangle,
} from "@/components/MemphisDecor";
import { fetchProjects } from "@/lib/projectsStore";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await fetchProjects();
        setFeatured(all.filter((p) => p.featured).slice(0, 6));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <HeroSection />

      {/* Featured projects section - cream background */}
      <section className="relative bg-cream py-20 sm:py-28 overflow-hidden">
        <MemphisDecor className="absolute inset-0 pointer-events-none opacity-60" seed={7} density="sparse" />
        <DecorSolidSquare
          className="absolute top-10 left-4 w-8 h-8 border-memphis hidden sm:block"
          color="mem-purple"
        />
        <DecorTriangle
          className="absolute top-16 right-20 hidden sm:block"
          color="mem-blue"
          rotate={25}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
            <SectionTitle
              title="精选作品"
              subtitle="AIGC 漫剧制作 + 全栈开发双线成果"
            />
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 group"
            >
              <span className="font-display tracking-tight text-mem-black marker-yellow group-hover:marker-pink transition-all">
                查看全部作品
              </span>
              <span className="w-9 h-9 inline-flex items-center justify-center bg-mem-red text-white border-memphis shadow-memphis-sm group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                <FiArrowRight />
              </span>
            </Link>
          </div>

          {loading ? (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Skills section - alternating cream-pink background */}
      <section className="relative bg-cream-pink py-20 sm:py-28 overflow-hidden border-y-[3px] border-mem-black">
        <DecorDotsBg />
        <DecorSolidCircle
          className="absolute top-16 right-16 w-12 h-12 border-memphis hidden sm:block"
          color="mem-orange"
        />
        <DecorOutlineCircle
          className="absolute bottom-16 left-20 w-16 h-16 hidden sm:block"
          color="mem-black"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <SectionTitle
            title="技能概览"
            subtitle="前端 / 后端 / 部署运维 / AIGC / AI 工程实践"
            center
          />
          <div className="bg-white border-memphis shadow-memphis p-6 sm:p-10">
            <SkillBar />
          </div>
        </div>
      </section>

      {/* Timeline section - cream */}
      <section className="relative bg-cream py-20 sm:py-28 overflow-hidden">
        <MemphisDecor className="absolute inset-0 pointer-events-none opacity-50" seed={13} density="sparse" />
        <DecorSolidSquare
          className="absolute bottom-16 right-24 w-10 h-10 border-memphis hidden sm:block rotate-12"
          color="mem-red"
        />
        <DecorTriangle
          className="absolute top-20 left-16 hidden sm:block"
          color="mem-green"
          rotate={-8}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <SectionTitle
            title="经历时间线"
            subtitle="从电子商务到军旅，再到 AIGC 与全栈开发"
            center
          />
          <Timeline />
        </div>
      </section>

      {/* CTA - Memphis style block */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Background - diagonal split of red + blue with bold stripe pattern */}
        <div className="absolute inset-0 bg-mem-grid opacity-40" />
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 -skew-y-2"
            style={{
              background:
                "linear-gradient(100deg, #FF3B30 0%, #FF3B30 55%, #007AFF 55%, #007AFF 100%)",
            }}
          />
        </div>

        <DecorSolidSquare
          className="absolute top-8 left-10 w-12 h-12 border-memphis hidden sm:block bg-mem-yellow"
          color="mem-yellow"
        />
        <DecorOutlineCircle
          className="absolute bottom-8 right-10 w-20 h-20 hidden sm:block border-memphis bg-white/30"
          color="mem-black"
        />
        <DecorSolidCircle
          className="absolute top-1/3 right-1/4 w-8 h-8 border-memphis bg-mem-green"
          color="mem-green"
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-14 bg-cream border-memphis-thick shadow-memphis-lg">
            <h2 className="font-display tracking-tighter text-3xl sm:text-5xl text-mem-black mb-4 leading-tight">
              想了解更多？
              <span className="marker-yellow block sm:inline">查看完整简历 & 作品集</span>
            </h2>
            <p className="font-body text-base sm:text-lg text-mem-black/70 max-w-2xl mx-auto mb-10">
              无论是漫剧制作合作、全栈开发邀约，还是 AIGC 工具交流，都欢迎直接通过邮件与我联系 ✉️
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <UiButton color="red" size="xl" asChild>
                <Link href="/resume">
                  <FiDownload /> 查看简历
                </Link>
              </UiButton>
              <UiButton color="blue" variant="outline" size="xl" asChild>
                <Link href="/portfolio">
                  📚 作品集
                </Link>
              </UiButton>
              <UiButton color="black" size="xl" asChild>
                <a href={`mailto:jming2568@gmail.com`}>
                  <FiMail /> 发邮件
                </a>
              </UiButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* Inline helpers to avoid missing imports in strict mode */
function DecorDotsBg() {
  return (
    <div
      className="absolute inset-0 opacity-40 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle, #AF52DE 2px, transparent 2px)",
        backgroundSize: "22px 22px",
      }}
    />
  );
}
