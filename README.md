# 李佳铭个人博客

> AIGC 漫剧制片 / 全栈开发工程师个人作品集网站

基于 Next.js 16 + React 19 + Tailwind CSS v4 的个人博客与作品集展示网站，含 Memphis 复古风格全新设计。展示内容（个人资料 / 双版简历 / 作品集）可在线编辑，**保存即生效，无需重新部署**。

## 项目背景与版本状态

本项目从个人作品集网站（V0.02）起步，正在扩展为简历公开平台（V0.03）：

| 版本 | 状态 | 分支 | 说明 |
|---|---|---|---|
| V0.02 | 已冻结发布（tag `v0.2.0`），Vercel 生产运行 | `main` | 个人作品集网站（本仓库根目录） |
| V0.03 | 开发中 | `v0.3`（代码位于 `platform/` 目录） | 简历公开平台：用户注册 → 编辑简历 → 专属链接展示 → 导出/打印（Word / PDF / 直接打印） |

- `main` 分支是 Vercel 生产部署分支，推送即自动部署
- V0.03 就绪后通过 PR / 切换流程合入 main
- 智能体协作规则见 `AGENTS.md`；V0.03 文档库入口 `platform/docs/INDEX.md`

## 功能特性

- **首页**：Hero 个人介绍 + 精选作品 + 技能概览 + 经历时间线（Memphis 复古风格）
- **简历页**（`/resume`）：AIGC 漫剧制片版 / 全栈开发工程师版双版本切换，支持打印
- **作品集页**（`/portfolio`）：AIGC 漫剧 + 开发项目分类筛选展示
- **联系页**（`/contact`）：邮箱 / GitHub / 微信号 / 微信二维码
- **个人中心**（`/settings`）：登录后可在线编辑个人资料、双版简历、作品集（增删改）、登录密码、上传图片/视频

## 技术栈

- **框架**：Next.js 16（App Router）+ React 19 + Tailwind CSS v4（`app/globals.css`：`@import "tailwindcss"` + `@theme`，无 tailwind.config）
- **UI**：framer-motion（动画）+ react-icons + clsx + tailwind-merge，Memphis 设计系统组件（`components/`）
- **认证**：jose（JWT session，`AUTH_SECRET`）+ bcryptjs（密码哈希）
- **存储**：Vercel Blob（内容与媒体存储，`@vercel/blob` 2.8）
- **路径别名**：`jsconfig.json` 中 `@/*` → 项目根

## 架构设计

### 数据与存储

```
Vercel Blob 上的 content.json（单文档，含 admin/settings/resume/projects）
        ↑ 读写
lib/store.js（Blob 读写 + 本地文件降级）
   ├── lib/settings.js    个人资料 / 简历
   ├── lib/projects.js    作品集 CRUD
   ├── lib/users.js       管理员账号 + 登录限流
   └── /api/* 路由（settings / projects / auth / upload）
        ↑ fetch
前端组件（settingsStore / projectsStore，客户端 30s 缓存）
```

- **单文档模型**：`content.json` 结构为 `{version, admin, loginFailures, settings, resume, projects}`
- **读路径**（`getDoc()`）：Blob → 本地文件 → 内存种子，三级降级；任何存储异常不抛错，站点照常渲染
- **写路径**（`updateDoc(mutator)`）：读-改-写整体落盘，返回 mutator 结果；写入带 `allowOverwrite`
- **内存缓存 2s TTL**：页面渲染与 API 路由是独立 bundle，缓存不能永久化，否则保存后另一侧读到旧值
- **种子数据**：`data/*.js` 仅首次初始化；之后以 Blob 上的 content.json 为准
- **本地降级**：未配置 `BLOB_READ_WRITE_TOKEN` 时，内容降级写入 `data/content.local.json`（已 gitignore），编辑流程照常可用；上传功能需要真实 token

### 目录结构

```
app/            页面 + API 路由（App Router）
components/     Memphis 设计系统 + 编辑 UI
lib/            存储 / 认证 / 业务逻辑
data/           种子数据（首次初始化用）
public/images/  静态图片
docs/           开发文档（API 契约等）
.trae/documents/ 历史方案文档
platform/       V0.03 简历公开平台（v0.3 分支）
```

### 核心模块

| 模块 | 职责 |
|---|---|
| `lib/store.js` | 单文档读写（getDoc / updateDoc），Blob → 本地 → 内存三级降级 |
| `lib/settings.js` | `getSiteSettings / getResumeData / updateSiteSettings / updateResumeData / validateResume`（简历校验规则见 [docs/API契约.md](docs/API契约.md)） |
| `lib/projects.js` | list（featured 降序、id 降序）/ getById / create（自增 id、自动 slug）/ update / delete / slugExists |
| `lib/users.js` | `getAdmin / findAdminByUserId / checkPassword / getBanState / recordFailure / clearFailures`（3 次失败/5 分钟 → 5 分钟封禁，翻倍，上限 2h） |
| `lib/auth.js` | jose HS256 JWT + `ensureSecret()`（生产必须显式设置 `AUTH_SECRET`）+ `createSession / getCurrentUser / clearSessionCookie` |
| `lib/settingsStore.js` / `lib/projectsStore.js` | 客户端 30s 内存缓存 |
| `components/AuthContext.jsx` / `LoginModal.jsx` | 登录态管理与登录弹窗 |

