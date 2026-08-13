export default function SkillBar({ skills }) {
  return (
    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
      {skills.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">
            {group.category}
          </h3>
          <div className="space-y-3">
            {group.items.map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-700">{skill.name}</span>
                  <span className="text-xs text-slate-400">{skill.level}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
