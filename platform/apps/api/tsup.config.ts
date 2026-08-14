import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  // CJS 输出：better-sqlite3 为原生 CJS 模块，ESM 产物会生成 require shim 导致
  // "Dynamic require of fs is not supported"（TECH-001）
  format: ["cjs"],
  outExtension: () => ({ js: ".cjs" }),
  target: "node22",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // 把 drizzle 迁移 SQL 拷进 dist，运行时启动迁移（dist/drizzle）
  publicDir: "drizzle",
  // 只内联 workspace 包（shared/ui 为 TS 源码）；npm 依赖保持 external：
  // 生产原生部署会安装 node_modules（deploy.sh 用 pnpm deploy），better-sqlite3 原生模块必须 external
  noExternal: ["@platform/shared", "@platform/ui"],
  external: [],
});
