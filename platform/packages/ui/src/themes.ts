// @platform/ui — 主题设计令牌 + 组件库
//
// 主题 = 设计令牌（CSS 变量），只换皮肤不动布局。
// 主题通过 CSS 变量注入 :root，运行时切换（见 apps/web 的 ThemeProvider）。
export type ThemeTokens = Record<string, string>;

export interface Theme {
  id: string;
  name: string;
  description: string;
  tokens: ThemeTokens;
}

/** 令牌键约定（resume-layout 与组件统一读取） */
export const TOKEN_KEYS = [
  "--color-primary",
  "--color-bg",
  "--color-surface",
  "--color-text",
  "--color-muted",
  "--color-accent",
  "--color-border",
  "--font-family",
  "--radius",
  "--shadow",
] as const;

/** 5 套内置风格主题（PRD-001 §7） */
export const themes: Theme[] = [
  {
    id: "memphis",
    name: "Memphis 复古",
    description: "V0.02 血统：波普几何 + 高对比",
    tokens: {
      "--color-primary": "#e63946",
      "--color-bg": "#fdf6ec",
      "--color-surface": "#ffffff",
      "--color-text": "#1a1a1a",
      "--color-muted": "#6b6b6b",
      "--color-accent": "#007AFF",
      "--color-border": "#1a1a1a",
      "--font-family": "'Trebuchet MS', 'PingFang SC', sans-serif",
      "--radius": "0px",
      "--shadow": "6px 6px 0 rgba(26,26,26,0.9)",
    },
  },
  {
    id: "minimal",
    name: "极简黑白",
    description: "克制留白，黑白灰",
    tokens: {
      "--color-primary": "#111111",
      "--color-bg": "#fafafa",
      "--color-surface": "#ffffff",
      "--color-text": "#111111",
      "--color-muted": "#888888",
      "--color-accent": "#111111",
      "--color-border": "#e0e0e0",
      "--font-family": "'Inter', 'PingFang SC', sans-serif",
      "--radius": "2px",
      "--shadow": "0 1px 3px rgba(0,0,0,0.08)",
    },
  },
  {
    id: "morandi",
    name: "莫兰迪",
    description: "低饱和高级灰彩",
    tokens: {
      "--color-primary": "#a8b5a0",
      "--color-bg": "#f3f1ee",
      "--color-surface": "#fbfaf8",
      "--color-text": "#3d3d3d",
      "--color-muted": "#8a8a8a",
      "--color-accent": "#c2b2a0",
      "--color-border": "#d8d3cc",
      "--font-family": "'Noto Serif SC', 'Songti SC', serif",
      "--radius": "8px",
      "--shadow": "0 2px 8px rgba(0,0,0,0.06)",
    },
  },
  {
    id: "tech",
    name: "科技渐变",
    description: "深色底 + 霓虹渐变",
    tokens: {
      "--color-primary": "#00d4ff",
      "--color-bg": "#0b1020",
      "--color-surface": "#111a30",
      "--color-text": "#e8f4ff",
      "--color-muted": "#7a8ca8",
      "--color-accent": "#a855f7",
      "--color-border": "#1f2b45",
      "--font-family": "'JetBrains Mono', 'PingFang SC', monospace",
      "--radius": "4px",
      "--shadow": "0 0 12px rgba(0,212,255,0.25)",
    },
  },
  {
    id: "cream",
    name: "奶油暖色",
    description: "柔和暖调，舒适耐读",
    tokens: {
      "--color-primary": "#c08552",
      "--color-bg": "#fffaf3",
      "--color-surface": "#ffffff",
      "--color-text": "#4a3f35",
      "--color-muted": "#9c8f80",
      "--color-accent": "#d9a05b",
      "--color-border": "#ead9c5",
      "--font-family": "'Nunito', 'PingFang SC', sans-serif",
      "--radius": "12px",
      "--shadow": "0 4px 12px rgba(192,133,82,0.15)",
    },
  },
];

export function getTheme(id: string | null | undefined): Theme {
  return themes.find((t) => t.id === id) ?? themes[0]!;
}

/** 把主题令牌转成 CSS 变量字符串（注入 :root 用） */
export function themeToCssVars(theme: Theme): string {
  return Object.entries(theme.tokens)
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n");
}
