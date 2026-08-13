"use client";

import { cn } from "@/lib/utils";

/* A collection of Memphis-style decorative geometric shapes.
   Usage: <MemphisDecor variant="dots" className="absolute top-4 right-8 w-24 h-24" /> */

export function DecorDots({ className, color = "mem-black", size = 6, gap = 14 }) {
  const colorMap = {
    "mem-black": "#1A1A1A",
    "mem-red": "#FF3B30",
    "mem-blue": "#007AFF",
    "mem-green": "#34C759",
    "mem-orange": "#FF9500",
    "mem-purple": "#AF52DE",
    "mem-yellow": "#FFD60A",
  };
  const c = colorMap[color] || color;
  const pattern = `radial-gradient(circle, ${c} ${size / 2}px, transparent ${size / 2 + 0.5}px) 0 0 / ${gap}px ${gap}px`;
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={{ background: pattern }}
    />
  );
}

export function DecorStripes({ className, color = "mem-black", thickness = 3, gap = 10, angle = 45 }) {
  const colorMap = {
    "mem-black": "#1A1A1A",
    "mem-red": "#FF3B30",
    "mem-blue": "#007AFF",
    "mem-green": "#34C759",
    "mem-orange": "#FF9500",
    "mem-purple": "#AF52DE",
  };
  const c = colorMap[color] || color;
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={{
        backgroundImage: `repeating-linear-gradient(${angle}deg, ${c} 0, ${c} ${thickness}px, transparent ${thickness}px, transparent ${thickness + gap}px)`,
      }}
    />
  );
}

export function DecorSolidCircle({ className, color = "mem-red" }) {
  const map = {
    "mem-red": "bg-mem-red",
    "mem-blue": "bg-mem-blue",
    "mem-green": "bg-mem-green",
    "mem-orange": "bg-mem-orange",
    "mem-purple": "bg-mem-purple",
    "mem-yellow": "bg-mem-yellow",
    "mem-black": "bg-mem-black",
    "cream": "bg-cream",
  };
  return (
    <div
      aria-hidden
      className={cn("rounded-full border-memphis", map[color] || map["mem-red"], className)}
    />
  );
}

export function DecorOutlineCircle({ className, color = "mem-black" }) {
  const map = {
    "mem-black": "border-mem-black",
    "mem-red": "border-mem-red",
    "mem-blue": "border-mem-blue",
  };
  return (
    <div
      aria-hidden
      className={cn("rounded-full border-[3px] bg-transparent", map[color] || map["mem-black"], className)}
    />
  );
}

export function DecorSolidSquare({ className, color = "mem-blue" }) {
  const map = {
    "mem-red": "bg-mem-red",
    "mem-blue": "bg-mem-blue",
    "mem-green": "bg-mem-green",
    "mem-orange": "bg-mem-orange",
    "mem-purple": "bg-mem-purple",
    "mem-yellow": "bg-mem-yellow",
    "mem-black": "bg-mem-black",
    "cream": "bg-cream",
  };
  return (
    <div
      aria-hidden
      className={cn("border-memphis", map[color] || map["mem-blue"], className)}
    />
  );
}

export function DecorTriangle({ className, color = "mem-green", rotate = 0 }) {
  const map = {
    "mem-red": "#FF3B30",
    "mem-blue": "#007AFF",
    "mem-green": "#34C759",
    "mem-orange": "#FF9500",
    "mem-purple": "#AF52DE",
    "mem-yellow": "#FFD60A",
    "mem-black": "#1A1A1A",
  };
  const c = map[color] || map["mem-green"];
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={{
        width: 0,
        height: 0,
        borderLeft: `12px solid transparent`,
        borderRight: `12px solid transparent`,
        borderBottom: `22px solid ${c}`,
        filter: "drop-shadow(1.5px 1.5px 0 #1A1A1A)",
        transform: `rotate(${rotate}deg)`,
      }}
    />
  );
}

/* Scattered corner decorator - drop into any section to add Memphis spice.
   Seed-based pseudo-random so layout is stable. */
export default function MemphisDecor({
  className,
  seed = 1,
  density = "normal", // sparse | normal | dense
}) {
  const count = density === "sparse" ? 3 : density === "dense" ? 8 : 5;
  const items = [];
  for (let i = 0; i < count; i++) {
    const r = (n) => {
      const x = Math.sin(seed * 9999 + i * 37 + n) * 10000;
      return x - Math.floor(x);
    };
    const variant = Math.floor(r(1) * 6); // 0..5
    const colors = ["mem-red", "mem-blue", "mem-green", "mem-orange", "mem-purple", "mem-yellow"];
    const color = colors[Math.floor(r(2) * colors.length)];
    const top = r(3) * 80 + 5; // 5% - 85%
    const right = r(4) * 90 + 2;
    const size = 12 + r(5) * 28; // 12 - 40px
    const rot = r(6) * 360;

    let node = null;
    const baseCls = "absolute pointer-events-none";
    const style = {
      top: `${top}%`,
      right: `${right}%`,
      width: `${size}px`,
      height: `${size}px`,
      transform: `rotate(${rot}deg)`,
    };
    switch (variant) {
      case 0:
        node = <DecorSolidCircle key={i} className={baseCls} color={color} />;
        break;
      case 1:
        node = <DecorOutlineCircle key={i} className={baseCls} color="mem-black" />;
        break;
      case 2:
        node = <DecorSolidSquare key={i} className={baseCls} color={color} />;
        break;
      case 3:
        node = <DecorTriangle key={i} className={baseCls} color={color} />;
        break;
      case 4:
        node = (
          <DecorDots
            key={i}
            className={baseCls}
            color={color}
            size={3}
            gap={10}
          />
        );
        break;
      default:
        node = (
          <DecorStripes
            key={i}
            className={baseCls}
            color={color}
            thickness={2}
            gap={6}
            angle={rot}
          />
        );
    }
    items.push(
      <div key={i} style={style}>
        {node}
      </div>
    );
  }

  return <div className={cn("relative", className)}>{items}</div>;
}
