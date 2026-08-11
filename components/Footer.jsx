import { FiMail, FiGithub } from "react-icons/fi";
import { profile } from "@/data/profile";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} {profile.name} · {profile.titles.join(" / ")}
        </p>
        <div className="flex items-center gap-4">
          <a
            href={`mailto:${profile.email}`}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <FiMail /> {profile.email}
          </a>
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <FiGithub /> GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
