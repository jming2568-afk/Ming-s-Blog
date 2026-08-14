#!/usr/bin/env bash
# Resume Platform 部署脚本（TECH-001 / OPS-001：本地构建 + tar/scp 直传 + 服务器端装生产依赖）
# 用法：
#   bash deploy/deploy.sh              # 构建并发布
#   bash deploy/deploy.sh --rollback   # 回滚到最近一次备份
# 依赖：本机 Node 22 + pnpm；ssh shouer 密钥；Windows 请在 Git Bash / WSL 中运行本脚本
#
# 关键点：
#  - 构建只在本地做（Vite/tsup 峰值不占服务器内存）
#  - better-sqlite3 是原生模块，必须在 Linux 服务器上执行 npm install 安装/编译，
#    不能把 Windows 构建的 node_modules 拷过去（二进制不兼容）
#  - 传输用两端原生工具 tar/scp，无需 rsync / git / Docker
set -euo pipefail

SSH_HOST="${SSH_HOST:-shouer}"
REMOTE_ROOT="/opt/resume-platform"
WEB_DEST="$REMOTE_ROOT/app/web"
API_DEST="$REMOTE_ROOT/app/api"
DATA_DIR="$REMOTE_ROOT/data"
BACKUP_DIR="$REMOTE_ROOT/backups"
TS="$(date +%Y%m%d-%H%M%S)"

rollback_latest() {
  local LATEST
  LATEST="$(ssh "$SSH_HOST" "ls -1t $BACKUP_DIR 2>/dev/null | head -1")"
  if [ -z "$LATEST" ]; then echo "❌ 无可用回滚点（$BACKUP_DIR 为空）"; exit 1; fi
  echo "==> 回滚到备份点 $LATEST"
  ssh "$SSH_HOST" "
    systemctl stop resume-api || true
    rm -rf $WEB_DEST && cp -a $BACKUP_DIR/$LATEST/web.prev $WEB_DEST
    rm -rf $API_DEST && cp -a $BACKUP_DIR/$LATEST/api.prev $API_DEST
    if [ -f $BACKUP_DIR/$LATEST/resume.db ]; then cp -a $BACKUP_DIR/$LATEST/resume.db $DATA_DIR/resume.db; fi
    chown -R resume:resume $WEB_DEST $API_DEST $DATA_DIR 2>/dev/null || true
    systemctl start resume-api
  "
  sleep 2
  ssh "$SSH_HOST" "curl -fsS http://127.0.0.1:3000/api/health && echo '' && echo '回滚完成 OK'"
  exit 0
}

if [ "${1:-}" = "--rollback" ]; then rollback_latest; fi

echo "==> [1/7] 校验本地 Node 版本"
NODE_MAJOR="$(node -v | sed 's/v//;s/\..*//')"
if [ "$NODE_MAJOR" -lt 22 ]; then echo "❌ 需要 Node 22+，当前 $(node -v)"; exit 1; fi

echo "==> [2/7] 本地构建 web + api"
pnpm --filter @platform/web build
pnpm --filter @platform/api build

echo "==> [3/7] 备份服务器上一版 + SQLite"
ssh "$SSH_HOST" "
  mkdir -p $BACKUP_DIR/$TS $DATA_DIR $WEB_DEST $API_DEST
  [ -d $WEB_DEST ] && cp -a $WEB_DEST $BACKUP_DIR/$TS/web.prev || true
  [ -d $API_DEST ] && cp -a $API_DEST $BACKUP_DIR/$TS/api.prev || true
  [ -f $DATA_DIR/resume.db ] && sqlite3 $DATA_DIR/resume.db '.backup $BACKUP_DIR/$TS/resume.db' || true
  echo '  备份点: '$TS
"

echo "==> [4/7] 传输 web 静态产物"
tar -C apps/web -czf - dist | ssh "$SSH_HOST" "rm -rf $WEB_DEST && mkdir -p $WEB_DEST && tar -xzf - -C $WEB_DEST"

echo "==> [5/7] 传输 api 产物 + package.json（原生模块待服务器端安装）"
tar -C apps/api -czf - dist package.json | ssh "$SSH_HOST" "rm -rf $API_DEST && mkdir -p $API_DEST && tar -xzf - -C $API_DEST"

echo "==> [6/7] 服务器端安装生产依赖（better-sqlite3 原生模块）"
ssh "$SSH_HOST" "cd $API_DEST && npm install --omit=dev --no-audit --no-fund"

echo "==> [7/7] 重启 + 健康检查（API 启动时自动迁移）"
ssh "$SSH_HOST" "
  chown -R resume:resume $WEB_DEST $API_DEST $DATA_DIR 2>/dev/null || true
  systemctl restart resume-api
"
sleep 2
ssh "$SSH_HOST" "curl -fsS http://127.0.0.1:3000/api/health && echo '' && echo '✅ 部署完成 OK'"
