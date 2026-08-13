import { FiMail, FiGithub } from "react-icons/fi";
import { profile } from "@/data/profile";
import {
  DecorDots,
  DecorSolidCircle,
  DecorSolidSquare,
  DecorTriangle,
} from "@/components/MemphisDecor";

export default function Footer() {
  return (
    <footer className="relative mt-10 bg-cream-pink border-t-[3px] border-mem-black overflow-hidden">
      {/* Corner decor */}
      <DecorDots
        className="absolute top-4 left-6 w-24 h-16 opacity-40"
        color="mem-blue"
        size={3}
        gap={12}
      />
      <DecorSolidCircle
        className="absolute bottom-5 right-12 w-8 h-8 border-memphis"
        color="mem-red"
      />
      <DecorTriangle
        className="absolute top-8 right-40"
        color="mem-green"
        rotate={12}
      />
      <DecorSolidSquare
        className="absolute bottom-14 left-40 w-5 h-5 border-memphis"
        color="mem-yellow"
      />

      <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <DecorSolidSquare className="w-5 h-5 border-memphis" color="mem-red" />
            <p className="font-display text-2xl tracking-tighter text-mem-black">
              {profile.name}
            </p>
          </div>
          <p className="font-body text-sm text-mem-black/70 max-w-md leading-relaxed mb-5">
            {profile.bioShort}
          </p>
          <p className="font-body text-xs text-mem-black/50">
            © {new Date().getFullYear()} {profile.name} · {profile.titles.join(" / ")}
            <span className="ml-2 marker-yellow">Made with Memphis ❤</span>
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-display text-lg tracking-tighter text-mem-black flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-mem-blue border-memphis" />
            联系我
          </p>
          <a
            href={`mailto:${profile.email}`}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border-memphis shadow-memphis-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-mem-yellow transition-all font-body text-sm w-fit"
          >
            <FiMail className="shrink-0 text-mem-red" /> {profile.email}
          </a>
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 bg-mem-black text-white border-memphis shadow-memphis-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-body text-sm w-fit"
          >
            <FiGithub className="shrink-0" /> GitHub
          </a>
        </div>
      </div>

      {/* Rainbow bottom bar */}
      <div className="flex h-3">
        <div className="flex-1 bg-mem-red" />
        <div className="flex-1 bg-mem-orange" />
        <div className="flex-1 bg-mem-yellow" />
        <div className="flex-1 bg-mem-green" />
        <div className="flex-1 bg-mem-blue" />
        <div className="flex-1 bg-mem-purple" />
      </div>
    </footer>
  );
}
