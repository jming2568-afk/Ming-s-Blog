"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiArrowRight, FiDownload } from "react-icons/fi";
import { profile } from "@/data/profile";
import { fetchSettings } from "@/lib/settingsStore";
import UiButton from "@/components/UiButton";
import UiTag from "@/components/UiTag";
import MemphisDecor, {
  DecorSolidCircle,
  DecorSolidSquare,
  DecorOutlineCircle,
  DecorTriangle,
  DecorDots,
  DecorStripes,
} from "@/components/MemphisDecor";

const titleColors = [
  { word: "李", color: "text-mem-red" },
  { word: "佳", color: "text-mem-blue" },
  { word: "铭", color: "text-mem-black" },
];

export default function HeroSection() {
  const [data, setData] = useState(profile);

  // 全站同步：用站点设置覆盖展示名称/头衔/简介
  useEffect(() => {
    (async () => {
      try {
        const { settings } = await fetchSettings();
        setData((prev) => ({
          ...prev,
          name: settings.displayName || prev.name,
          titles: settings.titles?.length ? settings.titles : prev.titles,
          bioShort: settings.bioShort || prev.bioShort,
        }));
      } catch {
        /* 保持默认 */
      }
    })();
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-cream">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-mem-grid opacity-60 pointer-events-none" />

      {/* Decorative polka zone - top right */}
      <DecorDots
        className="absolute top-0 right-0 w-[45%] h-[55%] opacity-60"
        color="mem-purple"
        size={4}
        gap={22}
      />
      {/* Decorative stripes - bottom left */}
      <div className="absolute bottom-0 left-0 w-[38%] h-[40%] pointer-events-none opacity-30 overflow-hidden">
        <DecorStripes color="mem-orange" thickness={5} gap={14} angle={-30} className="w-full h-full" />
      </div>

      {/* Top-left shapes cluster */}
      <DecorSolidSquare
        className="absolute top-24 left-8 sm:top-28 sm:left-16 w-10 h-10 sm:w-14 sm:h-14 border-memphis hidden sm:block"
        color="mem-red"
      />
      <DecorSolidCircle
        className="absolute top-44 left-24 sm:top-52 sm:left-40 w-6 h-6 sm:w-8 sm:h-8 border-memphis hidden sm:block"
        color="mem-yellow"
      />

      {/* Right side big shapes */}
      <DecorOutlineCircle
        className="absolute top-32 right-16 w-24 h-24 sm:w-32 sm:h-32 hidden md:block"
        color="mem-black"
      />
      <DecorTriangle
        className="absolute bottom-40 right-28 sm:bottom-48 sm:right-44 hidden md:block"
        color="mem-green"
        rotate={-18}
      />
      <DecorSolidCircle
        className="absolute bottom-24 right-16 w-12 h-12 sm:w-16 sm:h-16 border-memphis hidden md:block"
        color="mem-blue"
      />
      {/* Random Memphis scatter */}
      <MemphisDecor className="absolute inset-0 pointer-events-none hidden lg:block" seed={42} density="normal" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: -20, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 20 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-mem-yellow border-memphis shadow-memphis-sm mb-6"
            >
              <span className="w-2.5 h-2.5 bg-mem-red rounded-full border-memphis animate-pulse" />
              <span className="font-display tracking-wider text-xs sm:text-sm text-mem-black">
                你好，我是 / HELLO WORLD
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
              }}
              className="font-display tracking-tighter leading-[0.95] text-5xl sm:text-7xl lg:text-[6.5rem] text-mem-black mb-6"
            >
              <span className="block">
                {data.name.split("").map((ch, i) => {
                  const palette = ["text-mem-red", "text-mem-blue", "text-mem-black", "text-mem-purple"];
                  return (
                    <motion.span
                      key={i}
                      variants={{
                        hidden: { y: 80, opacity: 0, rotate: -8 },
                        show: {
                          y: 0,
                          opacity: 1,
                          rotate: 0,
                          transition: { type: "spring", stiffness: 200, damping: 20 },
                        },
                      }}
                      className={cn("inline-block", palette[i % palette.length])}
                    >
                      {ch}
                    </motion.span>
                  );
                })}
              </span>
              <span className="block mt-2">
                <motion.span
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.45 }}
                  className="marker-yellow"
                >
                  AIGC 漫剧 + 全栈开发
                </motion.span>
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 180 }}
              className="flex flex-wrap items-center gap-2 sm:gap-3 mb-8"
            >
              {data.titles.map((t, i) => (
                <UiTag
                  key={t}
                  color={["red", "blue", "green", "orange"][i % 4]}
                  size="md"
                >
                  ✦ {t}
                </UiTag>
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, type: "spring", stiffness: 180 }}
              className="text-base sm:text-lg font-body text-mem-black/80 max-w-2xl mb-10 leading-relaxed"
            >
              {(() => {
                const parts = data.bioShort.split(/(AIGC 漫剧一线生产与管理经验|企业级 AIGC 平台独立开发经验|既懂内容生产现场，也懂工具与效率)/);
                return parts.map((p, i) => {
                  if (p.includes("AIGC") || p.includes("企业级") || p.includes("既懂")) {
                    return (
                      <span key={i} className="marker-yellow">
                        {p}
                      </span>
                    );
                  }
                  return <span key={i}>{p}</span>;
                });
              })()}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 180 }}
              className="flex flex-wrap items-center gap-4"
            >
              <UiButton color="red" size="xl" asChild>
                <Link href="/resume">
                  查看简历 <FiArrowRight />
                </Link>
              </UiButton>
              <UiButton color="blue" variant="outline" size="xl">
                <Link href="/portfolio">
                  浏览作品集 <FiDownload className="-rotate-45" />
                </Link>
              </UiButton>
            </motion.div>

            {/* Highlight cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, type: "spring", stiffness: 150 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-14 max-w-4xl"
            >
              {profile.highlights.map((h, i) => {
                const colors = [
                  { bg: "bg-mem-red", fg: "text-white" },
                  { bg: "bg-mem-blue", fg: "text-white" },
                  { bg: "bg-mem-yellow", fg: "text-mem-black" },
                  { bg: "bg-mem-green", fg: "text-mem-black" },
                ];
                const c = colors[i % colors.length];
                return (
                  <div
                    key={h.label}
                    className={cn(
                      "p-3 sm:p-4 border-memphis shadow-memphis relative overflow-hidden",
                      c.bg
                    )}
                    style={{ transform: `rotate(${[-1.2, 0.8, -0.5, 1.5][i]}deg)` }}
                  >
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full border-memphis bg-white/90" />
                    <p className={cn("font-fancy text-3xl sm:text-4xl", c.fg)}>
                      {h.value}
                    </p>
                    <p className={cn("mt-2 font-display tracking-tight text-xs sm:text-sm", c.fg)}>
                      {h.label}
                    </p>
                    <p className={cn("mt-0.5 font-body text-[10px] sm:text-xs opacity-80 leading-tight", c.fg)}>
                      {h.desc}
                    </p>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Right illustration column (decorative) */}
          <div className="lg:col-span-4 relative h-[420px] hidden lg:block">
            <motion.div
              initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
              animate={{ rotate: 4, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.3 }}
              className="absolute top-0 right-0 w-[82%] h-[70%] bg-mem-yellow border-memphis-thick shadow-memphis-lg overflow-hidden"
            >
              <div className="w-full h-full bg-polka-red opacity-70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-8xl tracking-tighter text-mem-black" style={{ filter: "drop-shadow(4px 4px 0 #FFF)" }}>
                  漫
                </span>
              </div>
              <DecorSolidSquare
                className="absolute -bottom-3 -left-3 w-14 h-14 border-memphis"
                color="mem-blue"
              />
            </motion.div>

            <motion.div
              initial={{ rotate: 10, scale: 0.85, opacity: 0 }}
              animate={{ rotate: -6, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.5 }}
              className="absolute bottom-0 left-0 w-[65%] h-[55%] bg-mem-green border-memphis-thick shadow-memphis-lg overflow-hidden"
            >
              <div className="w-full h-full bg-stripes-orange opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-7xl tracking-tighter text-mem-black" style={{ filter: "drop-shadow(4px 4px 0 #FFF)" }}>
                  码
                </span>
              </div>
              <DecorOutlineCircle
                className="absolute -top-4 -right-4 w-16 h-16 border-[3px] border-mem-black bg-white"
                color="mem-black"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function cn(...args) {
  return args.filter(Boolean).join(" ");
}
