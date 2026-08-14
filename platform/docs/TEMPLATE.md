# 文档模板（TEMPLATE.md）

> 新建文档时复制本模板。文件放对应分类目录：`docs/<NN-分类>/<文件名>.md`。
> 完成后运行 `pnpm docs:index` 重新生成索引。

## 使用说明

```markdown
---
id: XXX-000
title: 文档标题
status: draft
created: 2026-08-15
updated: 2026-08-15
owner: ming
summary: 一句话摘要（可选，缺省取正文第一个标题）
supersedes:
superseded-by:
---
# 文档标题

正文从这里开始……
```

## 字段说明

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✅ | 唯一编号，格式 `XX-000`（如 `PRD-001`、`PLAN-001`、`TECH-001`、`OPS-001`、`DEC-001`），全库唯一 |
| `title` | ✅ | 文档标题 |
| `status` | ✅ | 生命周期状态，见下表 |
| `created` | ✅ | 创建日期 `YYYY-MM-DD` |
| `updated` | ✅ | 最后更新日期 `YYYY-MM-DD`（每次改动同步更新） |
| `owner` | ✅ | 负责人（`ming`） |
| `summary` | ⭕ | 一句话摘要（索引展示用） |
| `supersedes` | ⭕ | 本文取代的旧文档 id |
| `superseded-by` | ⭕ | 取代本文的新文档 id（当状态为 superseded 时必填） |

## 生命周期（渐进式）

```
✏️ draft（草稿）──▶ 🔍 review（评审中）──▶ ✅ active（生效）
                                             │
                     ┌───────────────────────┤
                     ▼                       ▼
              ♻️ superseded（被取代）   🗄️ archived（归档）
```

- **新建**：想法/未定稿 → `draft`
- **评审确认**：方案被认可 → `review` → 定案 → `active`
- **被新版本替代**：旧文档改 `superseded` 并填 `superseded-by: 新id`；新文档填 `supersedes: 旧id`。**文件留在原位，不删除**（保留演进痕迹）
- **过期且无替代**：→ `archived`
- 每次状态变更后运行 `pnpm docs:index` 更新索引

## 分类目录

| 目录 | 用途 | id 前缀 |
|---|---|---|
| `docs/01-product/` | 产品需求、卖点、用户旅程 | `PRD-*` |
| `docs/02-plans/` | 开发计划、里程碑方案 | `PLAN-*` |
| `docs/03-tech/` | 技术方案、架构、选型 | `TECH-*` |
| `docs/04-ops/` | 部署、运维、备份手册 | `OPS-*` |
| `docs/05-decisions/` | 决策记录（ADR） | `DEC-*` |
