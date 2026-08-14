/**
 * LLM 客户端（服务端代理，密钥不出服务器）。
 * 兼容两套协议（用户要求）：
 *   1. OpenAI chat/completions：POST {base}/chat/completions，{messages}
 *   2. OpenAI Responses：POST {base}/responses，{input}（火山方舟部分模型走此协议）
 * LLM_PROTOCOL=chat | responses | auto（默认 auto：先试 responses，协议不符自动回退 chat）
 */

export type LlmProtocol = "chat" | "responses";

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  textModel: string;
  visionModel: string;
  protocol: LlmProtocol | "auto";
}

export function loadLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig | null {
  const apiKey = env.LLM_API_KEY ?? env.ARK_API_KEY;
  if (!apiKey) return null;
  const protocol = (env.LLM_PROTOCOL ?? "auto") as LlmConfig["protocol"];
  if (protocol !== "chat" && protocol !== "responses" && protocol !== "auto") {
    throw new Error(`LLM_PROTOCOL 非法: ${protocol}（chat | responses | auto）`);
  }
  return {
    baseUrl: (env.LLM_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, ""),
    apiKey,
    textModel: env.LLM_TEXT_MODEL ?? "deepseek-v4-flash-ga-260731",
    visionModel: env.LLM_VISION_MODEL ?? "doubao-seed-2-0-lite-260428",
    protocol,
  };
}

export interface ChatMessage {
  role: "system" | "user";
  /** 纯文本，或内容片段数组（text / image_url），见 ai.service 的视觉消息 */
  content: string | Array<Record<string, unknown>>;
}

export class LlmError extends Error {
  readonly status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

// ---- 协议适配 ----

function toTextContent(content: string | Array<Record<string, unknown>>): string {
  return typeof content === "string" ? content : content.map((p) => (p as { text?: string }).text ?? "").join("\n");
}

/** chat/completions 载荷 */
function chatPayload(config: LlmConfig, messages: ChatMessage[], model: string, temperature: number, maxTokens?: number) {
  return {
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
    stream: false,
  };
}

/** Responses 协议载荷：input 条目；视觉转 input_image */
function responsesPayload(config: LlmConfig, messages: ChatMessage[], model: string, temperature: number, maxTokens?: number) {
  return {
    model,
    input: messages.map((m) => {
      const parts: Record<string, unknown>[] =
        typeof m.content === "string"
          ? [{ type: "input_text", text: m.content }]
          : m.content.map((p) => {
              if ("image_url" in p) {
                const url = (p as { image_url: { url: string } }).image_url.url;
                return { type: "input_image", image_url: url };
              }
              return { type: "input_text", text: (p as { text?: string }).text ?? "" };
            });
      return { role: m.role, content: parts };
    }),
    temperature,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
    stream: false,
  };
}

/** 解析 Responses 协议响应文本 */
function parseResponsesOutput(data: {
  output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
}): string | null {
  const message = data.output?.find((o) => o.type === "message");
  const text = message?.content?.filter((c) => c.type === "output_text").map((c) => c.text ?? "").join("");
  return text || null;
}

// ---- 调用 ----

interface CallResult {
  text: string;
  protocol: LlmProtocol;
}

async function callOnce(
  config: LlmConfig,
  protocol: LlmProtocol,
  messages: ChatMessage[],
  opts: { model: string; temperature: number; maxTokens?: number }
): Promise<CallResult> {
  const isChat = protocol === "chat";
  const path = isChat ? "/chat/completions" : "/responses";
  const body = isChat
    ? chatPayload(config, messages, opts.model, opts.temperature, opts.maxTokens)
    : responsesPayload(config, messages, opts.model, opts.temperature, opts.maxTokens);

  const res = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    // 404/405 = 协议路由不存在；400 且提及 messages/input = 协议字段不符 → 可回退
    throw new LlmError(`LLM 调用失败 (${res.status}): ${bodyText.slice(0, 200)}`, res.status);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
  };
  const text = isChat
    ? data.choices?.[0]?.message?.content
    : parseResponsesOutput(data);
  if (!text) throw new LlmError("LLM 返回为空");
  return { text, protocol };
}

function isProtocolMismatch(err: unknown): boolean {
  if (!(err instanceof LlmError)) return false;
  // 404/405：路由不存在（另一套协议才存在）；400：字段不被接受
  return err.status === 404 || err.status === 405 || err.status === 400;
}

// 协议记忆缓存（key = baseUrl+model），避免每次失败重试
const protocolCache = new Map<string, LlmProtocol>();

// 最近一次成功解析的协议（管理面板展示用）
let lastResolvedProtocol: LlmProtocol | null = null;
export function lastProtocol(): LlmProtocol | null {
  return lastResolvedProtocol;
}

function cacheKey(config: LlmConfig, model: string): string {
  return `${config.baseUrl}|${model}`;
}

/** 主入口：按配置/缓存解析协议，必要时回退另一套 */
export async function chat(
  config: LlmConfig,
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const model = opts.model ?? config.textModel;
  const temperature = opts.temperature ?? 0.7;
  const key = cacheKey(config, model);

  let primary: LlmProtocol;
  if (config.protocol !== "auto") {
    primary = config.protocol;
  } else {
    primary = protocolCache.get(key) ?? "responses"; // 默认 responses（火山方舟）
  }

  try {
    const result = await callOnce(config, primary, messages, { model, temperature, maxTokens: opts.maxTokens });
    protocolCache.set(key, result.protocol);
    lastResolvedProtocol = result.protocol;
    return result.text;
  } catch (err) {
    if (config.protocol === "auto" && isProtocolMismatch(err)) {
      const fallback: LlmProtocol = primary === "responses" ? "chat" : "responses";
      const result = await callOnce(config, fallback, messages, { model, temperature, maxTokens: opts.maxTokens });
      protocolCache.set(key, result.protocol);
      lastResolvedProtocol = result.protocol;
      return result.text;
    }
    throw err;
  }
}

/** 从 LLM 输出中尽力提取 JSON 对象（处理 ```json 包裹等情况） */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1]! : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("LLM 输出中未找到 JSON");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
