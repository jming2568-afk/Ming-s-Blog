"use client";

import { cn } from "@/lib/utils";

const colorBg = {
  red: "bg-mem-red text-white",
  blue: "bg-mem-blue text-white",
  green: "bg-mem-green text-mem-black",
  orange: "bg-mem-orange text-mem-black",
  purple: "bg-mem-purple text-white",
  yellow: "bg-mem-yellow text-mem-black",
  pink: "bg-pink-300 text-mem-black",
  cream: "bg-cream text-mem-black",
  black: "bg-mem-black text-white",
};

export default function UiTag({
  children,
  color = "red", // red|blue|green|orange|purple|yellow|pink|cream|black
  className,
  size = "md", // sm | md
  onRemove,
}) {
  const sizeCls =
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-display tracking-tight border-memphis rounded-none shadow-memphis-sm",
        colorBg[color] || colorBg.red,
        sizeCls,
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 font-bold leading-none"
          aria-label="移除标签"
        >
          ×
        </button>
      )}
    </span>
  );
}
