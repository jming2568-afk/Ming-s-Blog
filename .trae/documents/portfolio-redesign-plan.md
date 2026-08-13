# 个人作品集前端改造计划（v2 - 孟菲斯波普风 + 轻量后端）

## 一、项目调研结论

### 1.1 技术栈现状
- **框架**: Next.js 16 + React 19（App Router）
- **样式**: Tailwind CSS 4 + 自定义 CSS 变量
- **动画**: Framer Motion
- **图标**: React Icons (Fi 系列)
- **数据**: 纯静态 JSON 文件（`/data/*.js`），**当前无后端、无数据库**

### 1.2 当前问题诊断（用户反馈）

| 问题 | 具体表现 | 位置 |
|------|---------|------|
| **AI 感过重** | 1. 字体：Inter + PingFang SC（典型 AI 模板字体）<br>2. 配色：`indigo-600 → purple-700` 紫蓝渐变（AI 模板烂大街配色）<br>3. 装饰：`backdrop-blur` 玻璃拟态、`rounded-2xl` 过度圆角、模糊光斑<br>4. 布局：安全居中卡片网格+圆角筛选按钮，零个性 | 全局 / HeroSection / ProjectCard / NavBar |
| **作品集空白** | ProjectCard 封面仅用 FiFilm/FiCode 图标占位，无实际图片或视频展示 | ProjectCard.jsx |
| **无登录/权限** | NavBar 右上角只有 GitHub 链接，无入口区分编辑/访客 | NavBar.jsx |
| **无上传功能** | 纯静态展示，用户无法在网页端上传媒体素材 | 全局缺失 |

### 1.3 设计美学方向（用户选定：孟菲斯波普风）

> 孟菲斯设计运动（Memphis Design）起源于 1980 年代意大利米兰，标志性特征：**高饱和撞色、不对称几何图形、波点/条纹/网格图案、粗黑描边、大胆排版、玩味趣味性**。完美跳出 AI 模板审美舒适区。

**具体落地规范**：

- **字体搭配**（彻底告别 Inter）：
  - 标题/大字：**Archivo Black**（超粗黑几何无衬线，900 weight，力量感爆炸）
  - 正文/信息：**Space Grotesk**（带怪趣味的等宽感无衬线，500/700 weight）
  - 装饰数字：**Bungee Shade**（阴影轮廓字体，用于数字亮点）
  
- **配色体系**（高饱和撞色板）：
  | 角色 | 色值 | 用途 |
  |------|------|------|
  | 底色 1 | `#FFF9E6`（奶油黄） | 大面积背景区块 |
  | 底色 2 | `#FFF0F5`（淡樱花粉） | 交替区块背景 |
  | 主色 A | `#FF3B30`（鲜艳红） | 主按钮、强调色块、描边 |
  | 主色 B | `#007AFF`（电光蓝） | 次级按钮、链接、几何装饰 |
  | 主色 C | `#34C759`（荧光绿） | 标签、成功态、点缀 |
  | 主色 D | `#FF9500`（橙黄） | 分类标签、提示 |
  | 深色 | `#1A1A1A`（纯黑） | 正文、粗描边（所有边框 2-3px solid black） |
  | 对比紫 | `#AF52DE` | 第 5 撞色，仅用于几何装饰 |

- **视觉语言强制规范**（保证「够孟菲斯」）：
  1. **描边铁律**：所有卡片、按钮、输入框、图片统一 `2-3px solid #1A1A1A` 黑色粗边框
  2. **阴影铁律**：所有卡片/按钮使用硬偏移阴影 `4px 4px 0 #1A1A1A`（不模糊、不对流），hover 时变 `2px 2px 0`（按下效果）
  3. **形状铁律**：
     - 圆角只用两种：`rounded-none`（直角）或 `rounded-2xl`（大圆角，16px+），禁止半吊子 `rounded-lg`
     - 大量出现：实心圆 `●`、空心圆 `○`、三角 `△`、波浪线 `〰`、星号 `✦`、波点网格背景
  4. **排版铁律**：
     - 标题：`Archivo Black` + 字距收紧 `tracking-tighter`
     - 禁止「优雅渐入」，用错层位移+弹跳动画（Framer Motion spring 物理）
  5. **装饰元素**：
     - 页面角落随机撒落：小圆点、斜条纹色块、黑描边几何图形
     - Hero 区背景用 CSS 网格 + 波点 pattern（SVG inline data URI）
     - 文字下方加 3px 黄色荧光笔手绘下划线（`linear-gradient` 模拟）

