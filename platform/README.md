# platform/ — 简历一站到底（V0.03）

> 公开简历平台：用户注册 → 编辑/导入简历 → 专属链接展示 → 导出/打印（Word / PDF / 直接打印）。
> 开发分支：`v0.3` ｜ 技术栈：pnpm monorepo + Vite/React SPA + Hono + **SQLite**(Drizzle) + **原生部署（无 Docker，低内存 2C1G）** + **阿里云 OSS**（详见 `docs/03-tech/TECH-001.md`）

## 📚 文档库

**入口：`docs/INDEX.md`**（自动索引，含状态图例）

| 目录 | 内容 |
|---|---|
| `docs/01-product/` | 产品需求（PRD-001） |
| `docs/02-plans/` | 开发计划（PLAN-001：P1–P6 阶段规划） |
| `docs/03-tech/` | 技术方案（TECH-001 低内存原生部署架构） |
| `docs/04-ops/` | 部署运维（OPS-001 部署与更新手册） |
| `docs/05-decisions/` | 决策记录 ADR（待建） |

**文档管理规范**：每篇文档带 YAML frontmatter（id/status/created/updated/owner），生命周期 draft → review → active → superseded/archived（渐进式）。模板见 `docs/TEMPLATE.md`。改文档后运行：

```bash
pnpm docs:index   # 校验 + 重新生成 INDEX.md
pnpm docs:check   # 仅校验（CI 用）
```

## 🗂 目录结构

```
platform/
├── apps/
│   ├── web/          # Vite + React SPA（工作台 + 公共分享页）
│   └── api/          # Hono API 服务
├── packages/
│   ├── shared/       # 类型 / Drizzle schema / Zod / 工具
│   └── ui/           # 主题令牌（5 套）+ 组件库 + resume-layout
├── docs/             # 文档库（本文件索引）
├── scripts/          # 开发脚本（doc-index 等）
├── nginx/            # 旧容器时代静态托管配置（已弃用，见 deploy/）
└── deploy/           # 部署模板：deploy.sh / resume-api.service / nginx-resume.conf / backup.sh
```

## 🚧 状态

**P1–P3 已完成**（骨架/认证/简历核心）；当前 **P4 交付与媒体** 阶段。部署架构以 TECH-001 为准：**原生部署（无 Docker）**，更新流程见 OPS-001。进度见 `docs/02-plans/开发阶段规划.md`。
