---
id: TECH-001
title: 部署架构调整书——低内存原生部署（方案 A）
status: active
created: 2026-08-15
updated: 2026-08-15
owner: ming
summary: 因 2C1G 低内存 VPS（可用 701Mi，无法升级实例）承载不了 Docker Compose 六服务栈，将 V0.03 部署模式调整为「原生 systemd + nginx + 单 Node API + SQLite + 阿里云 OSS + 客户端 PDF」。本文为开发方向调整依据，含文件级改动清单。
---

# 部署架构调整书——低内存原生部署（方案 A）

> 关联：PRD-001（§9 非功能需求·容量/部署）、PLAN-001（P1/P6 部署口径）
> 状态：active ｜ 决策人：ming ｜ 2026-08-15
> 本文面向正在开发的 coder：**按第 4 节文件级改动清单调整开发方向**，并同步更新 PRD-001 §9 与 PLAN-001 的部署假设。

---

## 0. 变更速览

| # | 改动项 | 从（原方案） | 到（新方案） | 原因 |
|---|---|---|---|---|
| 1 | 生产部署编排 | Docker Compose（nginx+web+api+pdf+postgres+minio 六服务） | **原生 systemd + 宿主机 nginx**（单 Node API 进程） | 省 Docker 守护进程 ~120MB；运维简单稳定 |
| 2 | 数据库 | PostgreSQL 16（独立进程） | **SQLite（better-sqlite3，嵌入式）** | 省 ~200MB 常驻；20 人试运行数据量完全足够 |
| 3 | PDF 导出 | 服务端 `apps/pdf`（Playwright 无头 Chromium） | **客户端浏览器打印**（`window.print()` + `@media print`） | Chromium 渲染峰值 500MB+，在 701Mi 上必 OOM；客户端零成本且更贴「三端同版式」卖点 |
| 4 | 对象存储 | 本地 MinIO | **阿里云 OSS**（S3 兼容，远端） | 省本地 100MB+；生产本就应使用云端对象存储 |
| 5 | 更新机制 | compose 起全栈验收 | **本地构建 + scp/tar 产物直传服务器 + systemd 重启**；GitHub Actions 仅作验证门禁（typecheck/test/build，不自动部署） | 服务器零构建、无 Docker 传输依赖，更新由开发机直连完成 |
| 6 | 兜底 | 无 | **加 4G swap**（约内存 5.7 倍，兜住服务器端构建/突发峰值） | 防突发 OOM |

**一句话**：V0.03 业务架构（Hono API + React SPA + Drizzle ORM + S3 兼容存储 + LLM 代理）**全部保留**，只换「部署底座」——数据库方言、PDF 实现方式、部署编排三处，使其能在 701Mi 内存的机器上长期稳定运行。

**更新机制（2026-08-15 定案）**：本地构建 → 构建产物（dist）经 scp/tar 直传服务器 → 数据库迁移 → `systemctl restart`。传产物不传源码；服务器无源码、无 Docker、无构建工具。详见 OPS-001。

---

## 1. 背景与决策依据

### 1.1 服务器实况（已实测）

- 阿里云 ECS **经济型 e 系列** `ecs.e-c2m1.large`（2 vCPU / **1 GiB**），实例元数据确认。
- `/proc/meminfo`：MemTotal **718,660 kB（≈701Mi）**，无 swap，MemAvailable 约 460MB。
- **用户明确：暂不能升级实例规格。** 需在现有 701Mi 上支撑 V0.03 全功能。

### 1.2 为什么原方案必挂（内存账单）

原 compose 六服务在 701Mi 上的真实开销：

| 服务 | 常驻内存（约） | 说明 |
|---|---|---|
| postgres:16-alpine | 150–250MB | 独立 DB 进程（shared_buffers 默认 128MB） |
| pdf（Playwright + Chromium） | 空闲 ~300MB / **渲染 500MB+** | 每个 PDF 请求一个无头浏览器 |
| minio | 80–150MB | 本地对象存储 |
| api（Node Hono） | 60–100MB | |
| web（nginx 静态）+ nginx 反代 | 20–40MB | |
| Docker 守护进程 + containerd | 100–150MB | 宿主机开销 |
| 阿里云 aegis/云监控/assist | ~70MB | 已常驻 |

**合计 800MB~1.3GB，PDF 渲染峰值 >1.5GB —— 超出可用内存一倍以上，必然 OOM。** 结论：不是「调优」能救的，必须改部署模式。

