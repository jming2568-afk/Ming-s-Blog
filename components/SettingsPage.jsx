"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FiUser, FiLock, FiFileText } from "react-icons/fi";
import ProfileSettings from "@/components/ProfileSettings";
import PasswordSettings from "@/components/PasswordSettings";
import ResumeEditor from "@/components/ResumeEditor";

const TABS = [
  { id: "profile", label: "个人资料", icon: <FiUser /> },
  { id: "password", label: "修改密码", icon: <FiLock /> },
  { id: "resume", label: "简历管理", icon: <FiFileText /> },
];

export default function SettingsPage({ initialTab = "profile" }) {
  const [tab, setTab] = useState(
    TABS.some((t) => t.id === initialTab) ? initialTab : "profile"
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 font-display tracking-tight border-memphis transition-all duration-75",
                active
                  ? t.id === "resume"
                    ? "bg-mem-blue text-white shadow-memphis-sm"
                    : t.id === "password"
                      ? "bg-mem-purple text-white shadow-memphis-sm"
                      : "bg-mem-red text-white shadow-memphis-sm"
                  : "bg-white text-mem-black hover:bg-cream"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && <ProfileSettings />}
      {tab === "password" && <PasswordSettings />}
      {tab === "resume" && <ResumeEditor />}
    </div>
  );
}
