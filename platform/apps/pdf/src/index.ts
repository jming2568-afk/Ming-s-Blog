import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { chromium, type Browser } from "playwright";

/**
 * PDF 渲染服务：用无头 Chromium 加载公共分享页 /r/:slug 并打印为 PDF。
 * 复用同一套页面与 @media print 样式 → 与线上展示、浏览器打印三端一致。
 */
const PORT = Number(process.env.PORT ?? 3210);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

const app = new Hono();

let browserPromise: Promise<Browser> | null = null;
function getBrowser(): Promise<Browser> {
  browserPromise ??= chromium.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  return browserPromise;
}

app.get("/health", (c) => c.json({ ok: true, service: "pdf" }));

app.get("/pdf/:slug", async (c) => {
  const slug = c.req.param("slug");
  const url = `${PUBLIC_BASE_URL}/r/${encodeURIComponent(slug)}`;
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector(".resume-view", { timeout: 15_000 });
    await page.waitForTimeout(400); // 等待 React 渲染稳定
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    const bytes = new Uint8Array(pdf.byteLength);
    bytes.set(pdf);
    c.header("content-type", "application/pdf");
    c.header("content-disposition", `attachment; filename="resume-${slug}.pdf"`);
    return c.body(bytes);
  } finally {
    await page.close().catch(() => undefined);
  }
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[pdf] listening on :${info.port} (base=${PUBLIC_BASE_URL})`);
});
