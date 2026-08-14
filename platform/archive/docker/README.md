# Docker 相关文件归档（生产弃用）

> 依据：TECH-001（低内存原生部署）。生产不再使用 Docker（内存账单：守护进程 ~120MB + postgres ~200MB + Chromium 峰值 500MB+，在 701Mi 机器上必 OOM）。
> 这些文件**仅供本地开发参考**，不要用于生产。

| 文件 | 原用途 |
|---|---|
| `docker-compose.yml` | 六服务编排（nginx/web/api/pdf/postgres/minio，已包含 pdf/minio 的废弃中间态） |
| `api.Dockerfile` | API 镜像（tsup 全量打包；注意 better-sqlite3 为 external，Docker 内需 node_modules） |
| `web.Dockerfile` | Web 静态镜像（nginx 托管 SPA） |
| `nginx.conf` | compose 内 nginx 反代（含 Docker DNS 动态解析） |
| `web.conf` | web 容器内 SPA 静态托管配置 |

## 生产部署（新方案）

见 `platform/deploy/`：systemd + 宿主机 nginx + 单 Node API + SQLite + 阿里云 OSS + 客户端 PDF。

## 本地开发（可选 Docker）

本地开发已可纯原生运行（`pnpm dev`，vite + tsx API + SQLite），无需 Docker。若需容器化本地环境，可参考本目录文件自行适配。
