---
id: API-005
title: API 契约 — AI 能力（V0.03）
status: draft
created: 2026-08-15
updated: 2026-08-15
owner: ming
summary: /api/ai/polish 写作助手润色 + /api/ai/import 旧简历导入（OCR/PDF/docx → 结构化草稿）
---

# API 契约 — AI 能力（V0.03）

> 全局约定见 [API-001](API-001-契约总则.md)。本域属 P5（进行中），契约为 draft。
> 前置依赖：LLM 配置（`LLM_API_KEY` 或 `ARK_API_KEY`，支持配置中心在线配置）。未配置时两个接口均返回 `503` `LLM 未配置（LLM_API_KEY/ARK_API_KEY），AI 能力不可用`。
> 限流：**10 次/用户/分钟**（超限 429 `操作过于频繁，请稍后再试`）。

## POST `/api/ai/polish` — AI 写作助手（F-A5，需登录）

对简历片段做专业润色（STAR 法则、量化成果、可参考 JD 优化关键词）。

- 请求：

| 字段 | 类型 | 规则 |
|---|---|---|
| `kind` | `"summary" \| "experience" \| "project" \| "skill"` | 润色片段类型 |
| `text` | string | 1–4000 字符 |
| `jd` | string（可选） | 目标岗位 JD，≤4000 字符 |

- 成功：`200 { ok: true, polished: string }`（润色后文本）
- `400` 校验失败
- `502` `AI 润色失败，请稍后再试`（LLM 上游失败）

## POST `/api/ai/import` — 旧简历导入（F-A6，需登录，multipart/form-data）

上传旧简历文件，识别并转为结构化简历草稿（`ResumeData`）。

- 表单字段：`file`（必填）
- 限制：
  - 大小 ≤ **10MB**（超限 400 `文件过大（最大 10MB）`）
  - 类型：图片（`image/*`）、`application/pdf`、docx（MIME 或 `.docx` 后缀）；其他 400 `仅支持图片（jpg/png/webp）、PDF 或 Word（docx）`
- 成功：`200 { ok: true, data: ResumeData, source: "ocr" | "text" }`
  - `source: "ocr"`：图片多模态直读；`"text"`：PDF/docx 文本提取
  - 注意：扫描件 PDF 无可提取文本，提示转图片上传
- `400` 缺文件/超限/类型不符/导入内容无法解析（含具体原因）
- `503` LLM 未配置
