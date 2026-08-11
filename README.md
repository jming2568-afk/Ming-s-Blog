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
- **静态导出**：在 `next.config.mjs` 添加 `output: 'export'`，`npm run build` 后部署到任意静态托管

## 说明

- 联系方式仅公开邮箱与 GitHub，手机号/微信号在投递时单独提供以保护隐私
- 作品素材版权归原公司所有，网站仅展示项目名称与文字描述
