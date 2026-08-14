# AGENTS.md — 李佳铭个人博客（Ming-s-Blog）

> 本文件由 DeepSeek Harness 自动加载（AGENTS.md 兼容格式），为在本仓库工作的智能体提供项目导航与关键约束。它不覆盖系统提示词与用户的直接指令；更具体的规则优先于笼统规则。

## ⚠️ 版本状态与分支策略（重要）

- **当前根目录代码 = V0.02（Vercel 专用版），已冻结发布（tag `v0.2.0`）。**
- **main 分支 = V0.02 冻结版，是 Vercel 生产部署分支**——任何 V0.03 内容**不得**合并/推送到 main，否则会触发生产部署并破坏"冻结"语义。
- 根目录只允许文档性改动；**不要**对根目录做业务功能开发或架构调整。
- **V0.03（简历公开平台：用户注册 → 编辑简历 → 专属链接展示 → 导出/打印，Linux + Docker 前后端分离）开发全部在 `v0.3` 分支**，代码位于 `platform/` 目录（PRD 见 `platform/docs/PRD.md`）。V0.03 就绪后通过 PR/切换流程合入 main。
- 本文件描述的是 V0.02 项目本身。

## 项目定位（V0.02）

个人作品集网站：AIGC 漫剧制片 / 全栈开发工程师，Memphis 复古设计。公开页面：首页、`/resume`（AIGC/全栈双版简历，可打印）、`/portfolio`（漫剧+开发分类筛选）、`/contact`；`/settings` 为登录后的在线内容管理。

## 铁律（务必遵守）

1. **Trae 的新页面设计是地基，必须保留**——只能改"页面编辑与数据存储方式"，绝不把页面回退成初始版本，不重写设计系统组件。
2. **存储 = Vercel Blob 单文档**（`lib/store.js`，content.json）；禁止引入数据库/本地持久化（`data/content.local.json` 仅本地无 token 时降级，已 gitignore）。
3. **保存即生效**：公开页服务端动态渲染（`force-dynamic`）+ 客户端 fetch，禁止把内容烤进构建产物。

## 技术栈与关键文件

- Next.js 16.2.6（App Router + Turbopack）、React 19.2.4、Tailwind v4（`app/globals.css`：`@import "tailwindcss"` + `@theme`，无 tailwind.config）、framer-motion、react-icons、clsx、tailwind-merge
- jose（JWT，`AUTH_SECRET`）、bcryptjs、`@vercel/blob` 2.8
- `jsconfig.json`：`@/*` → 项目根
- 目录：`app/`（页面 + API 路由）、`components/`（含 Memphis 设计系统 + 编辑 UI）、`lib/`（存储/认证/业务）、`data/`（种子数据）、`public/images/`、`.trae/documents/`（历史方案文档）、`docs/`（已过期开发指南）

## 数据与存储架构

- 单文档 `content.json`：`{version, admin, loginFailures, settings, resume, projects}`
- `lib/store.js`：`getDoc()`（读：Blob → 本地文件 → 内存种子；任何存储异常不抛错，站点照常渲染）、`updateDoc(mutator)`（读-改-写整体落盘，返回 mutator 结果）；content.json 写入带 `allowOverwrite`；内存缓存 2s TTL（页面渲染与 API 路由是独立 bundle，缓存不能永久化，否则保存后另一侧读旧值）
- `lib/settings.js`：`getSiteSettings/getResumeData/updateSiteSettings/updateResumeData/validateResume`（`aigc` 需 title/summary/workExperience/education/certs + works|abilities；`dev` 需 title/summary + projects|techStack）
- `lib/projects.js`：list（featured 降序、id 降序）/getById/create（自增 id）/update/delete/slugExists
- `lib/users.js`：`getAdmin/findAdminByUserId/checkPassword/getBanState/recordFailure/clearFailures`（3 次失败/5 分钟 → 5 分钟封禁，翻倍，上限 2h）
- `lib/auth.js`（勿改）：jose HS256 + `ensureSecret()`（**生产必须显式设置 AUTH_SECRET**，否则报 `服务初始化失败：[auth] 生产环境必须显式设置 AUTH_SECRET...`）；`createSession/getCurrentUser/clearSessionCookie`
- 种子数据：`data/*.js` 仅首次初始化；之后以 Blob content.json 为准

