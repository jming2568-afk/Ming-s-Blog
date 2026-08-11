import { timeline } from "@/data/timeline";

export default function Timeline() {
  return (
    <div className="relative">
      {/* 竖线 */}
      <div className="absolute left-3 sm:left-4 top-2 bottom-2 w-0.5 bg-slate-200" />

      <div className="space-y-8">
        {timeline.map((item, i) => (
          <div key={i} className="relative pl-10 sm:pl-12">
            {/* 节点 */}
            <div className="absolute left-0 top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-600 border-4 border-white shadow-md flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white" />
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-shadow">
              <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-600 mb-2">
                {item.period}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="text-sm text-indigo-600 mb-2">{item.subtitle}</p>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">{item.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
