"use client";

import { timeline } from "@/data/timeline";
import UiTag from "@/components/UiTag";

const PERIOD_COLORS = ["mem-yellow", "mem-red", "mem-green", "mem-blue", "mem-orange", "mem-purple"];
const CARD_BG = ["bg-white", "bg-cream-pink", "bg-white", "bg-cream", "bg-white", "bg-cream-pink"];

export default function Timeline() {
  return (
    <div className="relative">
      {/* Vertical line with memphis style */}
      <div className="absolute left-3 sm:left-4 top-2 bottom-2 w-[4px] bg-mem-black" />

      <div className="space-y-10">
        {timeline.map((item, i) => {
          const periodColor = PERIOD_COLORS[i % PERIOD_COLORS.length];
          const cardBg = CARD_BG[i % CARD_BG.length];
          const tagColors = ["red", "blue", "green", "orange", "purple", "yellow"];
          return (
            <div key={i} className="relative pl-10 sm:pl-14">
              {/* Node */}
              <div
                className={`absolute left-0 top-1 w-7 h-7 sm:w-9 sm:h-9 bg-mem-${periodColor} border-memphis shadow-memphis-sm flex items-center justify-center rotate-45`}
              >
                <span className="w-2 h-2 sm:w-3 sm:h-3 -rotate-45 bg-mem-black rounded-sm" />
              </div>

              <div
                className={`p-5 sm:p-6 ${cardBg} border-memphis shadow-memphis hover:shadow-memphis-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-display tracking-widest border-memphis shadow-memphis-sm bg-mem-${periodColor} text-mem-black`}
                  >
                    {item.period}
                  </span>
                </div>
                <h3 className="font-display text-xl tracking-tighter text-mem-black mb-1">
                  {item.title}
                </h3>
                <p className="text-sm font-display text-mem-blue mb-2">{item.subtitle}</p>
                <p className="text-sm font-body text-mem-black/80 leading-relaxed mb-3">
                  {item.description}
                </p>
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t, ti) => (
                      <UiTag
                        key={t + ti}
                        size="sm"
                        color={tagColors[ti % tagColors.length]}
                      >
                        {t}
                      </UiTag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
