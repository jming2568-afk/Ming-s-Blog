"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPrinter, FiBriefcase, FiAward, FiBookOpen, FiCode, FiZap, FiStar } from "react-icons/fi";
import { resumeVersions } from "@/data/resume";
import { cn } from "@/lib/utils";
import UiButton from "@/components/UiButton";
import UiTag from "@/components/UiTag";
import {
  DecorSolidCircle,
  DecorSolidSquare,
  DecorOutlineCircle,
  DecorTriangle,
} from "@/components/MemphisDecor";

const TAB_COLORS = {
  aigc: "mem-red",
  dev: "mem-blue",
};

const TAB_PALETTE = {
  aigc: {
    header: "bg-mem-red text-white",
    headerAlt: "bg-mem-yellow text-mem-black",
    accent: "mem-red",
    accentBg: "bg-mem-red",
    accentText: "text-mem-red",
    marker: "marker-yellow",
    tagColor: "red",
  },
  dev: {
    header: "bg-mem-blue text-white",
    headerAlt: "bg-mem-green text-mem-black",
    accent: "mem-blue",
    accentBg: "bg-mem-blue",
    accentText: "text-mem-blue",
    marker: "marker-green",
    tagColor: "blue",
  },
};

export default function ResumeTabs() {
  const [active, setActive] = useState("aigc");
  const data = resumeVersions[active];
  const palette = TAB_PALETTE[active] || TAB_PALETTE.aigc;

  return (
    <div>
      {/* 版本切换 */}
      <div className="flex flex-wrap items-center gap-3 mb-10">
        {Object.values(resumeVersions).map((v) => {
          const isActive = active === v.id;
          const colorKey = TAB_COLORS[v.id] || "mem-black";
          return (
            <button
              key={v.id}
              onClick={() => setActive(v.id)}
              className={cn(
                "relative px-6 py-3 font-display tracking-tight border-memphis transition-all duration-75",
                isActive
                  ? cn(
                      `bg-${colorKey} text-white shadow-memphis-sm`,
                      colorKey === "mem-red" && "bg-mem-red",
                      colorKey === "mem-blue" && "bg-mem-blue"
                    )
                  : "bg-white text-mem-black hover:bg-cream"
              )}
              style={{
                backgroundColor: isActive
                  ? colorKey === "mem-red"
                    ? "#FF3B30"
                    : colorKey === "mem-blue"
                      ? "#007AFF"
                      : undefined
                  : undefined,
              }}
            >
              <span className="flex items-center gap-2">
                {v.id === "aigc" ? <FiStar /> : <FiCode />}
                {v.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-mem-yellow border-memphis rotate-45" />
              )}
            </button>
          );
        })}

        <UiButton
          variant="outline"
          color="black"
          className="ml-auto no-print"
          onClick={() => window.print()}
        >
          <FiPrinter className="-mt-0.5" /> 打 印
        </UiButton>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* 求职意向 Header */}
          <div className="relative mb-8 border-memphis-thick shadow-memphis overflow-hidden">
            <div className={cn("px-6 py-5 relative", palette.header)}>
              <DecorSolidCircle
                className="absolute top-2 right-6 w-5 h-5 opacity-80"
                color="mem-yellow"
              />
              <DecorOutlineCircle
                className="absolute bottom-2 right-16 w-8 h-8 opacity-50"
                color="white"
              />
              <p className="text-xs font-display tracking-widest uppercase opacity-80 mb-1">
                求职意向 / Target Role
              </p>
              <h2 className="font-display tracking-tighter text-2xl sm:text-3xl">
                {data.title}
              </h2>
            </div>
            <div className={cn("px-6 py-4 border-t-[3px] border-mem-black bg-cream-pink")}>
              <p className="text-sm font-body text-mem-black/80 leading-relaxed">
                {data.summary}
              </p>
            </div>
          </div>

          {/* 工作经历 */}
          <SectionBlock
            icon={<FiBriefcase className={palette.accentText} />}
            title="工作经历"
            accentBg={palette.accentBg}
          >
            {data.workExperience.map((work, i) => (
              <div
                key={i}
                className="mb-4 p-5 bg-white border-memphis shadow-memphis-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-4 h-4 bg-mem-yellow border-l-[3px] border-b-[3px] border-mem-black" />
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                  <h4 className="font-display tracking-tight text-lg text-mem-black">
                    {work.company}
                  </h4>
                  <UiTag size="sm" color={palette.tagColor}>
                    {work.period}
                  </UiTag>
                </div>
                <p
                  className={cn(
                    "font-display tracking-tight text-base mb-3",
                    palette.accentText
                  )}
                >
                  {work.role}
                </p>
                <ul className="space-y-2">
                  {work.points.map((p, j) => (
                    <li
                      key={j}
                      className="text-sm font-body text-mem-black/85 flex gap-3"
                    >
                      <span
                        className={cn(
                          "mt-1.5 w-2 h-2 shrink-0 rotate-45 border-memphis",
                          palette.accentBg
                        )}
                      />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </SectionBlock>

          {/* 代表作品 / 核心项目 */}
          {data.works ? (
            <SectionBlock
              icon={<FiAward className={palette.accentText} />}
              title="代表作品"
              accentBg={palette.accentBg}
            >
              <div className="border-memphis-thick shadow-memphis overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={palette.headerAlt}>
                      <th className="text-left px-4 py-3 font-display tracking-widest uppercase text-xs border-b-[3px] border-r-[3px] border-mem-black">
                        作品
                      </th>
                      <th className="text-left px-4 py-3 font-display tracking-widest uppercase text-xs border-b-[3px] border-r-[3px] border-mem-black">
                        角色
                      </th>
                      <th className="text-left px-4 py-3 font-display tracking-widest uppercase text-xs border-b-[3px] border-mem-black">
                        成果
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mem-black/20 bg-white">
                    {data.works.map((w, i) => (
                      <tr key={i} className="hover:bg-cream transition-colors">
                        <td className="px-4 py-3 font-display text-mem-black border-r-2 border-mem-black/10">
                          {w.name}
                        </td>
                        <td className="px-4 py-3 font-body text-mem-black/80 border-r-2 border-mem-black/10">
                          {w.role}
                        </td>
                        <td className="px-4 py-3 font-body text-mem-black/80">
                          <span className={palette.marker}>{w.result}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionBlock>
          ) : (
            <SectionBlock
              icon={<FiCode className={palette.accentText} />}
              title="核心项目"
              accentBg={palette.accentBg}
            >
              <div className="space-y-4">
                {data.projects.map((proj, i) => (
                  <div
                    key={i}
                    className="p-5 bg-white border-memphis shadow-memphis-sm relative"
                  >
                    <DecorSolidSquare
                      className="absolute top-2 right-2 w-3 h-3"
                      color="mem-orange"
                    />
                    <h4 className="font-display tracking-tight text-lg text-mem-black">
                      {proj.name}
                    </h4>
                    <p
                      className={cn(
                        "font-display tracking-tight text-sm mb-3",
                        palette.accentText
                      )}
                    >
                      {proj.role}
                    </p>
                    <ul className="space-y-1.5">
                      {proj.points.map((p, j) => (
                        <li
                          key={j}
                          className="text-sm font-body text-mem-black/85 flex gap-3"
                        >
                          <DecorTriangle
                            className={cn("w-2.5 h-2.5 mt-1.5 shrink-0", palette.accentText)}
                          />
                          <span className="leading-relaxed">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionBlock>
          )}

          {/* 核心能力 / 技术能力 */}
          {data.abilities ? (
            <SectionBlock
              icon={<FiZap className={palette.accentText} />}
              title="核心能力"
              accentBg={palette.accentBg}
            >
              <div className="grid sm:grid-cols-2 gap-3">
                {data.abilities.map((a, i) => {
                  const colors = ["red", "yellow", "green", "purple"];
                  const c = colors[i % colors.length];
                  const bgMap = {
                    red: "bg-mem-red",
                    yellow: "bg-mem-yellow",
                    green: "bg-mem-green",
                    purple: "bg-mem-purple",
                  };
                  return (
                    <div
                      key={i}
                      className="relative p-4 bg-white border-memphis shadow-memphis-sm overflow-hidden"
                    >
                      <div
                        className={cn(
                          "absolute -left-1 top-0 bottom-0 w-1.5 border-r-memphis",
                          bgMap[c]
                        )}
                      />
                      <p className="font-display tracking-tight text-mem-black mb-1 pl-2">
                        {a.item}
                      </p>
                      <p className="text-sm font-body text-mem-black/70 pl-2 leading-relaxed">
                        {a.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </SectionBlock>
          ) : (
            <SectionBlock
              icon={<FiCode className={palette.accentText} />}
              title="技术能力"
              accentBg={palette.accentBg}
            >
              <div className="border-memphis-thick shadow-memphis overflow-hidden bg-white">
                {data.techStack.map((t, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-4 py-3",
                      i !== data.techStack.length - 1 && "border-b-2 border-mem-black/15"
                    )}
                  >
                    <div className="shrink-0 sm:w-32">
                      <UiTag size="sm" color={palette.tagColor}>
                        {t.cat}
                      </UiTag>
                    </div>
                    <div className="font-body text-sm text-mem-black/85 leading-relaxed pt-1 sm:pt-0">
                      {t.items}
                    </div>
                  </div>
                ))}
              </div>
            </SectionBlock>
          )}

          {/* 服役与教育 */}
          <SectionBlock
            icon={<FiBookOpen className={palette.accentText} />}
            title="服役与教育"
            accentBg={palette.accentBg}
          >
            <div className="space-y-3">
              {data.education.map((e, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 bg-cream border-memphis relative overflow-hidden"
                >
                  <DecorSolidCircle
                    className="absolute top-2 right-3 w-2.5 h-2.5"
                    color={i % 2 === 0 ? "mem-orange" : "mem-purple"}
                  />
                  <span className="font-display text-xs tracking-widest uppercase text-mem-black/50 px-2 py-0.5 bg-white border-memphis-sm">
                    {e.period}
                  </span>
                  <span className="font-display tracking-tight text-mem-black text-base">
                    {e.school}
                  </span>
                  <span className="font-body text-sm text-mem-black/70">{e.desc}</span>
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* 证书 */}
          <SectionBlock
            icon={<FiAward className={palette.accentText} />}
            title="证书"
            accentBg={palette.accentBg}
            last
          >
            <div className="p-5 bg-mem-yellow border-memphis-thick shadow-memphis-sm relative overflow-hidden">
              <DecorOutlineCircle
                className="absolute -right-4 -bottom-4 w-20 h-20 opacity-40"
                color="mem-black"
              />
              <p className="font-body text-mem-black text-base leading-relaxed relative z-10">
                {data.certs}
              </p>
            </div>
          </SectionBlock>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ============ Internal helper ============ */
function SectionBlock({ icon, title, accentBg, children, last = false }) {
  return (
    <section className={cn("mb-10", last && "mb-0")}>
      <div className="flex items-center gap-3 mb-4">
        <span
          className={cn(
            "w-10 h-10 flex items-center justify-center border-memphis shadow-memphis-sm text-lg bg-white"
          )}
        >
          {icon}
        </span>
        <h3 className="font-display tracking-tighter text-xl sm:text-2xl text-mem-black">
          {title}
        </h3>
        <div className={cn("flex-1 h-[5px] border-memphis bg-white ml-1", accentBg)} />
      </div>
      {children}
    </section>
  );
}
