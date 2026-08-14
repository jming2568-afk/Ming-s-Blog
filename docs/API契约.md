# API 契约（V0.02 · Ming-s-Blog）

> 本文档是 V0.02 根目录应用的 HTTP API 接口契约，是前后端开发与接口变更的唯一事实来源。**修改任何 API 时必须同步更新本文档。** 项目全景见 `README.md`，智能体开发规则见 `AGENTS.md`。

## 通用约定

- **响应格式**：所有接口返回 JSON——成功 `{ "ok": true, ... }`；失败 `{ "error": "..." }` 并携带对应 HTTP 状态码
- **鉴权**：标注「需登录」的接口依赖 JWT session cookie（jose HS256，`lib/auth.js`）；未登录返回 401
- **动态路由（Next.js 16）**：路由 handler 的 `params` 是 Promise，必须 `const { id } = await params`；直接 `params?.id` 会得到 `undefined`

## 接口清单

### 认证 `/api/auth`

| 路由 | 方法 | 鉴权 | 请求 | 成功响应 |
|---|---|---|---|---|
| `/api/auth/login` | POST | 公开 | `{username, password}` | `{ok, user}` |
| `/api/auth/logout` | POST | 公开 | — | `{ok}`（清除 session cookie） |
| `/api/auth/session` | GET | 公开 | — | `{isLoggedIn, user?}` |

**登录限流**：3 次失败 / 5 分钟 → 封禁 5 分钟；封禁后继续失败则时长翻倍，上限 2 小时。封禁期间登录返回 401 并携带 `attemptsLeft` / 封禁提示。

### 设置 `/api/settings`

| 路由 | 方法 | 鉴权 | 请求 | 成功响应 |
|---|---|---|---|---|
| `/api/settings` | GET | 需登录 | — | `{ok, settings, resume}` |
| `/api/settings` | PUT | 需登录 | 白名单键 | `{ok, settings}` |
| `/api/settings/password` | PUT | 需登录 | `{oldPassword, newPassword}` | `{ok}` |
| `/api/settings/resume` | PUT | 需登录 | `{resume}` | `{ok, resume}` |

**简历校验规则**（`/api/settings/resume`）：

- `aigc` 版：必填 `title` / `summary` / `workExperience` / `education` / `certs`，且 `works` | `abilities` 至少一组非空
- `dev` 版：必填 `title` / `summary`，且 `projects` | `techStack` 至少一组非空

### 作品集 `/api/projects`

| 路由 | 方法 | 鉴权 | 请求 | 成功响应 |
|---|---|---|---|---|
| `/api/projects` | GET | 公开 | — | `{ok, projects}`（featured 降序、id 降序） |
| `/api/projects` | POST | 需登录 | `{title, category: manga\|dev, ...}` | `{ok, project}`（slug 自动生成） |
| `/api/projects/[id]` | GET | 公开 | — | `{ok, project}` |
| `/api/projects/[id]` | PUT | 需登录 | 项目字段 | `{ok, project}` |
| `/api/projects/[id]` | DELETE | 需登录 | — | `{ok}` |

**id 语义**：创建时自增分配；`slugExists` 用于 slug 唯一性校验。

### 上传 `/api/upload`

| 路由 | 方法 | 鉴权 | 请求 | 成功响应 |
|---|---|---|---|---|
| `/api/upload` | POST | 需登录 | multipart 表单 | `{ok, url}` |

**限制与守卫**：

- 图片 ≤ 8MB，视频 ≤ 100MB
- 服务端未配置 `BLOB_READ_WRITE_TOKEN` 时返回明确的 500 错误
- Vercel Hobby 计划函数请求体上限约 4.5MB，大视频请先压缩或改用 Blob 客户端直传

## 变更记录

- 2026-08-15：从 `AGENTS.md` 迁出并独立成文（内容与 V0.02 冻结版一致）。
