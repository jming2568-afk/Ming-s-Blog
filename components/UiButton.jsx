"use client";

import { forwardRef, Children, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  solid: {
    red: "bg-mem-red text-white",
    blue: "bg-mem-blue text-white",
    green: "bg-mem-green text-mem-black",
    orange: "bg-mem-orange text-mem-black",
    black: "bg-mem-black text-white",
    purple: "bg-mem-purple text-white",
    yellow: "bg-mem-yellow text-mem-black",
    cream: "bg-cream text-mem-black",
  },
  outline: {
    red: "bg-white text-mem-red hover:bg-mem-red hover:text-white",
    blue: "bg-white text-mem-blue hover:bg-mem-blue hover:text-white",
    green: "bg-white text-mem-green hover:bg-mem-green hover:text-mem-black",
    black: "bg-white text-mem-black hover:bg-mem-black hover:text-white",
    orange: "bg-white text-mem-orange hover:bg-mem-orange hover:text-mem-black",
  },
};

const sizeMap = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
  xl: "px-8 py-4 text-lg",
};

const UiButton = forwardRef(function UiButton(
  {
    className,
    variant = "solid",
    color = "red",
    size = "md",
    rounded = "none",
    disabled,
    children,
    onClick,
    type = "button",
    asChild,
    ...rest
  },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-2 font-display tracking-tight border-memphis transition-all duration-75 select-none";
  const interactive = !disabled
    ? "shadow-memphis hover:shadow-memphis-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] cursor-pointer"
    : "opacity-50 cursor-not-allowed";
  const roundedCls = rounded === "xl" ? "rounded-2xl" : "rounded-none";

  const colorCls =
    variant === "solid"
      ? variantStyles.solid[color] || variantStyles.solid.red
      : variant === "outline"
        ? variantStyles.outline[color] || variantStyles.outline.black
        : "bg-transparent border-transparent shadow-none hover:bg-mem-black/5";

  const sizeCls = sizeMap[size] || sizeMap.md;

  const combinedClassName = cn(
    base,
    variant !== "ghost" && interactive,
    roundedCls,
    colorCls,
    sizeCls,
    className
  );

  if (asChild && isValidElement(children)) {
    const child = Children.only(children);
    return cloneElement(child, {
      ref,
      className: cn(child.props.className, combinedClassName),
      onClick: (e) => {
        child.props.onClick?.(e);
        onClick?.(e);
      },
      "data-disabled": disabled ? "true" : undefined,
      ...rest,
    });
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={combinedClassName}
      {...rest}
    >
      {children}
    </button>
  );
});

export default UiButton;
