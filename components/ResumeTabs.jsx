"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPrinter, FiBriefcase, FiAward, FiBookOpen, FiCode, FiZap } from "react-icons/fi";
import { cn } from "@/lib/utils";

export default function ResumeTabs({ resume }) {
  const [active, setActive] = useState("aigc");
  const data = resume[active];

  return (
    <div>
      {/* 版本切换 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Object.values(resume).map((v) => (
          <button
            key={v.id}
            onClick={() => setActive(v.id)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-medium transition-colors",
              active === v.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
            )}
          >
            {v.label}
          </button>
        ))}
        <button
          onClick={() => window.print()}
          className="ml-auto px-4 py-2.5 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors no-print"
        >
          <FiPrinter className="inline mr-1" /> 打印
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* 求职意向 */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
            <p className="text-xs text-indigo-500 font-medium mb-1">求职意向</p>
            <h2 className="text-xl font-bold text-slate-900">{data.title}</h2>
          </div>

          {/* 个人简介 */}
          <section className="mb-8">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3">
              <FiZap className="text-indigo-600" /> 个人简介
            </h3>
            <p className="text-slate-600 leading-relaxed">{data.summary}</p>
          </section>

          {/* 工作经历 */}
          <section className="mb-8">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <FiBriefcase className="text-indigo-600" /> 工作经历
            </h3>
            {data.workExperience.map((work, i) => (
              <div key={i} className="mb-4 p-5 rounded-xl bg-white border border-slate-200">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">{work.company}</h4>
                  <span className="text-sm text-slate-400">{work.period}</span>
                </div>
                <p className="text-sm text-indigo-600 mb-3">{work.role}</p>
                <ul className="space-y-1.5">
                  {work.points.map((p, j) => (
                    <li key={j} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* AIGC 版：代表作品 / 全栈版：核心项目 */}
          {data.works ? (
            <section className="mb-8">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                <FiAward className="text-indigo-600" /> 代表作品
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">作品</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">角色</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">成果</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.works.map((w, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{w.name}</td>
                        <td className="px-4 py-3 text-slate-600">{w.role}</td>
                        <td className="px-4 py-3 text-slate-600">{w.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="mb-8">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                <FiCode className="text-indigo-600" /> 核心项目
              </h3>
              <div className="space-y-4">
                {data.projects.map((proj, i) => (
                  <div key={i} className="p-5 rounded-xl bg-white border border-slate-200">
                    <h4 className="font-semibold text-slate-900">{proj.name}</h4>
                    <p className="text-sm text-indigo-600 mb-3">{proj.role}</p>
                    <ul className="space-y-1.5">
                      {proj.points.map((p, j) => (
                        <li key={j} className="text-sm text-slate-600 flex gap-2">
                          <span className="text-indigo-400 mt-1">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AIGC 版：核心能力 / 全栈版：技术能力 */}
          {data.abilities ? (
            <section className="mb-8">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                <FiZap className="text-indigo-600" /> 核心能力
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.abilities.map((a, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border border-slate-200">
                    <p className="font-medium text-slate-900 mb-1">{a.item}</p>
                    <p className="text-sm text-slate-500">{a.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-8">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                <FiCode className="text-indigo-600" /> 技术能力
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {data.techStack.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900 align-top whitespace-nowrap w-32">
                          {t.cat}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{t.items}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 教育背景 */}
          <section className="mb-8">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
              <FiBookOpen className="text-indigo-600" /> 服役与教育
            </h3>
            <div className="space-y-2">
              {data.education.map((e, i) => (
                <div key={i} className="flex flex-wrap items-baseline gap-x-3 p-3 rounded-lg bg-slate-50">
                  <span className="text-sm text-slate-400">{e.period}</span>
                  <span className="font-medium text-slate-900">{e.school}</span>
                  <span className="text-sm text-slate-500">{e.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 证书 */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3">
              <FiAward className="text-indigo-600" /> 证书
            </h3>
            <p className="text-slate-600">{data.certs}</p>
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
