# ---- build（纯 tsc 编译，playwright 保持 external）----
FROM node:22-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10 --silent
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages ./packages
COPY apps/pdf ./apps/pdf
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @platform/pdf build

# ---- runtime：playwright + 中文字体 + 运行时依赖 ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# 中文字体（PDF 中文渲染必需）
RUN apt-get update && apt-get install -y --no-install-recommends fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*
# 运行时依赖（hono/@hono/node-server/playwright）+ chromium 二进制
COPY apps/pdf/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund \
    && npx playwright install --with-deps chromium
COPY --from=build /app/apps/pdf/dist ./dist
EXPOSE 3210
CMD ["node", "dist/index.js"]
