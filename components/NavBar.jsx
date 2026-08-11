"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/resume", label: "简历" },
  { href: "/portfolio", label: "作品集" },
  { href: "/contact", label: "联系" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-slate-900">
          李佳铭<span className="text-indigo-600">.dev</span>
        </Link>

        {/* 桌面导航 */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
              )}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/jming2568-afk"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* 移动端汉堡按钮 */}
        <button
          className="md:hidden p-2 text-slate-600"
          onClick={() => setOpen(!open)}
          aria-label="菜单"
        >
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* 移动端菜单 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white border-t border-slate-200"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-4 py-3 text-sm font-medium border-b border-slate-100",
                  pathname === link.href ? "text-indigo-600 bg-indigo-50" : "text-slate-700"
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/jming2568-afk"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-sm font-medium text-indigo-600"
            >
              GitHub →
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
