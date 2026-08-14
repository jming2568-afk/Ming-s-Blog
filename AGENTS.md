# AGENTS.md — 智能体工作规则（Ming-s-Blog）

> 本文件由 Harness 自动加载（AGENTS.md 兼容格式），**仅存放智能体在本仓库工作时的规则与约束**。项目介绍、架构、部署等事实性内容见 `README.md`；不覆盖系统提示词与用户的直接指令，更具体的规则优先于笼统规则。

## 文档索引

| 文档 | 内容 |
|---|---|
| `README.md` | 项目全景：背景、功能、技术栈、架构、部署、使用、贡献指南 |
| `docs/API契约.md` | **仅覆盖 V0.02**（根目录 Next.js 应用）的 HTTP API 接口契约（修改 V0.02 API 的必读文档） |
| `platform/docs/INDEX.md` | V0.03 文档库入口（PRD / PLAN / TECH / OPS / API） |
| `platform/docs/06-api/API-001-契约总则.md` | **仅覆盖 V0.03**（`platform/apps/api` Hono 服务）的 API 契约总则，按域拆分为 API-001~006 |
| `platform/docs/03-tech/TECH-001.md` | V0.03 架构决策 |
| `platform/docs/04-ops/OPS-001.md` | V0.03 部署与更新流程 |

> ⚠️ **版本区分（勿混淆）**：本仓库存在两套完全独立的 API——**V0.02**（根目录 Next.js `app/api/*`，契约见 `docs/API契约.md`）与 **V0.03**（`platform/apps/api` 的 Hono 服务，契约见 `platform/docs/06-api/`，入口 API-001）。两者技术栈、路由、鉴权均不同，禁止跨版本套用契约或修改指引。

## 行为铁律（最高优先级）

1. **Trae 的新页面设计是地基，必须保留**——只能改"页面编辑与数据存储方式"，绝不把页面回退成初始版本，不重写设计系统组件。
2. **存储 = Vercel Blob 单文档**（`lib/store.js`，content.json）；禁止引入数据库/本地持久化（`data/content.local.json` 仅本地无 token 时降级，已 gitignore）。
3. **保存即生效**：公开页服务端动态渲染（`force-dynamic`）+ 客户端 fetch，禁止把内容烤进构建产物。
4. **任务前必做 PRD 环节**：见「决策流程与交互协议」。

## 决策流程与交互协议

- **任务启动前**：根据上下文与用户输入**推断用户意图** → 润色补充（澄清歧义、补全必要信息）→ 输出「推测意图简述」→ **等待用户确认后，才能进入构建/执行环节**。
- **方案分歧时**：存在多种合理方案（视觉/架构/技术选型）必须列出选项、说明取舍并给出推荐，交由用户决策，不擅自拍板。
- **执行过程中**：关键节点简短汇报进展；遇到错误或阻塞立即上报，附原因分析与替代方案，不盲目重试同一动作。
- **改动范围**：只做任务要求的事，不擅自扩大范围；与任务无关的"顺手改进"一律不做。
- **任务完成时**：给出验证结果摘要（构建/回归结论），未验证不得宣称完成。

## 分支与版本操作规则

- `main` = V0.02 冻结版 + Vercel 生产分支，**推送即生产部署**：任何 V0.03 内容不得合并/推送到 main。
- 根目录只允许文档性改动；**不得**对根目录做业务功能开发或架构调整。
- V0.03 开发全部在 `v0.3` 分支的 `platform/` 目录进行，就绪后走 PR/切换流程合入 main。

## 任务执行标准

### 验证流程（改完代码必做）

1. `npm run build` + `npm run start` 启动生产模式
2. 构建产物检查：所有路由应显示 `ƒ (Dynamic)`
3. curl 功能回归，按序覆盖：登录 → 改设置 → 验证首页 footer 实时生效 → 项目 CRUD → 改密 → 上传守卫
4. 修改 V0.02 API 的任务：对照 `docs/API契约.md` 逐项核对契约未被破坏，并同步更新契约文档（V0.03 API 不适用此文档，见文档索引「版本区分」）

### 命令规范（Windows + 沙箱环境）

```bash
# 开发（沙箱内用 managed node 启动）
node.exe node_modules/next/dist/bin/next dev

# 沙箱内 npm（npm 缓存写入受限时）
cmd /c "node.exe node_modules/npm/bin/npm-cli.js install --cache node_modules\.npm-cache --no-audit --no-fund 1>log 2>&1"
```

- 本地测试 curl POST JSON：用单引号 `-d '{"password":"..."}'`（反斜杠转义会破坏 JSON）。

## 代码修改红线

- **勿改 `lib/auth.js`**：不得移除/绕过 `ensureSecret()` 守卫；生产缺 `AUTH_SECRET` 报错是预期行为，修复方式是配置环境变量，不是改代码。
- **勿动 `node_modules/` 与 `.next/`** 内的任何东西。
- **勿建 `tailwind.config.js`**：Tailwind v4 主题在 `app/globals.css` 的 `@theme`。
- framer-motion 组件必须 `"use client"`。
- Next.js 16 动态路由 handler 的 `params` 是 Promise：`const { id } = await params`，`params?.id` 会得 undefined。
- 服务端读内容（Footer/contact 等）必须 `async + await + force-dynamic`，否则把旧数据烤进构建产物。
- `lib/store.js` 内存缓存（2s TTL）不能改成永久化：页面渲染与 API 路由是独立 bundle，永久缓存会导致保存后另一侧读旧值。
- 保持 `getDoc()` 容错语义：任何存储异常不得抛出到页面渲染层，站点必须照常渲染。

## 错误处理与常见坑

- 生产报 `服务初始化失败：[auth] 生产环境必须显式设置 AUTH_SECRET...` → 检查 Vercel 环境变量，勿改代码。
- 上传接口返回 500 且提示缺 token → `BLOB_READ_WRITE_TOKEN` 未配置，属预期守卫行为。
- Vercel Hobby 函数请求体约 4.5MB 上限：大视频上传失败先压缩，而非调大限制。
- 命令连续失败（权限/缓存受限）→ 改用「命令规范」中的沙箱命令形式，仍失败则上报用户。

## 部署与运维协作规则

- **main 分支操作需用户明确指令**：推送/合并到 main 即触发 Vercel 生产部署。
- **V0.03 服务器操作**：VPS 登录 `ssh shouer`（服务器详情见 `README.md`「部署指南」）；部署、更新、回滚严格遵循 `platform/docs/04-ops/OPS-001.md`，不得自创流程。
- better-sqlite3 等原生模块必须在 Linux 服务器上执行 `npm install --omit=dev` 安装，不得上传本地编译产物。
- 生产环境变量（`AUTH_SECRET` / `BLOB_READ_WRITE_TOKEN`）的配置与轮换须经用户确认。
