# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10 --silent
# 先拷贝清单文件，利用层缓存
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @platform/api build

# ---- runtime（全量打包，无需 node_modules）----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
