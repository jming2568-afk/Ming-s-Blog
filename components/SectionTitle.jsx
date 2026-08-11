import { cn } from "@/lib/utils";

export default function SectionTitle({ title, subtitle, center = false }) {
  return (
    <div className={cn("mb-8", center && "text-center")}>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-sm sm:text-base text-slate-500">{subtitle}</p>
      )}
      <div className={cn("mt-3 h-1 w-12 bg-indigo-600 rounded-full", center && "mx-auto")} />
    </div>
  );
}
