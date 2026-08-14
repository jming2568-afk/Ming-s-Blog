#!/usr/bin/env bash
# Resume Platform 备份脚本（TECH-001 §8）
# 用法：crontab 每日 03:00：0 3 * * * /opt/resume-platform/app/backup.sh
set -euo pipefail

DATA_DIR="/opt/resume-platform/data"
BACKUP_DIR="/opt/resume-platform/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# SQLite 在线安全备份（.backup 支持 WAL 模式）
sqlite3 "$DATA_DIR/resume.db" ".backup '$BACKUP_DIR/resume-$STAMP.db'"

# 保留最近 14 份，删除更早
ls -1t "$BACKUP_DIR"/resume-*.db 2>/dev/null | tail -n +15 | xargs -r rm -f

# 上传远端 OSS（可选，配置 ossutil 与 OSS_BUCKET 后启用）
if command -v ossutil >/dev/null 2>&1 && [ -n "${OSS_BUCKET:-}" ]; then
  ossutil cp "$BACKUP_DIR/resume-$STAMP.db" "oss://$OSS_BUCKET/backups/" -f >/dev/null
fi

echo "✅ 备份完成: $BACKUP_DIR/resume-$STAMP.db"