### 1.3 决策

采纳**方案 A（低内存原生部署）**，见第 0 节速览。核心取舍：

- **Playwright/Chromium 绝不部署在这台机器上**（最大内存杀手，改为客户端打印）。
- **PostgreSQL 进程化数据库换成嵌入式 SQLite**（省一个服务进程）。
- **本地对象存储换成远端阿里云 OSS**（生产本应如此）。
- **放弃生产 Docker**（省守护进程开销；本地/CI 仍可用）。

---

## 2. 目标架构

```
                           公网
                             │ 80 / 443 (TLS, certbot)
                             ▼
                    宿主机 nginx (Debian 12)
                     ├── /             → SPA 静态文件（apps/web/dist）
                     ├── /assets/*     → 长缓存（30d, immutable）
                     ├── /api/*        → 反代 127.0.0.1:3000（Hono API）
                     └── 健康检查      → /api/health
                                        │
                                    ┌───▼────┐
                                    │ Node 22 │  单进程（systemd: resume-api）
                                    │  Hono   │
                                    └───┬────┘
                            ┌───────────┼───────────────┐
                            ▼           ▼               ▼
                     SQLite 文件    阿里云 OSS     火山方舟 LLM(ARK)
                   /var/lib/resume   (S3 兼容)      (HTTP 代理, P5)
                   resume.db (WAL)
```

- **无 Docker**、无独立 DB 进程、无本地对象存储、无浏览器渲染服务。
- 前端 SPA 与 API **同源**（nginx 反代 `/api`），生产不再需要 CORS 白名单。
- 常驻内存预算：nginx ~20MB + API ~80MB + 阿里 agent ~70MB ≈ **~170–200MB**，加 4G swap 兜底，余量充足。

---

## 3. 内存预算（新方案）

| 组成 | 约常驻 |
|---|---|
| 宿主机 nginx | 15–25MB |
| Node API（Hono + better-sqlite3） | 60–100MB |
| SQLite（嵌入式，无独立进程） | 0（计入 API 进程） |
| 阿里云 agents | ~70MB |
| **合计** | **~170–200MB**（4G swap 兜底） |

---

## 4. 文件级改动清单（供开发执行，按序实施）

> 全部改动在 `platform/` 目录、**v0.3 分支** 进行；不得触碰根目录 V0.02 冻结版（AGENTS.md）。

### 4.1 数据库层：PostgreSQL → SQLite（Drizzle ORM 保留）

**改动文件：**

1. **`packages/shared/src/db/schema.ts`**
   - import：`drizzle-orm/pg-core` → `drizzle-orm/sqlite-core`
   - `pgTable(...)` → `sqliteTable(...)`
   - `serial("id").primaryKey()` → `integer("id").primaryKey({ autoIncrement: true })`
   - `jsonb("...")` → `text("...", { mode: "json" })`（`resumes.data`、`resume_versions.data`、`themes.tokens`）
   - `timestamp("...", { withTimezone: true })` → SQLite 无时区：`integer("...", { mode: "timestamp" })`；`defaultNow()` 保留（Drizzle sqlite-core 支持，存 unix 毫秒）
   - 唯一索引 / 普通索引（`uniqueIndex` / `index`）API 一致，基本照搬
   - `references(() => users.id, { onDelete: "cascade" })` 语法一致
   - **字段名、表名、业务语义全部不变**，仅方言

2. **`apps/api/drizzle.config.ts`**
   - `dialect: "postgresql"` → `"sqlite"`
   - `dbCredentials: { url: "postgres://..." }` → `{ url: "file:./sqlite.db" }`（默认值；生产用环境变量覆盖）

3. **`apps/api/src/db/index.ts`**
   - `drizzle-orm/postgres-js` + `postgres` 包 → `drizzle-orm/better-sqlite3` + `better-sqlite3`
   - 打开连接时启用：`PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;`
   - 环境变量 `DATABASE_URL` → **`SQLITE_PATH`**（如 `/var/lib/resume/resume.db`）；未配置时返回 null 的「不阻断健康检查」行为**保留**
   - 懒加载单例结构不变

4. **`apps/api/src/db/migrate.ts`**
   - `drizzle-orm/postgres-js/migrator` → `drizzle-orm/better-sqlite3/migrator`
   - 迁移目录查找逻辑保留（drizzle-kit 生成的 sqlite 迁移仍输出到 `apps/api/drizzle`）
   - `apps/api/src/db/migrate-cli.ts` 基本不变

