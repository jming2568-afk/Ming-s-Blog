# 李佳铭个人博客

> AIGC 漫剧制片 / 全栈开发工程师个人作品集网站

基于 Next.js 16 + React 19 + Tailwind CSS v4 的个人博客与作品集展示网站，含 Memphis 风格全新设计。展示内容（个人资料 / 双版简历 / 作品集）可在线编辑，**保存即生效，无需重新部署**。

## 功能模块

- **首页**：Hero 个人介绍 + 精选作品 + 技能概览 + 经历时间线（Memphis 复古风格）
- **简历页**（`/resume`）：AIGC 漫剧制片版 / 全栈开发工程师版双版本切换，支持打印
- **作品集页**（`/portfolio`）：AIGC 漫剧 + 开发项目分类筛选展示
- **联系页**（`/contact`）：邮箱 / GitHub / 微信号 / 微信二维码
- **个人中心**（`/settings`）：登录后可在线编辑个人资料、双版简历、作品集（增删改）、登录密码、上传图片/视频

## 技术栈

- Next.js 16（App Router）+ React 19 + Tailwind CSS v4
- framer-motion（动画）+ react-icons + clsx + tailwind-merge
- jose（JWT session）+ bcryptjs（密码哈希）
- **Vercel Blob**（内容与媒体存储，替代 SQLite）

## 数据与存储架构

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

- **数据文件**：`data/profile.js`、`data/resume.js`、`data/projects.js` 是**种子默认值**；首次访问时初始化到 Blob，之后以 Blob 上的内容为准
- **实时生效**：所有公开页面运行时读取最新内容（服务端组件动态渲染 + 客户端 fetch），在 `/settings` 保存后刷新即可看到
- **本地开发**：未配置 `BLOB_READ_WRITE_TOKEN` 时，内容降级写入 `data/content.local.json`（已 gitignore），编辑流程照常可用；上传功能需要真实 token

## 本地运行

```bash
npm install
npm run dev        # http://localhost:3000
```

首次访问会自动用种子数据初始化内容文档；管理员账号默认 `useradmin / useradmin123`（登录 `/settings` 后请尽快修改密码）。

## 部署（Vercel）

连接 GitHub 仓库自动部署。**必须配置环境变量**（Settings → Environment Variables）：

| 变量 | 说明 |
|---|---|
| `AUTH_SECRET` | 会话签名密钥（**生产必配**，缺失会报错 `服务初始化失败：[auth] 生产环境必须显式设置 AUTH_SECRET...`）。生成：`openssl rand -hex 32` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写凭证（Storage → Create Database → Blob 创建后复制），**生产必配**，否则内容无法持久化、无法上传 |
| `INIT_ADMIN_USERNAME` / `INIT_ADMIN_PASSWORD` | 可选。首次初始化管理员账号，默认 `useradmin / useradmin123` |

> 你最初遇到的 `[auth] 生产环境必须显式设置 AUTH_SECRET` 报错，原因就是 `AUTH_SECRET` 未配置到 Vercel 环境变量；配置后重新部署即消失。
> 视频上传注意：Vercel Hobby 函数请求体上限约 4.5MB，单个视频请先压缩，或后续改用 Blob 客户端直传。

## V0.03 简历公开平台（platform/）

> 开发分支 `v0.3`，与根目录 V0.02 冻结版隔离；部署目标：VPS `ssh shouer`（阿里云首尔 2C1G，**原生部署，无 Docker**）。

- 定位：用户注册 → 编辑/导入简历 → 专属链接展示 → 导出/打印（Word / PDF / 直接打印）
- 技术栈：pnpm monorepo（`apps/web` Vite+React SPA + `apps/api` Hono）+ **SQLite**(Drizzle) + 阿里云 OSS + 客户端 PDF
- 文档库：`platform/docs/INDEX.md`（PRD-001 / PLAN-001 / TECH-001 架构 / OPS-001 部署与更新）
- 服务器信息、登录命令与更新流程见 `AGENTS.md`「服务器（VPS）信息」章节

## 说明

- 联系方式仅公开邮箱与 GitHub，手机号/微信号在投递时单独提供以保护隐私
- 作品素材版权归原公司所有，网站仅展示项目名称与文字描述
- 管理员的 bcrypt 密码哈希存于公开的 content.json 中：请务必在首次登录后修改默认密码，并使用强密码
