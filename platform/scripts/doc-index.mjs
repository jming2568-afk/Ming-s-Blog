#!/usr/bin/env node
/**
 * 文档库索引生成与校验（零依赖 Node 脚本）
 *
 * 用法：
 *   node scripts/doc-index.mjs            # 校验 + 重新生成 docs/INDEX.md
 *   node scripts/doc-index.mjs --check    # 只校验，不写文件（CI 用，出错退出码 1）
 *
 * 规则：
 *   - 文档位于 docs/<NN-分类>/<文件名>.md（INDEX.md / TEMPLATE.md 除外）
 *   - 每篇文档顶部必须带 YAML frontmatter：
 *       id: XXX-000        # 唯一 id，如 PRD-001 / PLAN-001 / TECH-001
 *       title: 标题
 *       status: draft|review|active|superseded|archived
 *       created: YYYY-MM-DD
 *       updated: YYYY-MM-DD
 *       owner: 负责人
 *       summary: 一句话摘要（可选，缺省取正文第一个标题）
 *       supersedes: / superseded-by: （可选，指向其他文档 id）
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const INDEX_FILE = join(DOCS_ROOT, "INDEX.md");
const CATEGORY_RE = /^(\d{2})-([^/]+)$/;
const ID_RE = /^[A-Z][A-Z0-9]*-[0-9]{3}$/;
const STATUSES = ["draft", "review", "active", "superseded", "archived"];
const SKIP_FILES = new Set(["INDEX.md", "TEMPLATE.md"]);

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return { meta: null, rest: text };
  const end = text.indexOf("\n---", 4);
  if (end < 0) return { meta: null, rest: text };
  const fm = text.slice(4, end);
  const meta = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta, rest: text.slice(end + 4) };
}

function firstHeading(text) {
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.startsWith("#")) return t.replace(/^#+\s*/, "").trim();
    if (t.length > 0) return t.slice(0, 80);
  }
  return "";
}

async function collectDocs() {
  const docs = [];
  const errors = [];
  const seen = new Set();
  const entries = await readdir(DOCS_ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || !CATEGORY_RE.test(entry.name)) continue;
    const catMatch = entry.name.match(CATEGORY_RE);
    const category = catMatch[1];
    const categoryName = catMatch[2];
    const dirPath = join(DOCS_ROOT, entry.name);
    for (const file of (await readdir(dirPath)).sort()) {
      if (!file.endsWith(".md") || SKIP_FILES.has(file)) continue;
      const abs = join(dirPath, file);
      const raw = await readFile(abs, "utf8");
      const { meta, rest } = parseFrontmatter(raw);
      if (!meta) {
        errors.push(`${entry.name}/${file}: 缺少 YAML frontmatter`);
        continue;
      }
      if (!ID_RE.test(meta.id ?? "")) errors.push(`${entry.name}/${file}: id "${meta.id}" 格式应为 XXX-000`);
      if (seen.has(meta.id)) errors.push(`${entry.name}/${file}: id "${meta.id}" 重复`);
      seen.add(meta.id);
      if (!meta.title) errors.push(`${entry.name}/${file}: 缺少 title`);
      if (!STATUSES.includes(meta.status)) errors.push(`${entry.name}/${file}: status "${meta.status}" 非法（${STATUSES.join("/")}）`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.created ?? "")) errors.push(`${entry.name}/${file}: created 应为 YYYY-MM-DD`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.updated ?? "")) errors.push(`${entry.name}/${file}: updated 应为 YYYY-MM-DD`);
      if (!meta.owner) errors.push(`${entry.name}/${file}: 缺少 owner`);
      docs.push({
        id: meta.id ?? basename(file, ".md"),
        title: meta.title ?? basename(file, ".md"),
        status: meta.status ?? "draft",
        created: meta.created ?? "?",
        updated: meta.updated ?? "?",
        owner: meta.owner ?? "?",
        summary: meta.summary ?? firstHeading(rest),
        file: `${entry.name}/${file}`,
        category,
        categoryName,
      });
    }
  }
  return { docs, errors };
}

function renderIndex(docs) {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const d of docs) byStatus[d.status] += 1;
  const legend = [
    "- `draft` 草稿：想法/未定稿",
    "- `review` 评审中：待确认",
    "- `active` 生效：当前有效",
    "- `superseded` 被取代：有更新版本（见 superseded-by）",
    "- `archived` 归档：历史/过期",
  ].join("\n");
  const stats = [
    `- 文档总数：${docs.length}`,
    ...STATUSES.map((s) => `- ${s}：${byStatus[s]}`),
  ].join("\n");
  const lines = [
    "# 文档库索引（自动生成，勿手改）",
    "",
    "> 本文件由 `node scripts/doc-index.mjs` 自动生成。新增/修改文档后请运行 `pnpm docs:index` 重新生成。",
    "",
    "## 状态图例（渐进式生命周期）",
    "",
    legend,
    "",
    "## 统计",
    "",
    stats,
    "",
  ];
  const cats = [...new Set(docs.map((d) => d.category))].sort();
  for (const cat of cats) {
    const name = docs.find((d) => d.category === cat)?.categoryName ?? cat;
    lines.push(`## ${cat} ${name}`, "");
    lines.push("| ID | 状态 | 标题 | 更新 | 文件 |");
    lines.push("|---|---|---|---|---|");
    for (const d of docs.filter((x) => x.category === cat).sort((a, b) => a.id.localeCompare(b.id))) {
      const mark = d.status === "active" ? "✅" : d.status === "draft" ? "✏️" : d.status === "review" ? "🔍" : d.status === "superseded" ? "♻️" : "🗄️";
      lines.push(`| ${d.id} | ${mark} ${d.status} | ${d.title} | ${d.updated} | ${d.file} |`);
    }
    lines.push("");
  }
  lines.push("---", "", "*索引生成于脚本运行时刻；以每篇文档 frontmatter 为准。*", "");
  return lines.join("\n");
}

const { docs, errors } = await collectDocs();
for (const e of errors) console.error(`[docs:index] ${e}`);
if (errors.length > 0) {
  console.error(`[docs:index] 共 ${errors.length} 个问题`);
  process.exit(1);
}
const checkOnly = process.argv.includes("--check");
if (checkOnly) {
  console.log(`[docs:index] 校验通过：${docs.length} 篇文档`);
} else {
  await writeFile(INDEX_FILE, renderIndex(docs), "utf8");
  console.log(`[docs:index] 索引已生成：${docs.length} 篇文档 → ${INDEX_FILE}`);
}