## API 契约（返回 `{ok:true,...}` 或 `{error}` + 状态码）

| 路由 | 方法 | 说明 |
|---|---|---|
| `/api/auth/login` | POST | `{username,password}` → `{ok,user}`；401 带 attemptsLeft/封禁提示；rate limit |
| `/api/auth/logout` | POST | 清 cookie |
| `/api/auth/session` | GET | `{isLoggedIn,user?}` |
| `/api/settings` | GET/PUT | GET `{ok,settings,resume}`；PUT 白名单键 → `{ok,settings}`；需登录 |
| `/api/settings/password` | PUT | `{oldPassword,newPassword}`；需登录 |
| `/api/settings/resume` | PUT | `{resume}` → `{ok,resume}`；需登录 |
| `/api/projects` | GET/POST | POST `{title,category:manga\|dev,...}` 自动生成 slug；需登录 |
| `/api/projects/[id]` | GET/PUT/DELETE | **Next 16：`params` 是 Promise，须 `await params`** |
| `/api/upload` | POST | multipart；需登录；无 `BLOB_READ_WRITE_TOKEN` 返回明确 500；图片≤8MB/视频≤100MB（Vercel Hobby 函数体约 4.5MB 限制，大视频先压缩） |

## 认证与管理员

- 默认 `useradmin / useradmin123`（首次初始化，可用 `INIT_ADMIN_USERNAME/PASSWORD` 覆盖；`/settings` 登录后立即改密）
- bcrypt 哈希存于公开 content.json——已知权衡，务必强密码
- 客户端：`AuthContext.jsx`（登录态）、`LoginModal.jsx`、`lib/settingsStore.js`/`lib/projectsStore.js`（30s 内存缓存）

## 常用命令（Windows + 沙箱）

```bash
# 开发
npm run dev                 # 或 managed node：node.exe node_modules/next/dist/bin/next dev
# 构建/生产（E2E 验证用）
npm run build && npm run start
# 沙箱内 npm（npm 缓存写入受限时）
cmd /c "node.exe node_modules/npm/bin/npm-cli.js install --cache node_modules\.npm-cache --no-audit --no-fund 1>log 2>&1"
```

构建后所有路由应显示 `ƒ (Dynamic)`；改完代码跑 `next build` + `next start` + curl 回归（登录 → 改设置 → 验证首页 footer 实时生效 → 项目 CRUD → 改密 → 上传守卫）。

## 部署（Vercel）

- 环境变量：`AUTH_SECRET`（`openssl rand -hex 32`，**生产必配**）、`BLOB_READ_WRITE_TOKEN`（**生产必配**，Store 必须 Public Access）、可选 `INIT_ADMIN_USERNAME/PASSWORD`
- 内容编辑保存在 `/settings`，无需重新部署；推送 main 自动部署
- 详细部署指引见 `README.md`

## 常见坑

- Next 16 动态路由 handler 的 `params` 是 Promise（`const { id } = await params`），`params?.id` 会得 undefined
- framer-motion 组件必须 `"use client"`
- Tailwind v4：不要建 tailwind.config.js；主题在 globals.css `@theme`
- 服务端读内容（Footer/contact）必须 `async + await + force-dynamic`，否则把旧数据烤进构建产物
- 本地测试 curl POST JSON：用单引号 `-d '{"password":"..."}'`（反斜杠转义会破坏 JSON）
- 不要在 node_modules/.next 里改东西；不要动 `lib/auth.js` 的 ensureSecret 守卫
