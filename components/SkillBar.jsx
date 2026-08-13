"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { skills } from "@/data/skills";
import UiTag from "@/components/UiTag";
import {
  DecorSolidSquare,
  DecorSolidCircle,
} from "@/components/MemphisDecor";

const BAR_COLORS = ["mem-red", "mem-blue", "mem-green", "mem-orange", "mem-purple", "mem-yellow"];

export default function SkillBar() {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
      {skills.map((group, gi) => (
        <div key={group.category}>
          <div className="flex items-center gap-2 mb-4">
            <DecorSolidSquare
              className="w-5 h-5 border-memphis"
              color={BAR_COLORS[gi % BAR_COLORS.length]}
            />
            <h3 className="font-display tracking-tight text-lg text-mem-black">
              {group.category}
            </h3>
            <span className="flex-1 h-0.5 bg-mem-black/20" />
          </div>
          <div className="space-y-4">
            {group.items.map((skill, si) => {
              const color = BAR_COLORS[(gi + si) % BAR_COLORS.length];
              const bgMap = {
                "mem-red": "bg-mem-red",
                "mem-blue": "bg-mem-blue",
                "mem-green": "bg-mem-green",
                "mem-orange": "bg-mem-orange",
                "mem-purple": "bg-mem-purple",
                "mem-yellow": "bg-mem-yellow",
              };
              return (
                <div key={skill.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-body text-sm text-mem-black">
                      {skill.name}
                    </span>
                    <span className="font-display tracking-tight text-xs text-mem-black/70">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="h-4 bg-white border-memphis overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: animate ? `${skill.level}%` : 0 }}
                      transition={{ duration: 0.9, delay: (gi * 3 + si) * 0.05, ease: "easeOut" }}
                      className={`h-full ${bgMap[color]} relative`}
                    >
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-memphis" />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