---

## 二、文件与模块改动清单

### 2.1 新增文件（前端 + 后端）

#### 后端层（Next.js Route Handlers + SQLite）
| 文件路径 | 用途 |
|---------|------|
| `/workspace/lib/db.js` | SQLite 数据库初始化 + 通用查询封装（使用 `better-sqlite3` 同步 API，零配置本地文件） |
| `/workspace/lib/auth.js` | 密码哈希（bcryptjs）+ Session 生成/校验（JWT 存 Cookie，`next/jwt` 工具） |
| `/workspace/app/api/auth/login/route.js` | 登录 API：POST 校验账号密码 → 返回 Set-Cookie JWT |
| `/workspace/app/api/auth/logout/route.js` | 登出 API：清除 Cookie |
| `/workspace/app/api/auth/session/route.js` | GET 获取当前登录态 |
| `/workspace/app/api/projects/route.js` | 作品 CRUD：GET 列表 / POST 新建 |
| `/workspace/app/api/projects/[id]/route.js` | 作品详情：GET / PUT 更新 / DELETE 删除 |
| `/workspace/app/api/upload/route.js` | 媒体上传 API：POST multipart/form-data → 存本地 `/public/uploads/` 目录 → 返回 URL |
| `/workspace/scripts/init-db.js` | 数据库初始化脚本：创建 users / projects / media 表 + 插入默认 admin 账号 + 迁移现有 projects.json |

#### 前端组件层
| 文件路径 | 用途 |
|---------|------|
| `/workspace/components/AuthContext.jsx` | 登录状态 Context：从 `/api/auth/session` 拉取，暴露 isLoggedIn / login / logout / user |
| `/workspace/components/LoginModal.jsx` | 登录弹窗（孟菲斯风格）：粗黑描边+硬阴影+用户名密码+「一键填演示账号」按钮 |
| `/workspace/components/MediaUploader.jsx` | 媒体上传组件：拖拽区（黑描边波点虚线框）→ 调用 `/api/upload` → 返回 URL |
| `/workspace/components/ProjectEditor.jsx` | 作品编辑抽屉/弹窗：表单字段完整 + 实时预览 |
| `/workspace/components/MemphisDecor.jsx` | 孟菲斯装饰组件集：随机撒落的小圆、三角、斜条纹块（可复用） |
| `/workspace/components/UiButton.jsx` | 孟菲斯风格按钮组件（统一描边+硬阴影+hover 按下动效） |
| `/workspace/components/UiInput.jsx` | 孟菲斯风格输入框/文本域组件 |
| `/workspace/components/UiTag.jsx` | 孟菲斯风格标签组件（不同背景色+统一黑描边） |

### 2.2 修改文件

