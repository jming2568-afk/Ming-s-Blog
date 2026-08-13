// 所有 API 路由的 500 JSON 输出与 console.error 共用的错误规范化助手。
// 目标：
//   - 避免 "[db] 初始化失败：[db] 初始化失败：..." 这种反复套前缀。
//   - 生产环境不把堆栈暴露给前端，但服务器日志里仍能看到完整堆栈。
//   - 开发模式在 debug 字段里保留（去重后的）完整消息。

export function normalizeError(err) {
  const message = stripPrefixes(String(err?.message || err || "未知错误"));
  const stack = typeof err?.stack === "string" ? err.stack : null;
  return { message, stack };
}

function stripPrefixes(msg) {
  let out = String(msg || "");
  // 最多尝试 5 层去壳，防御递归套娃
  for (let i = 0; i < 5; i++) {
    const before = out;
    out = out
      .replace(/^\s*\[db\]\s*初始化失败：\s*/g, "")
      .replace(/^\s*\[db\]\s*/g, "")
      .replace(/^\s*服务初始化失败：\s*/g, "")
      .trim();
    if (out === before) break;
  }
  return out;
}

// 面向前端返回的 500 体：开发模式带 debug，生产只给 message
export function json500(err, { logger, routeName } = {}) {
  const { message, stack } = normalizeError(err);
  const isDev = process.env.NODE_ENV !== "production";
  const publicMsg = `服务初始化失败：${message}`;
  const debugPayload = isDev
    ? {
        debug: message,
        stack: stack ? stack.split("\n").slice(0, 8).join("\n") : undefined,
      }
    : undefined;
  if (logger && typeof logger === "function") {
    try {
      logger(routeName ? `[${routeName}] error: ` : "", err);
    } catch {}
  } else if (routeName) {
    // 默认打到 console.error，方便在 Vercel Function 日志里看
    console.error(`[${routeName}] error:`, err);
  }
  return Response.json
    ? Response.json(
        { error: publicMsg, ...debugPayload },
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
      )
    : new Response(JSON.stringify({ error: publicMsg, ...debugPayload }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
}
