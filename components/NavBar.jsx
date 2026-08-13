"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiLogOut, FiSettings, FiGithub, FiUser } from "react-icons/fi";
import { cn } from "@/lib/utils";
import UiButton from "@/components/UiButton";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/components/AuthContext";
import {
  DecorSolidCircle,
  DecorSolidSquare,
  DecorOutlineCircle,
} from "@/components/MemphisDecor";

const navLinks = [
  { href: "/", label: "首页", color: "mem-red" },
  { href: "/resume", label: "简历", color: "mem-blue" },
  { href: "/portfolio", label: "作品集", color: "mem-green" },
  { href: "/contact", label: "联系", color: "mem-orange" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, logout, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [site, setSite] = useState({ displayName: "李佳铭", avatarUrl: "" });
  const menuRef = useRef(null);

  // 拉取站点设置（展示名称/头像，全站同步）
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data = await res.json();
        if (data?.settings) {
          setSite({
            displayName: data.settings.displayName || "李佳铭",
            avatarUrl: data.settings.avatarUrl || "",
          });
        }
      } catch {
        /* 保持默认 */
      }
    })();
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const colorDot = (c) => {
    const map = {
      "mem-red": "bg-mem-red",
      "mem-blue": "bg-mem-blue",
      "mem-green": "bg-mem-green",
      "mem-orange": "bg-mem-orange",
    };
    return map[c] || "bg-mem-black";
  };

  const avatarLetter = user?.username?.[0]?.toUpperCase() || "A";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream border-b-[3px] border-mem-black">
        <div className="max-w-7xl mx-auto h-20 px-4 flex items-center justify-between gap-4">
          {/* Logo block */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="首页"
          >
            <span className="relative flex items-center gap-1">
              <DecorSolidSquare className="w-6 h-6" color="mem-red" />
              <DecorSolidCircle
                className="w-4 h-4 -ml-2 mt-4 border-memphis"
                color="mem-yellow"
              />
              <DecorOutlineCircle
                className="w-7 h-7 -ml-1 -mb-2"
                color="mem-black"
              />
            </span>
            <span className="font-display text-2xl sm:text-3xl tracking-tighter text-mem-black">
              {site.displayName}
              <span className="marker-yellow ml-1">SubMing.Top</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 group"
                >
                  <span
                    className={cn(
                      "relative z-10 font-display tracking-tight text-base",
                      active ? "text-mem-black" : "text-mem-black/80 group-hover:text-mem-black"
                    )}
                  >
                    {link.label}
                  </span>
                  <span
                    className={cn(
                      "absolute left-3 right-3 bottom-1 h-2 -z-0 transition-all",
                      active ? `${colorDot(link.color)} opacity-100` : `${colorDot(link.color)} opacity-0 group-hover:opacity-80`
                    )}
                  />
                  <span
                    className={cn(
                      "absolute -left-0.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-memphis border-mem-black transition-opacity",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  />
                </Link>
              );
            })}

            <div className="flex items-center gap-3 ml-4">
              <a
                href="https://github.com/jming2568-afk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-mem-black text-white font-display tracking-tight border-memphis shadow-memphis-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                aria-label="GitHub"
              >
                <FiGithub /> GitHub
              </a>

              {!isLoading && !isLoggedIn && (
                <UiButton color="red" onClick={() => setLoginOpen(true)}>
                  登 录
                </UiButton>
              )}

              {!isLoading && isLoggedIn && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenu((v) => !v)}
                    className="flex items-center justify-center w-12 h-12 bg-mem-purple text-white font-display text-lg border-memphis shadow-memphis-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden"
                    aria-label="用户菜单"
                  >
                    {site.avatarUrl ? (
                      <img
                        src={site.avatarUrl}
                        alt="头像"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="mx-auto">{avatarLetter}</span>
                    )}
                  </button>
                  <AnimatePresence>
                    {userMenu && (
                      <motion.div
                        initial={{ y: 10, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 10, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 320, damping: 24 }}
                        className="absolute right-0 mt-3 w-56 bg-cream border-memphis-thick shadow-memphis-lg overflow-hidden z-50"
                      >
                        <div className="p-3 bg-mem-yellow border-b-[3px] border-mem-black">
                          <p className="font-display text-mem-black">已登录</p>
                          <p className="text-xs font-body text-mem-black/70">
                            {user?.username}
                          </p>
                        </div>
                        <div className="p-1.5 flex flex-col gap-1">
                          <button
                            onClick={() => {
                              setUserMenu(false);
                              router.push("/settings");
                            }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 font-display tracking-tight hover:bg-mem-yellow hover:text-mem-black transition-colors"
                          >
                            <FiUser /> 个人中心
                          </button>
                          <button
                            onClick={() => {
                              setUserMenu(false);
                              router.push("/portfolio");
                            }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 font-display tracking-tight hover:bg-mem-blue hover:text-white transition-colors"
                          >
                            <FiSettings /> 管理作品
                          </button>
                          <button
                            onClick={async () => {
                              setUserMenu(false);
                              await logout();
                            }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 font-display tracking-tight hover:bg-mem-red hover:text-white transition-colors"
                          >
                            <FiLogOut /> 退出登录
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Mobile burger */}
          <button
            className="lg:hidden w-11 h-11 bg-white border-memphis shadow-memphis-sm flex items-center justify-center hover:bg-mem-yellow transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="菜单"
          >
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden bg-cream border-b-[3px] border-mem-black border-t-0"
            >
              <div className="p-4 space-y-2">
                {navLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 border-memphis font-display tracking-tight",
                        active ? "bg-white shadow-memphis-sm" : "bg-white/50 hover:bg-white"
                      )}
                    >
                      <span className={cn("w-3 h-3 rounded-full", colorDot(link.color))} />
                      {link.label}
                    </Link>
                  );
                })}
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href="https://github.com/jming2568-afk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2.5 bg-mem-black text-white font-display border-memphis shadow-memphis-sm"
                  >
                    <FiGithub className="inline mr-1.5 -mt-0.5" /> GitHub
                  </a>
                  {!isLoading && !isLoggedIn && (
                    <UiButton
                      color="red"
                      className="flex-1"
                      onClick={() => {
                        setOpen(false);
                        setLoginOpen(true);
                      }}
                    >
                      登 录
                    </UiButton>
                  )}
                  {!isLoading && isLoggedIn && (
                    <>
                      <button
                        onClick={async () => {
                          setOpen(false);
                          router.push("/portfolio");
                        }}
                        className="flex-1 px-4 py-2.5 bg-mem-blue text-white font-display border-memphis shadow-memphis-sm"
                      >
                        管理
                      </button>
                      <button
                        onClick={async () => {
                          setOpen(false);
                          await logout();
                        }}
                        className="flex-1 px-4 py-2.5 bg-mem-orange text-mem-black font-display border-memphis shadow-memphis-sm"
                      >
                        退出
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
