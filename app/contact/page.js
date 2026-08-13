import { FiMail, FiGithub, FiMapPin } from "react-icons/fi";
import { profile } from "@/data/profile";
import SectionTitle from "@/components/SectionTitle";
import {
  DecorSolidCircle,
  DecorSolidSquare,
  DecorOutlineCircle,
  DecorTriangle,
} from "@/components/MemphisDecor";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "联系 | 李佳铭",
  description: "联系李佳铭 — 邮箱与 GitHub",
};

const contactItems = [
  {
    key: "email",
    icon: <FiMail size={24} />,
    label: "邮箱",
    value: profile.email,
    href: `mailto:${profile.email}`,
    bgIcon: "bg-mem-red text-white",
    hoverBg: "hover:bg-mem-red",
    hoverText: "hover:text-white",
    accent: "mem-red",
    decorColor: "mem-yellow",
  },
  {
    key: "github",
    icon: <FiGithub size={24} />,
    label: "GitHub",
    value: profile.github,
    href: profile.githubUrl,
    bgIcon: "bg-mem-black text-white",
    hoverBg: "hover:bg-mem-black",
    hoverText: "hover:text-white",
    accent: "mem-black",
    decorColor: "mem-green",
    external: true,
  },
  {
    key: "location",
    icon: <FiMapPin size={24} />,
    label: "意向城市",
    value: profile.location,
    bgIcon: "bg-mem-orange text-mem-black",
    hoverBg: "",
    hoverText: "",
    accent: "mem-orange",
    decorColor: "mem-purple",
    notLink: true,
  },
];

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      {/* Title */}
      <div className="relative mb-14">
        <DecorSolidSquare
          className="absolute -top-3 -left-3 w-7 h-7 rotate-12"
          color="mem-red"
        />
        <DecorOutlineCircle
          className="absolute -top-6 right-8 w-10 h-10"
          color="mem-blue"
        />
        <SectionTitle
          title="CONTACT · 联系我"
          subtitle="欢迎通过以下方式联系我，期待与你交流合作机会，一起创造有意思的作品。"
        />
      </div>

      {/* Cards */}
      <div className="space-y-5">
        {contactItems.map((item, i) => {
          const rotate = i % 2 === 0 ? "-rotate-0.5" : "rotate-0.5";
          const content = (
            <div
              className={cn(
                "relative flex items-center gap-5 p-6 bg-white border-memphis-thick shadow-memphis transition-all duration-75 group",
                !item.notLink &&
                  "hover:shadow-memphis-sm hover:translate-x-[2px] hover:translate-y-[2px]",
                rotate
              )}
            >
              {/* Corner tag */}
              <div
                className={cn(
                  "absolute -top-2.5 -left-2.5 px-2 py-1 text-[10px] font-display tracking-widest uppercase border-memphis shadow-memphis-sm",
                  i === 0 && "bg-mem-yellow text-mem-black",
                  i === 1 && "bg-mem-green text-mem-black",
                  i === 2 && "bg-mem-purple text-white"
                )}
              >
                0{i + 1}
              </div>

              {/* Decorations */}
              <DecorSolidCircle
                className={cn("absolute top-3 right-4 w-3 h-3 opacity-70")}
                color={item.decorColor}
              />
              {i === 1 && (
                <DecorTriangle className="absolute bottom-3 right-6 w-4 h-4 text-mem-blue opacity-50" />
              )}
              {i === 2 && (
                <DecorSolidSquare
                  className="absolute bottom-4 right-5 w-2.5 h-2.5 rotate-45"
                  color="mem-orange"
                />
              )}

              {/* Icon box */}
              <div
                className={cn(
                  "shrink-0 w-14 h-14 flex items-center justify-center border-memphis shadow-memphis-sm",
                  item.bgIcon
                )}
              >
                {item.icon}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="font-display tracking-widest uppercase text-xs text-mem-black/50 mb-1">
                  {item.label}
                </p>
                <p
                  className={cn(
                    "font-display tracking-tight text-xl sm:text-2xl text-mem-black truncate",
                    !item.notLink &&
                      cn("group-hover:marker-yellow transition-all", item.hoverText)
                  )}
                >
                  {item.value}
                </p>
              </div>

              {/* Arrow indicator for links */}
              {!item.notLink && (
                <div
                  className={cn(
                    "shrink-0 w-9 h-9 flex items-center justify-center border-memphis transition-colors",
                    item.hoverBg,
                    "group-hover:text-white bg-white text-mem-black"
                  )}
                >
                  {item.external ? (
                    <FiGithub size={16} />
                  ) : (
                    <FiMail size={16} />
                  )}
                </div>
              )}
            </div>
          );

          if (item.notLink) {
            return <div key={item.key}>{content}</div>;
          }

          return (
            <a
              key={item.key}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="block"
            >
              {content}
            </a>
          );
        })}
      </div>

      {/* Privacy note */}
      <div className="mt-12 relative">
        <div className="p-5 bg-mem-yellow border-memphis-thick shadow-memphis-sm relative overflow-hidden">
          <DecorOutlineCircle
            className="absolute -left-6 -bottom-6 w-24 h-24 opacity-30"
            color="mem-black"
          />
          <DecorSolidSquare
            className="absolute top-2 right-3 w-3 h-3 rotate-12"
            color="mem-red"
          />
          <p className="font-display tracking-tight text-mem-black text-sm relative z-10 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">🔒</span>
            <span>
              手机号与微信号会在投递时单独提供，以保护隐私。
              若你已有我的联系方式，欢迎直接联系。
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
