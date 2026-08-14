#!/usr/bin/env bash
# Resume Platform 部署脚本（TECH-001 原生部署，幂等）
# 用法：./deploy.sh user@server
set -euo pipefail

SERVER="${1:?用法: ./deploy.sh <user@server>}"
REMOTE_DIR="/opt/resume-platform"
API_DIR="$REMOTE_DIR/app/api"
WEB_DIR="$REMOTE_DIR/app/web"
DEPLOY_TMP="$(mktemp -d)"

echo "[1/6] 本地构建..."
pnpm --filter @platform/web build
pnpm --filter @platform/api build

echo "[2/6] 同步静态资源..."
rsync -az --delete apps/web/dist/ "$SERVER:$WEB_DIR/"

echo "[3/6] 打包 API 生产产物（pnpm deploy：含 node_modules 与 better-sqlite3 原生模块）..."
pnpm deploy --filter @platform/api --prod "$DEPLOY_TMP/api"

echo "[4/6] 同步 API 产物..."
rsync -az --delete "$DEPLOY_TMP/api/" "$SERVER:$API_DIR/"

echo "[5/6] 准备数据与日志目录..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR/data $REMOTE_DIR/logs"

echo "[6/6] 重启服务..."
ssh "$SERVER" "systemctl restart resume-api"

rm -rf "$DEPLOY_TMP"
echo "✅ 完成。健康检查: curl http://<server>/api/health"
