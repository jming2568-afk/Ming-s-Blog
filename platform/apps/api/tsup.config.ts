import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // 全量打包（hono/drizzle/postgres/workspace 依赖内联），运行时无需 node_modules，镜像最小化
  // 注意：dependencies 默认被 tsup 视为 external，必须显式 noExternal 全部内联
  external: [],
  noExternal: [/.*/],
});