5. **`apps/api/src/config.ts`**
   - `databaseUrl` → `sqlitePath`；读取 `SQLITE_PATH`（默认 `./data/resume.db`）；缺失时 warn（保留）
   - 同时**移除 `pdfServiceUrl` 字段**（见 4.2）

6. **`apps/api/package.json`**
   - 移除 `postgres`
   - 新增 `better-sqlite3`（及 `@types/better-sqlite3` devDep）
   - `drizzle-orm` 保留

7. **迁移 SQL 重建**
   - 删除旧 `apps/api/drizzle/*`（pg 方言 SQL）
   - 重跑 `pnpm --filter @platform/api db:generate` 生成 sqlite 迁移
   - **人工 review 生成的 SQL**（jsonb→text、timestamp→integer、外键/索引）

**注意事项：**
- `resumeVersions` / `media` / `themes` 表保留（P4/P5 启用）
- SQLite 并发写：WAL + busy_timeout 已覆盖；20 人规模无碍
- **必须由集成测试在 SQLite 上兜底**（见 4.6），防方言差异漏网

### 4.2 PDF 层：服务端 Playwright → 客户端打印

**改动文件：**

1. **`apps/pdf/` 整个 app 退役**
   - 从仓库删除目录（git 历史保留），或移入 `apps/_legacy/`
   - 从 `pnpm-workspace.yaml` 移除引用（若为通配符 `apps/*` 则删目录即可）
   - CI/package.json 无独立引用则无需处理
2. **`apps/api/src/modules/export/export.routes.ts`**
   - **删除** `GET /api/export/pdf/:slug`（服务端 PDF 委托路由）
   - **保留** `GET /api/export/word/:slug`（docx 本地生成，内存友好，P4 继续做）
3. **`apps/api/src/app.ts`**：`createExportRoutes` 不再传 `pdfServiceUrl`
4. **`apps/api/src/config.ts`**：移除 `pdfServiceUrl` 配置项
5. **前端（apps/web）新增「打印 / 下载 PDF」交互**
   - 在分享页 `/r/:slug` 与工作台预览处加「打印 / 另存为 PDF」按钮 → `window.print()`
   - 复用 P3 已验收的 `@media print`（A4 分页、隐藏导航/按钮、`.resume-view` 纯净版式）——**这是客户端 PDF 的基石，直接复用**
   - 可选：新增 `/r/:slug/print` 纯净打印路由（无任何交互元素），更稳
   - 按钮点击前确保 `.resume-view` 已渲染完成（等 React 挂载）

**注意事项：**
- 三端一致性的验收口径变为：**线上展示 = 浏览器打印 = 另存为 PDF 同版式**
- 需在 Chrome / Edge / 微信内置浏览器实测打印（见 §9）

### 4.3 存储层：本地 MinIO → 阿里云 OSS（代码基本不动）

**现状**：`packages/shared/src/storage/s3.ts` 已是 S3 兼容通用实现（`@aws-sdk/client-s3` + 自定义 endpoint），MinIO/TOS/OSS/COS 均可用。**代码层无需改动，仅环境变量切换。**

**生产环境变量（示例，阿里 OSS）：**

```env
STORAGE_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
STORAGE_REGION=oss-cn-hangzhou
STORAGE_ACCESS_KEY_ID=<RAM 用户 AccessKey ID>
STORAGE_SECRET_ACCESS_KEY=<AccessKey Secret>
STORAGE_BUCKET=resume-platform
STORAGE_PUBLIC_URL_BASE=https://resume-platform.oss-cn-hangzhou.aliyuncs.com
```

**注意事项（接入时验证）：**
- 阿里 OSS 的 S3 兼容 API 使用**虚拟主机式**端点（bucket 在 host 上），`forcePathStyle` 可能需要设为 `false`；`s3.ts` 目前硬编码 `forcePathStyle: true` → **改为可配置**（新增 `STORAGE_PATH_STYLE` 环境变量，默认 false，MinIO 场景设 true）
- `ensureBucket()` 里的匿名读策略对 OSS 不生效（已 try/catch 忽略）；生产用 OSS 桶 ACL 或 CDN 控制公网读
- 建议先用 `ossutil` 或最小脚本验证 endpoint/上传/公网 URL 三件事

### 4.4 部署/编排：移除生产 Docker，落地原生部署

**改动文件：**

