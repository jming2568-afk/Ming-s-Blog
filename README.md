# 李佳铭个人博客

> AIGC 漫剧制片 / 全栈开发工程师个人作品集网站

基于 Next.js 16 + React 19 + Tailwind CSS v4 搭建的个人博客与作品集展示网站，包含个人介绍、双版本简历展示、作品集、联系方式等核心模块。

## 功能模块

- **首页**：Hero 个人介绍 + 数据亮点 + 精选作品 + 技能概览 + 经历时间线
- **简历页**（`/resume`）：AIGC 漫剧制片版 / 全栈开发工程师版双版本切换，支持打印
- **作品集页**（`/portfolio`）：AIGC 漫剧项目 + 开发项目分类筛选展示
- **联系页**（`/contact`）：邮箱 + GitHub 联系方式

## 技术栈

- Next.js 16（App Router）+ React 19
- Tailwind CSS v4
- framer-motion（动画）+ react-icons（图标）+ clsx + tailwind-merge

## 目录结构

```
个人博客/
├── app/
│   ├── layout.js          # 全局布局
│   ├── page.js            # 首页
│   ├── globals.css        # 全局样式
│   ├── resume/page.js     # 简历页
│   ├── portfolio/page.js  # 作品集页
│   └── contact/page.js    # 联系页
├── components/            # 组件（NavBar/Footer/Hero/ProjectCard/ResumeTabs 等）
├── data/                  # 内容数据（修改这里即可更新网站内容）
│   ├── profile.js         # 个人信息
│   ├── resume.js          # 两版简历数据
│   ├── projects.js        # 作品集数据
│   ├── skills.js          # 技能数据
│   └── timeline.js        # 时间线数据
├── lib/utils.js           # 工具函数
├── public/images/         # 静态图片
└── package.json
```

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`

## 内容维护

所有展示内容集中在 `data/` 目录，修改对应文件即可更新网站：

- 修改个人信息/联系方式 → `data/profile.js`
- 修改简历内容 → `data/resume.js`
- 增删作品 → `data/projects.js`
- 修改技能 → `data/skills.js`
- 修改经历 → `data/timeline.js`

## 部署

- **Vercel**（推荐）：连接 GitHub 仓库自动部署
- **静态导出**：在 `next.config.mjs` 添加 `output: 'export'`，`npm run build` 后部署到任意静态托管（注意：导出模式不支持管理后台/上传，仅适合纯静态展示）

## 内容管理后台

访问 `/admin` 可在线编辑网站全部展示内容（个人信息、作品集、技能、经历、双版简历），保存后公开页面即时生效，**无需重新部署**：

- **内容存储**：Vercel Blob（`content.json` + 上传的图片/视频）
- **默认内容**：`data/*.js` 是种子数据；后台保存的内容会覆盖默认值，两者按 key 合并
- **上传媒体**：后台"上传图片/视频"会返回可用的公网 URL，填入内容 JSON 对应字段即可
- **本地开发**：未配置 `BLOB_READ_WRITE_TOKEN` 时，内容降级写入 `data/content.local.json`（已 gitignore），编辑流程照常可用，但上传功能需要真实 token

### Vercel 环境变量（Settings → Environment Variables，全部必配）

| 变量 | 说明 | 示例 |
|---|---|---|
| `AUTH_SECRET` | 管理后台 session 签名密钥（生产必填，缺失会报错） | `openssl rand -hex 32` 生成 |
| `ADMIN_PASSWORD` | 管理后台登录密码（生产必填，缺失会报错） | 一个强密码 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写凭证（Storage → Blob 创建后复制） | `vercel_blob_rw_...` |

配置后重新部署即可；那个 `[auth] 生产环境必须显式设置 AUTH_SECRET` 的报错，就是因为 `AUTH_SECRET` 没配到 Vercel 环境变量里。

### 说明

- 联系方式仅公开邮箱与 GitHub，手机号/微信号在投递时单独提供以保护隐私
- 作品素材版权归原公司所有，网站仅展示项目名称与文字描述
