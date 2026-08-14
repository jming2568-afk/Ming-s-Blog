import { parseResumeData, type ResumeData } from "@platform/shared";
import { chat, extractJson, type LlmConfig } from "./llm.js";

export type PolishKind = "summary" | "experience" | "project" | "skill";

const KIND_LABEL: Record<PolishKind, string> = {
  summary: "个人简介",
  experience: "工作经历描述",
  project: "项目经历描述",
  skill: "技能",
};

/** AI 写作助手：STAR 润色 / 按 JD 优化（P5 F-A5） */
export async function polishResumeText(
  config: LlmConfig,
  input: { kind: PolishKind; text: string; jd?: string }
): Promise<{ polished: string }> {
  const system = [
    "你是一名资深简历顾问。请对用户提供的简历内容进行专业润色：",
    "- 遵循 STAR 法则（情境/任务/行动/结果），用行动动词开头",
    "- 量化成果（数字、百分比、规模），措辞简洁有力",
    "- 保留原文事实，不虚构内容；输出只给润色后的文本本身，不要解释",
    input.jd?.trim() ? `- 参考目标岗位 JD 优化关键词与匹配度：\n${input.jd.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await chat(config, [
    { role: "system", content: system },
    { role: "user", content: `【${KIND_LABEL[input.kind]}】\n${input.text}` },
  ], { temperature: 0.4 });

  return { polished: raw.trim() };
}

/** 旧简历导入：图片 OCR（多模态）/ PDF·docx 文本 → LLM 结构化 → 可编辑草稿（P5 F-A6） */
export async function importResume(
  config: LlmConfig,
  input: { mime: string; buffer: Buffer; fileName: string }
): Promise<{ data: ResumeData; source: "ocr" | "text" }> {
  let promptText = "";
  let content: ChatMessageContent = [];
  let source: "ocr" | "text" = "ocr";

  if (input.mime.startsWith("image/")) {
    // 多模态直读（一次 OCR + 结构化）
    const base64 = input.buffer.toString("base64");
    content = [
      { type: "text", text: "请识别这张简历图片的全部内容。" },
      { type: "image_url", image_url: { url: `data:${input.mime};base64,${base64}` } },
    ];
  } else if (input.mime === "application/pdf") {
    const text = await extractPdfText(input.buffer);
    if (!text.trim()) throw new Error("该 PDF 无可提取文本（可能是扫描件），请先转为图片后上传");
    promptText = text;
    source = "text";
  } else if (
    input.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    input.fileName.toLowerCase().endsWith(".docx")
  ) {
    const text = await extractDocxText(input.buffer);
    if (!text.trim()) throw new Error("无法从该 Word 文档提取文本");
    promptText = text;
    source = "text";
  } else {
    throw new Error("仅支持图片（jpg/png/webp）、PDF 或 Word（docx）");
  }

  const system =
    "你是简历信息抽取器。把用户提供的简历内容转成结构化 JSON，" +
    "严格符合如下 schema（键名一致，缺省用空值/空数组）：" +
    '{"basic":{"name":"","title":"","email":"","phone":"","location":"","avatarUrl":""},"summary":"","workExperience":[{"company":"","role":"","period":"","description":[""]}],"projects":[{"name":"","role":"","period":"","link":"","description":[""]}],"education":[{"school":"","degree":"","period":""}],"skills":[{"name":"","level":3}],"certs":[{"name":"","issuer":"","date":""}]}' +
    "。只输出 JSON，不要任何解释。";

  const raw = await chat(
    config,
    [
      { role: "system", content: system },
      { role: "user", content: content.length > 0 ? content : promptText },
    ],
    { model: source === "ocr" ? config.visionModel : config.textModel, temperature: 0.1, maxTokens: 4000 }
  );

  const parsed = extractJson<Record<string, unknown>>(raw);
  const data = parseResumeData(parsed);
  return { data, source };
}

// ---- 轻量文档文本提取 ----
async function extractPdfText(buffer: Buffer): Promise<string> {
  const { default: pdfParse } = await import("pdf-parse");
  const result = await pdfParse(buffer);
  return result.text ?? "";
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

type ChatMessageContent = Array<Record<string, unknown>>;
