import { afterEach, describe, expect, it, vi } from "vitest";
import { chat, extractJson, loadLlmConfig, type LlmConfig } from "./llm.js";

const config: LlmConfig = {
  baseUrl: "https://llm.test/v3",
  apiKey: "test-key",
  textModel: "text-model",
  visionModel: "vision-model",
  protocol: "auto",
};

function mockFetchOnce(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })
  );
}

afterEach(() => vi.restoreAllMocks());

describe("chat 双协议", () => {
  it("chat/completions 协议解析", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(200, { choices: [{ message: { content: "润色结果" } }] }));
    const text = await chat({ ...config, protocol: "chat" }, [{ role: "user", content: "原文" }], { model: "m-chat" });
    expect(text).toBe("润色结果");
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]! as [string, { body: string }];
    expect(url).toContain("/chat/completions");
    expect(JSON.parse(init.body).messages[0]).toMatchObject({ role: "user", content: "原文" });
  });

  it("responses 协议解析 output_text", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOnce(200, {
        output: [{ type: "message", content: [{ type: "output_text", text: "响应结果" }] }],
      })
    );
    const text = await chat({ ...config, protocol: "responses" }, [{ role: "user", content: "hi" }], { model: "m-resp" });
    expect(text).toBe("响应结果");
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]! as [string, { body: string }];
    expect(url).toContain("/responses");
    expect(JSON.parse(init.body).input[0]).toMatchObject({ role: "user", content: [{ type: "input_text", text: "hi" }] });
  });

  it("auto：responses 404 自动回退 chat", async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "回退成功" } }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", mock);
    const text = await chat(config, [{ role: "user", content: "x" }], { model: "m-fallback" });
    expect(text).toBe("回退成功");
    expect(mock.mock.calls[0]![0]).toContain("/responses");
    expect(mock.mock.calls[1]![0]).toContain("/chat/completions");
  });

  it("vision 消息在 responses 协议转 input_image", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(200, { output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] }));
    await chat(
      { ...config, protocol: "responses" },
      [
        {
          role: "user",
          content: [
            { type: "text", text: "识别" },
            { type: "image_url", image_url: { url: "data:image/png;base64,AAA" } },
          ],
        },
      ],
      { model: "m-vision" }
    );
    const [_, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]! as [string, { body: string }];
    const parts = JSON.parse(init.body).input[0].content;
    expect(parts).toEqual([
      { type: "input_text", text: "识别" },
      { type: "input_image", image_url: "data:image/png;base64,AAA" },
    ]);
  });
});

describe("extractJson", () => {
  it("解析 fenced JSON", () => {
    expect(extractJson<{ a: number }>("```json\n{\"a\":1}\n```").a).toBe(1);
  });
  it("解析裸 JSON", () => {
    expect(extractJson<{ b: string }>("前缀 {\"b\":\"x\"} 后缀").b).toBe("x");
  });
});

describe("loadLlmConfig", () => {
  it("ARK_API_KEY 生效 + 默认协议 auto", () => {
    const cfg = loadLlmConfig({ ARK_API_KEY: "k" });
    expect(cfg?.apiKey).toBe("k");
    expect(cfg?.protocol).toBe("auto");
  });
  it("LLM_PROTOCOL 显式指定", () => {
    const cfg = loadLlmConfig({ ARK_API_KEY: "k", LLM_PROTOCOL: "chat" });
    expect(cfg?.protocol).toBe("chat");
  });
  it("无 key 返回 null", () => {
    expect(loadLlmConfig({})).toBeNull();
  });
});
