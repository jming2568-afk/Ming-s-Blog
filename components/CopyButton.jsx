"use client";

import { useState } from "react";
import { FiCopy } from "react-icons/fi";

export default function CopyButton({ value, label = "复制" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white text-mem-black border-memphis shadow-memphis-sm hover:bg-mem-green hover:text-mem-black hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-display text-xs"
      aria-label="复制微信号"
    >
      <FiCopy size={13} />
      {copied ? "已复制" : label}
    </button>
  );
}
