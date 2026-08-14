import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getTheme, themes, themeToCssVars, type Theme } from "@platform/ui";

const STORAGE_KEY = "resume-platform:theme";

interface ThemeContextValue {
  theme: Theme;
  setThemeId: (id: string) => void;
  themeId: string;
  availableThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** 主题 Provider：注入 CSS 变量到 :root，运行时切换（未登录选择记忆 localStorage） */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "memphis";
    } catch {
      return "memphis";
    }
  });

  useEffect(() => {
    const theme = getTheme(themeId);
    document.documentElement.style.cssText = themeToCssVars(theme);
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      /* ignore */
    }
  }, [themeId]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(themeId),
      themeId,
      setThemeId: setThemeIdState,
      availableThemes: themes,
    }),
    [themeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme 必须在 ThemeProvider 内使用");
  return ctx;
}