1. **`docker-compose.yml` + `apps/*/Dockerfile`**
   - 标注「生产弃用，仅供本地开发参考」：建议移入 `platform/archive/docker/` 或加文件头注释
   - **不要**在仓库删除前不说明，避免 coder 误用
2. **新增 `platform/deploy/` 目录**（模板文件，落地下次部署时使用）：
   - `resume-api.service` —— systemd unit（ExecStart=node dist/index.js、Restart=always、`LimitNOFILE`、可选 `MemoryMax=512M`）
   - `nginx-resume.conf` —— SPA 静态 + `/assets/` 长缓存 + `/api/*` 反代 127.0.0.1:3000（基于现有 `nginx/web.conf` 扩展）
   - `deploy.sh` —— 本地 build → **scp/tar 产物直传** → 远程迁移+`systemctl restart resume-api`（幂等；Windows 原生 scp.exe/tar.exe + ssh shouer，两端均无需装 rsync）
   - `backup.sh` —— `sqlite3 resume.db ".backup ..."` + `ossutil cp` 到 OSS（配合 cron）
3. **健康检查口径**：`/api/health` 契约不变（systemd/nginx 用 curl 探测）

### 4.5 配置与环境变量对照

| 用途 | 旧（原方案） | 新（方案 A） |
|---|---|---|
| 端口 | `PORT=3000` | 不变 |
| 数据库 | `DATABASE_URL=postgres://...` | `SQLITE_PATH=/var/lib/resume/resume.db` |
| PDF | `PDF_SERVICE_URL=http://pdf:3210` | **删除**（不再有 PDF 服务） |
| 存储 | `STORAGE_*` → minio（path-style） | `STORAGE_*` → OSS（新增 `STORAGE_PATH_STYLE=false`） |
| CORS | `CORS_ORIGINS=http://localhost:5173` | 生产同源可留默认；开发本地仍需要 |
| LLM | `ARK_API_KEY` | 不变 |

### 4.6 测试基建：集成测试改跑 SQLite（CI 也能全跑）

**现状**：`auth.integration.test.ts` / `resume.integration.test.ts` 用 `Boolean(DATABASE_URL)` 判定、无 DB 时 `skipIf` 跳过；CI 因此不跑集成测试。

**改动：**
- 集成测试改为**自动使用临时 SQLite**（`better-sqlite3` 支持 `:memory:` 或 `mkdtemp` 临时文件），去掉 `skipIf(!hasDb)` 的跳槽逻辑 → **CI 默认全跑集成测试**（回归信心提升）
- 测试启动前跑 `db:migrate`（或直接执行 drizzle 迁移到临时库）
- 每个测试文件用独立临时库，避免串扰

### 4.7 CI/CD（`.github/workflows/ci.yml`）

- `pnpm install` / `docs:check` / `typecheck` / `test` / `build` **保持不变**，作为发布前验证门禁
- 集成测试随 4.6 改造后自动纳入 `pnpm test`（CI 无需再起 postgres 服务）
- **CI 不接自动部署**：更新由开发机本地构建后直传（见 OPS-001 §3）。后续如需自动化，可加 deploy job（预留接口，本次不做）

---

## 5. 保留不变（防止误改）

以下为已验收成果，**不允许**因部署调整而回退：

- 前端技术栈：Vite + React 19 SPA + React Router + TanStack Query + Tailwind v4
- 主题系统：5 套设计令牌主题（P3 已验收）
- 认证：httpOnly cookie 会话 + bcryptjs + 限流（P2 已验收）
- Hono API 结构、`/api/health` 契约、统一 `{ok,error}` 响应
- 业务数据模型字段（users/sessions/resumes/resume_versions/themes/media）——只换存储方言，不改字段
- **三端同源渲染引擎 + `@media print` 一致性内核**（反而要强化，作为客户端 PDF 的基石）

---

## 6. 已完工程度的影响与迁移

| 阶段 | 现状 | 本次调整影响 |
|---|---|---|
| P1 骨架 | ✅ 完成（compose 四服务验收） | compose 验收口径**作废**，改「systemd + nginx 起服务 + /api/health 200」 |
| P2 认证 | ✅ 完成 | 业务零影响；仅 schema 方言 + 测试基建调整 |
| P3 简历核心 | ✅ 完成 | 业务零影响；`@media print` 直接复用为客户端 PDF 基石 |
| P4 交付 | ⬜ 未开始 | PDF 改客户端实现；Word（docx）/二维码不受影响；上传接 OSS |
| P5 AI | ⬜ 未开始 | 服务端 LLM 代理（火山方舟）不受影响；OCR 用多模态 LLM 远端 API，无本地模型 |
| P6 上线 | ⬜ 未开始 | 按 §8 落地清单执行 |

