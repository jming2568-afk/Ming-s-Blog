import { FiMail, FiGithub, FiMapPin } from "react-icons/fi";
import { getContent } from "@/lib/content";

export const metadata = {
  title: "联系 | 李佳铭",
  description: "联系李佳铭 — 邮箱与 GitHub",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const content = await getContent();
  const { profile } = content;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">联系我</h1>
      <p className="text-slate-500 mb-10">
        欢迎通过以下方式联系我，期待与你交流合作机会。
      </p>

      <div className="space-y-4">
        {/* 邮箱 */}
        <a
          href={`mailto:${profile.email}`}
          className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            <FiMail size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-400">邮箱</p>
            <p className="text-lg font-medium text-slate-900">{profile.email}</p>
          </div>
        </a>

        {/* GitHub */}
        <a
          href={profile.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-200 transition-colors">
            <FiGithub size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-400">GitHub</p>
            <p className="text-lg font-medium text-slate-900">{profile.github}</p>
          </div>
        </a>

        {/* 地点 */}
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
            <FiMapPin size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-400">意向城市</p>
            <p className="text-lg font-medium text-slate-900">{profile.location}</p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-400 text-center">
        手机号与微信号会在投递时单独提供，以保护隐私。
      </p>
    </div>
  );
}