| 文件路径 | 改动内容 |
|---------|---------|
| `/workspace/package.json` | 新增依赖：`better-sqlite3`、`bcryptjs`、`jose`（JWT）、`formidable`（文件上传解析） |
| `/workspace/next.config.mjs` | 配置 `experimental.serverComponentsExternalPackages: ['better-sqlite3']` + 上传文件大小限制 |
| `/workspace/app/globals.css` | 1. 引入 Archivo Black / Space Grotesk / Bungee Shade 字体<br>2. 定义孟菲斯配色 CSS 变量<br>3. 定义图案工具类：`.bg-polka`（波点）、`.bg-stripe`（斜条纹）、`.bg-grid`（网格）<br>4. 荧光笔下划线工具类 `.marker-underline`<br>5. 孟菲斯阴影工具类 `.shadow-memphis`（`4px 4px 0 #1A1A1A`） |
| `/workspace/app/layout.js` | 1. `<head>` 添加 Google Fonts 链接<br>2. 最外层包裹 `AuthContext.Provider`<br>3. body 底色换成奶油黄 + 波点纹理叠加 |
| `/workspace/components/NavBar.jsx` | 1. 样式：奶油黄底+2px 黑底描边+左侧几何装饰<br>2. Logo：`Archivo Black` 大字+彩色方块点缀<br>3. 导航链接：hover 时荧光笔黄色下划线动画<br>4. **右上角**：`登录`按钮（孟菲斯 UiButton 红色），已登录显示头像方块+下拉（管理/退出）<br>5. GitHub 按钮保留，换成黑底白字孟菲斯风 |
| `/workspace/components/HeroSection.jsx` | **彻底重写**：<br>1. 背景：奶油黄+波点 pattern+右侧随机几何装饰圆/三角/方块<br>2. 大标题：`Archivo Black` 6xl+，名字分两行+错层位移+弹跳入场<br>3. 关键词标签：不同颜色的 UiTag（红/蓝/绿/橙），带黑描边硬阴影<br>4. Bio 文案：荧光笔黄色下划线标注关键词<br>5. CTA 按钮：两个 UiButton（红实心+蓝线框），硬阴影 hover 按下效果<br>6. 数据亮点：Bungee Shade 字体数字+4 个不同底色的方块卡（各自一种撞色）+ 2px 黑描边 |
| `/workspace/components/ProjectCard.jsx` | **彻底重写**：<br>1. 整体：2px 黑描边 + `shadow-memphis` 硬阴影，hover 时阴影变 2px（按下）<br>2. 封面区：`<img>`/`<video>` 优先，无图时显示项目首字母（Archivo Black 6xl 大字+彩色撞色块背景），全部 `object-cover rounded-none`，底部 3px 黑描边分隔<br>3. 标签：彩色 UiTag<br>4. **编辑模式**：右上角两个小方块按钮（铅笔编辑/垃圾桶删除），孟菲斯风格<br>5. 分类标识：卡片左上角彩色方块（漫剧=红、开发=蓝） |
| `/workspace/components/ProjectFilter.jsx` | 1. 筛选按钮组：UiButton 切换（实心/线框），选中=红色实心+阴影按下<br>2. 已登录：顶部出现「➕ 添加作品」红色大按钮<br>3. 网格间距：`gap-6` 不变，但卡片不缩放过渡，用位移 spring 入场 |
| `/workspace/components/SectionTitle.jsx` | 1. 标题：`Archivo Black` + `tracking-tighter`<br>2. 左侧装饰：20x20 红色实心方块 + 相邻空心圆<br>3. 下方装饰：3px 橙色荧光笔划线，短款不占满 |
| `/workspace/components/Footer.jsx` | （读取后）：奶油粉底+顶部 2px 黑描边+几何装饰 |
| `/workspace/app/page.js` | 1. CTA 区块：红/蓝撞色，2px 黑描边，硬阴影<br>2. 各 section 背景交替：奶油黄 ↔ 奶油粉<br>3. 各 section 角落随机撒 MemphisDecor 几何元素 |
| `/workspace/app/portfolio/page.js` | 1. 登录态下：顶部显示管理工具栏（添加作品/批量操作）<br>2. 标题同样改孟菲斯 SectionTitle |
| `/workspace/data/projects.js` | 保留作为初始种子数据，首次运行 init-db.js 时导入到 SQLite |

---

## 三、实施步骤（按依赖顺序）

### Step 0: 依赖安装 + 后端基础设施
1. `npm install better-sqlite3 bcryptjs jose formidable`
2. 新增 `/workspace/lib/db.js`：
   - 数据库文件路径：`/workspace/data/portfolio.db`（gitignore 排除）
   - 初始化建表 SQL：
     - `users (id INTEGER PK, username TEXT UNIQUE, password_hash TEXT, created_at)`
     - `projects (id INTEGER PK, slug TEXT UNIQUE, title TEXT, category TEXT, role TEXT, tagline TEXT, episodes TEXT, team TEXT, result TEXT, tags TEXT(JSON), featured INTEGER, media_url TEXT, media_type TEXT, created_at, updated_at)`
3. 新增 `/workspace/scripts/init-db.js`：
   - 执行建表
   - bcrypt 哈希默认密码 `admin123` → 插入 `admin` 用户
   - 读取 `/data/projects.js` → 迁移全部到 projects 表
   - 幂等：表已存在则跳过
4. 新增 `/workspace/lib/auth.js`：
   - `hashPassword()` / `verifyPassword()`（bcryptjs）
   - `createSession(userId)` → 用 jose 签 JWT（HS256，secret 读环境变量 `AUTH_SECRET`，默认 fallback 值写死用于开发）
   - `verifySession(token)` → 验签解 JWT
5. 配置 `next.config.mjs`：serverComponentsExternalPackages + 上传 body size limit 100MB

### Step 1: 认证 API + 前端登录系统
1. 新增 API Routes：
   - `POST /api/auth/login` → 读 {username, password} → 查 users 表 → 验密码 → Set-Cookie `session=xxx; HttpOnly; Path=/; SameSite=Lax`（开发环境不强制 Secure）
   - `POST /api/auth/logout` → 清除 session cookie
   - `GET /api/auth/session` → 读 cookie 验签 → 返回 { isLoggedIn, user: {id, username} }