---

## 7. 风险与缓解

| 风险 | 等级 | 缓解 |
|---|---|---|
| SQLite 并发写瓶颈 | 低 | WAL + busy_timeout；20 人规模无碍；定期 `VACUUM`；后续可平滑迁 PG |
| 客户端 PDF 三端一致性依赖浏览器 | 中 | 验收矩阵：Chrome/Edge/Safari/微信内置；纯净打印路由；`@media print` 强化测试 |
| 方言差异（jsonb/timestamp/迁移 SQL） | 中 | drizzle-kit 生成 + 人工 review 迁移 SQL；集成测试在 SQLite 上全跑兜底 |
| 无 Docker 后环境一致性 | 中 | `.nvmrc` 锁定 Node 22；`deploy.sh` 幂等；文档化依赖清单 |
| OSS S3 兼容细节（forcePathStyle/endpoint） | 中 | 接入时先 ossutil 验证；`STORAGE_PATH_STYLE` 可配置 |
| 内存波动（如大文件上传/LLM 响应） | 低 | 4G swap 兜底；上传大小限制（复用 V0.02 经验：图片≤8MB 等） |

---

## 8. 服务器落地清单（OPS，P6 执行）

1. **加 swap 4G**（`fallocate` + `mkswap` + `swapon` + fstab；已落地）
2. 安装：nginx、Node 22 LTS（nvm 或官方二进制）、pnpm、sqlite3、ossutil
3. 目录：`/opt/resume-platform/{app,data,logs}`；SQLite 放 `data/resume.db`
4. 部署：`deploy.sh`（build → rsync → `systemctl restart resume-api`）；nginx 配 TLS（certbot）
5. 备份：cron 每日 `backup.sh`（sqlite `.backup` + ossutil 传 OSS）
6. 安全：ufw（仅 22/80/443）、启用 fail2ban（已安装但 inactive）
7. 监控：`/api/health` 定时 curl；可用 `free -m` 观测常驻内存 < 250MB

---

## 9. 新验收标准（替代原 P1/P6 口径）

- **服务**：nginx + systemd 起服务后 `/api/health` 200；`systemctl status resume-api` 正常
- **主流程**：注册 → 登录 → 编辑 → 发布 → `/r/:slug` 展示 → 打印/另存 PDF **与线上同版式**
- **存储**：头像/证书上传走阿里云 OSS，公网直链可访问
- **内存**：空闲常驻 **< 250MB**；20 并发压测不 OOM
- **测试**：`pnpm test` 全绿（含 SQLite 上的集成测试）；`pnpm docs:check` 通过
- **备份**：`backup.sh` 产出的备份可恢复

---

## 10. 附件

### 10.1 内存账单对照

| 组件 | 原方案（OOM） | 新方案（稳定） |
|---|---|---|
| 数据库 | PostgreSQL ~200MB | SQLite 0MB（嵌入 API 进程） |
| PDF | Chromium 300–500MB | 客户端打印 0MB |
| 对象存储 | MinIO ~100MB | OSS 远端 0MB |
| 编排 | Docker ~120MB | systemd 0MB |
| API+nginx+agents | ~200MB | ~200MB |
| **合计** | **~800MB–1.3GB ❌** | **~170–200MB ✅** |

### 10.2 关键命令备忘（服务器）

```bash
# swap
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 部署（deploy.sh 核心：本地构建 + tar/scp 直传）
pnpm --filter @platform/web build && pnpm --filter @platform/api build
# 备份上一版 + SQLite 后，tar 管道覆盖（或 scp -r）：
tar -C apps/web -czf - dist | ssh shouer "rm -rf /opt/resume-platform/app/web && mkdir -p /opt/resume-platform/app/web && tar -xzf - -C /opt/resume-platform/app/web"
tar -C apps/api -czf - dist | ssh shouer "rm -rf /opt/resume-platform/app/api && mkdir -p /opt/resume-platform/app/api && tar -xzf - -C /opt/resume-platform/app/api"
ssh shouer "cd /opt/resume-platform/app/api && SQLITE_PATH=/opt/resume-platform/data/resume.db node dist/migrate-cli.js && systemctl restart resume-api"
ssh shouer "curl -fsS http://127.0.0.1:3000/api/health && echo OK"
```
