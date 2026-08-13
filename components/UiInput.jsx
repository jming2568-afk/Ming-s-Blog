"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const UiInput = forwardRef(function UiInput(
  { className, label, error, textarea = false, rows = 4, ...rest },
  ref
) {
  const baseInput =
    "w-full px-4 py-3 font-body text-mem-black bg-white border-memphis shadow-memphis-sm focus:shadow-memphis focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-100 placeholder:text-mem-black/30";

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-bold font-display tracking-tight text-mem-black">
          {label}
          {rest.required && <span className="text-mem-red ml-1">*</span>}
        </label>
      )}
      {textarea ? (
        <textarea
          ref={ref}
          rows={rows}
          className={cn(baseInput, "resize-y rounded-none", className)}
          {...rest}
        />
      ) : (
        <input
          ref={ref}
          className={cn(baseInput, "rounded-none", className)}
          {...rest}
        />
      )}
      {error && <p className="text-xs font-bold text-mem-red">{error}</p>}
    </div>
  );
});

export default UiInput;