2. 新增 `components/AuthContext.jsx`：
   - `"use client"` + Context + Provider
   - 初始挂载时 `fetch('/api/auth/session')` 拉状态
   - 暴露 `login({username, password})` / `logout()` 方法
3. 新增 `components/LoginModal.jsx`（孟菲斯风）：
   - 遮罩：半透明黑+大波点 SVG pattern
   - 弹窗卡片：奶油黄底+3px 黑描边+`8px 8px 0 #1A1A1A` 大硬阴影
   - 标题：Archivo Black「管理员登录」+ 红色方块装饰
   - 表单：UiInput 用户名/密码（黑描边+硬阴影）
   - 按钮区：红色登录 UiButton + 小字提示「演示账号 admin / admin123」+ 「一键填充」按钮
   - 错误态：红底闪烁 + shake 动画
4. 修改 `NavBar.jsx`：
   - 右上角：`useAuth()` → 未登录 → 红色 UiButton「登录」→ 点击打开 LoginModal
   - 已登录 → 彩色方块头像（首字母）+ 下拉菜单（「管理后台」/「退出登录」）
   - 移动端汉堡菜单同步添加登录入口

### Step 2: 文件上传 API + 媒体组件
1. 新增 `POST /api/upload`：
   - 用 formidable 解析 multipart/form-data
   - 接受字段：`file`（单个文件），`type`（image/video）
   - 校验 MIME 类型：图片 `image/*`，视频 `video/*`
   - 校验大小：图片 ≤ 8MB，视频 ≤ 100MB
   - 保存路径：`/workspace/public/uploads/{YYYY}/{MM}/{random-uuid}.{ext}`（不存在则 mkdir）
   - 返回 JSON：`{ url: '/uploads/...', type, size, name }`
   - 登录保护：校验 session cookie，未登录返回 401
2. 新增 `components/MediaUploader.jsx`：
   - 拖拽区：4px 黑虚线边框+波点浅底+`space-y-2`
   - 文案提示+图标
   - `<input type="file" accept="image/*,video/*">` 点击选择
   - 拖拽进入高亮：红实线边框+背景变白
   - 选中/拖入后 → 显示本地预览（图片缩略图、视频首帧）
   - 「上传」按钮 → 调用 `/api/upload` → 进度条 → 完成后回调 props.onUploaded({url, type})
   - 错误提示

### Step 3: 作品 CRUD API + 编辑组件
1. 新增 API Routes：
   - `GET /api/projects` → 返回 projects 表全量（公开，无需登录）
   - `POST /api/projects` → 新建作品（登录保护，校验字段）
   - `GET /api/projects/[id]` → 单条详情（公开）
   - `PUT /api/projects/[id]` → 更新（登录保护）
   - `DELETE /api/projects/[id]` → 删除（登录保护）
2. 新增 `lib/projectsStore.js`（前端数据层，统一读取来源）：
   - `fetchProjects()` → `fetch('/api/projects')`，替代原来直接 import `@/data/projects`
   - 首页和作品集页改为使用此函数
3. 新增 `components/ProjectEditor.jsx`：
   - 弹出层或右侧抽屉（3px 黑描边+硬阴影）
   - 表单字段：标题、slug（自动从标题生成可编辑）、分类（漫剧/开发 单选切换）、角色、标语、集数、团队、成果描述、标签（输入+回车新增）、上传封面（MediaUploader）、精选开关
   - 提交按钮：红色 UiButton → PUT/POST 对应 API
   - 底部：预览卡片（实时根据输入渲染 ProjectCard 外观）
4. 修改 `ProjectFilter.jsx`：
   - 登录态 → 显示红色大 UiButton「➕ 添加作品」→ 打开空 ProjectEditor
5. 修改 `ProjectCard.jsx`：
   - 登录态 → 右上角显示编辑/删除按钮
   - 删除 → 二次确认弹窗（孟菲斯风格）→ 调用 DELETE API → 刷新列表

### Step 4: 孟菲斯美学体系落地（全站视觉改造）
1. 修改 `globals.css`：
   - Google Fonts import + @font-face fallback
   - `@theme { --color-* }` 定义孟菲斯 8 色板
   - 图案类：`bg-polka-dots`（SVG radial-gradient 波点）、`bg-diagonal-stripes`（SVG repeating-linear-gradient 45deg 条纹）
   - 工具类：`.shadow-memphis`、`.shadow-memphis-sm`、`.border-memphis`（2px solid black）、`.marker-yellow`（黄荧光笔 background linear-gradient）
