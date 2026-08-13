import { cn } from "@/lib/utils";
import { DecorSolidSquare, DecorOutlineCircle, DecorTriangle } from "@/components/MemphisDecor";

export default function SectionTitle({ title, subtitle, center = false }) {
  return (
    <div className={cn("mb-10 sm:mb-12", center && "text-center mx-auto")}>
      <div className={cn("flex items-start gap-3", center && "justify-center")}>
        <div className="shrink-0 flex items-end gap-1.5">
          <DecorSolidSquare className="w-5 h-5 sm:w-6 sm:h-6" color="mem-red" />
          <DecorOutlineCircle
            className="w-6 h-6 sm:w-7 sm:h-7 -mb-1"
            color="mem-black"
          />
        </div>
        <h2 className="font-display tracking-tighter text-3xl sm:text-4xl text-mem-black leading-[1.05]">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className={cn("mt-3 text-sm sm:text-base font-body text-mem-black/70 max-w-2xl", center && "mx-auto")}>
          {subtitle}
        </p>
      )}
      <div className={cn("mt-4 h-[6px] w-24 bg-mem-orange border-memphis", center && "mx-auto")} />
    </div>
  );
}
