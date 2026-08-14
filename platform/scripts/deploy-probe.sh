#!/usr/bin/env bash
echo "HOME=$HOME"
echo "--- which ---"
which node ssh pnpm 2>/dev/null || true
echo "--- node ---"
node -v 2>/dev/null || echo "(node 不在 PATH)"
echo "--- ssh 连通 ---"
ssh -o BatchMode=yes -o ConnectTimeout=10 shouer "echo ssh-ok && echo '--- nginx resume.conf ---' && cat /etc/nginx/conf.d/resume.conf 2>/dev/null | head -25 && echo '--- unit 状态 ---' && systemctl is-enabled resume-api 2>/dev/null; systemctl is-active resume-api 2>/dev/null || echo '(未激活)'"
