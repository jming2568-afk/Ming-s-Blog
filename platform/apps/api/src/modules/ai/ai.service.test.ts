import { beforeEach, describe, expect, it, vi } from "vitest";
import { importResume, polishResumeText } from "./ai.service.js";
import type { LlmConfig } from "./llm.js";

vi.mock("./llm.js", () => ({
  chat: vi.fn(),
  extractJson: (t: string) => JSON.parse(t.replace(/```(?:json)?\n?/g, "").replace(/\n?```/g, "")),
}));

import { chat } from "./llm.js";

const config: LlmConfig = {
  baseUrl: "https://llm.test/v3",
  apiKey: "k",
  textModel: "text-model",
  visionModel: "vision-model",
  protocol: "auto",
};

// 每个用例独立记录（清空调用记录，避免跨用例污染断言）
beforeEach(() => {
  vi.clearAllMocks();
});

describe("polishResumeText", () => {
  it("按 kind 构造提示并返回润色文本", async () => {
    vi.mocked(chat).mockResolvedValue("润色后的内容");
    const result = await polishResumeText(config, { kind: "experience", text: "负责开发" });
    expect(result.polished).toBe("润色后的内容");
    const messages = vi.mocked(chat).mock.calls[0]?.[1];
    const userContent = messages?.[1]?.content;
    expect(String(userContent)).toContain("工作经历描述");
  });
});

describe("importResume", () => {
  it("图片 → 视觉模型多模态直读（source=ocr）", async () => {
    vi.mocked(chat).mockResolvedValue(
      JSON.stringify({ basic: { name: "张三", email: "z@x.com" }, summary: "简介", workExperience: [], projects: [], education: [], skills: [], certs: [] })
    );
    const result = await importResume(config, {
      mime: "image/png",
      fileName: "a.png",
      buffer: Buffer.from([0x89, 0x50]),
    });
    expect(result.source).toBe("ocr");
    expect(result.data.basic.name).toBe("张三");
    const opts = vi.mocked(chat).mock.calls[0]?.[2];
    expect(opts?.model).toBe(config.visionModel);
    const content = vi.mocked(chat).mock.calls[0]?.[1]?.[1]?.content;
    expect(Array.isArray(content) && content.some((p) => "image_url" in p)).toBe(true);
  });

  it("不支持的类型 → 明确报错", async () => {
    await expect(
      importResume(config, { mime: "text/plain", fileName: "a.txt", buffer: Buffer.from("x") })
    ).rejects.toThrow("仅支持图片");
  });
});