### API

后端提供四组路由：`/api/auth`（认证）、`/api/settings`（设置与简历）、`/api/projects`（作品集 CRUD）、`/api/upload`（媒体上传）。

完整接口契约（请求/响应格式、鉴权要求、校验规则、限制）见 **[docs/API契约.md](docs/API契约.md)**。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start   # 生产模式（E2E 验证用）
```

- 首次访问自动用种子数据初始化内容文档
- 管理员账号默认 `useradmin / useradmin123`（可用 `INIT_ADMIN_USERNAME` / `INIT_ADMIN_PASSWORD` 覆盖），登录 `/settings` 后请尽快修改密码
- 未配置 Blob token 时自动降级到本地文件存储（见「架构设计 → 数据与存储」）

## 部署指南

### Vercel（V0.02）

连接 GitHub 仓库自动部署。**必须配置环境变量**（Settings → Environment Variables）：

| 变量 | 说明 |
|---|---|
| `AUTH_SECRET` | 会话签名密钥（**生产必配**，缺失会报错 `服务初始化失败：[auth] 生产环境必须显式设置 AUTH_SECRET...`）。生成：`openssl rand -hex 32` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写凭证（Storage → Create Database → Blob 创建后复制），**生产必配**，且 Blob Store 必须为 Public Access，否则内容无法持久化、无法上传 |
| `INIT_ADMIN_USERNAME` / `INIT_ADMIN_PASSWORD` | 可选。首次初始化管理员账号，默认 `useradmin / useradmin123` |

- 内容编辑保存在 `/settings`，无需重新部署；推送 main 自动部署
- 视频上传注意：Vercel Hobby 函数请求体上限约 4.5MB（详见 [docs/API契约.md](docs/API契约.md)）

### VPS 自建（V0.03 · platform/）

V0.03 简历平台部署在阿里云 ECS（首尔），**Linux 原生部署，无 Docker（有意为之，省内存）**：

| 项 | 值 |
|---|---|
| 登录命令 | `ssh shouer`（`~/.ssh/config` 已配置；密钥 `~/.ssh/首尔.pem`） |
| 主机 | `47.80.27.242`（阿里云 ECS · 首尔 ap-northeast-2），`root@22` |
| 规格 | `ecs.e-c2m1.large`（2C1G，可用 ~700MB，暂不可升级）+ 4G swap 兜底 |
| 系统 | Debian 12；已装 nginx / Node 22 / pnpm / sqlite3 |
| 部署目标 | `/opt/resume-platform`（systemd unit `resume-api` + nginx 站点 `resume.conf` 已就位，`User=resume`） |
| 技术栈 | pnpm monorepo（`apps/web` Vite+React SPA + `apps/api` Hono）+ SQLite(Drizzle) + 阿里云 OSS + 客户端 PDF |

**更新机制**：本地构建 → tar/scp 直传 → 服务器 `npm install --omit=dev`（better-sqlite3 原生模块须在 Linux 上安装）→ 重启。详细流程见 `platform/docs/04-ops/OPS-001.md`，架构决策见 `platform/docs/03-tech/TECH-001.md`。

## 使用说明

1. 访问 `/settings`，使用管理员账号登录（默认 `useradmin / useradmin123`）
2. 在线编辑：
   - **个人资料**：首页 Hero、联系方式、footer 等
   - **双版简历**：AIGC 漫剧制片版 / 全栈开发工程师版，各有必填校验（见 API 契约）
   - **作品集**：增删改项目（AIGC 漫剧 / 开发分类，支持 featured 置顶首页）
   - **安全**：修改登录密码；上传图片/视频
3. **保存即生效**：公开页面为服务端动态渲染（`force-dynamic`）+ 客户端 fetch（30s 内存缓存），保存后刷新页面即可看到最新内容，无需重新部署

## 贡献指南

- **分支模型**：`main` 为 V0.02 冻结版（仅接受文档性改动与必要修复）；V0.03 功能开发一律在 `v0.3` 分支的 `platform/` 目录进行，就绪后通过 PR 合入
- **提交前验证**：`npm run build` 通过（构建后所有路由应显示 `ƒ (Dynamic)`），并完成功能回归（清单见 `AGENTS.md`「任务执行标准」）
- **接口变更**：修改任何 API 时必须同步更新 [docs/API契约.md](docs/API契约.md)
- **开发注意事项**（Next 16 / Tailwind v4 / framer-motion 等易踩坑点）见 `AGENTS.md`「错误处理与常见坑」

## 安全与隐私说明

- 管理员的 bcrypt 密码哈希存于公开的 content.json 中（已知权衡）：请务必在首次登录后修改默认密码，并使用强密码
- 联系方式仅公开邮箱与 GitHub，手机号/微信号在投递时单独提供以保护隐私
- 作品素材版权归原公司所有，网站仅展示项目名称与文字描述