2. 修改 `app/layout.js`：body 背景换成奶油黄+轻量波点
3. 新增 `components/UiButton.jsx`、`components/UiInput.jsx`、`components/UiTag.jsx`、`components/MemphisDecor.jsx` 统一 UI 基元
4. **视觉改造逐个组件**（严格按孟菲斯铁律执行）：
   - `SectionTitle.jsx` → 几何装饰+荧光笔下划线
   - `HeroSection.jsx` → 大标题弹跳入场+彩色标签+波点背景
   - `ProjectCard.jsx` → 黑描边+硬阴影+彩色封面占位
   - `NavBar.jsx` → Logo 粗字+彩色方块+链接下划线动画
   - `Footer.jsx` → 奶油粉+顶部粗描边
   - `app/page.js` CTA 区块 → 红蓝撞色方块

### Step 5: 作品集展示增强
1. `ProjectCard.jsx` 封面渲染：
   - 有 `media_url` 且 `media_type=video` → `<video muted loop playsinline poster={缩略图}>`，hover 自动 play
   - 有 `media_url` 且 `media_type=image` → `<img className="w-full h-full object-cover" />`
   - 无图 → 彩色撞色背景 + 项目标题首字母 Archivo Black 超大字 + 角落小几何装饰
2. 点击作品卡片 → 弹出详情大图预览 Modal（可选增强）

---

## 四、潜在依赖与注意事项

### 4.1 依赖安装兼容性
- `better-sqlite3` 是 native addon，需要编译环境
  - **风险**：部分精简容器缺 python/make 导致 `npm install` 失败
  - **应对**：失败时降级为 `sql.js`（纯 WASM SQLite，不需要编译），修改 `lib/db.js` 适配
- `bcryptjs` 是纯 JS 实现，无 native 依赖风险

### 4.2 媒体文件存储
- 上传文件存 `/public/uploads/` 目录
- **风险**：`next build` 后 public 目录是静态的，运行时上传不会被打包
  - **应对**：确保开发/生产运行时 `public/uploads/` 目录存在且可写；部署时需单独持久化此目录（volume 挂载）
- **大小**：100MB 视频单文件需关注磁盘空间，可选加 `ffmpeg` 压缩（需要额外安装，暂不纳入）

### 4.3 JWT Secret 管理
- 开发模式：`AUTH_SECRET` 未设置时用写死 fallback（代码里标注 TODO 警告）
- 生产部署：必须通过环境变量注入强随机 secret

### 4.4 Google Fonts 可访问性
- Archivo Black / Space Grotesk / Bungee Shade 全部可从 Google Fonts 获取
- **风险**：中国大陆加载 Google Fonts 可能慢
- **应对**：`display=swap` + 兜底字体栈 `system-ui, -apple-system, "PingFang SC"`，首屏先显示系统字体再替换

### 4.5 Next.js 16 App Router 注意点
- Route Handlers 中解析 Cookie 用 `cookies()` from `next/headers`
- 写文件操作（上传/数据库）必须在 Server Component/Route Handler 中执行，Client Component 里绝对不能 import `better-sqlite3` 或 `fs`
- Server Actions 可选，但为了清晰性一律用 Route Handlers + fetch

---

## 五、风险处理

| 风险 | 概率 | 影响 | 处理方案 |
|------|------|------|---------|
| `better-sqlite3` 安装编译失败 | 中 | 后端无法启动 | 自动 fallback 到 `sql.js`（WASM 版本），DB 存 `/data/portfolio.db` 文件同路径 |
| 上传目录不可写 | 中 | 上传失败 500 | 启动时检测 `/public/uploads/` 权限，不可写则抛错并在首页提示 |
| Session Cookie 丢失/跨域 | 低 | 登录态不稳定 | 同域名部署无跨域问题；Cookie 设置 `SameSite=Lax; Path=/` |
| 孟菲斯风格太过火导致信息可读性差 | 中 | 内容喧宾夺主 | 严格控制：正文区保持简洁，装饰仅出现在区块边角/背景/标题，卡片内部信息密度克制，纯黑描边正文 |
| 现有静态 projects 与 DB 不同步 | 低 | 数据混乱 | 首次 `node scripts/init-db.js` 迁移后，以后只操作 DB，`/data/projects.js` 作为备份种子不再运行时读取 |
