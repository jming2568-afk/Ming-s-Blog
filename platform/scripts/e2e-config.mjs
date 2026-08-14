// 配置中心冒烟（P5.5）：node scripts/e2e-config.mjs [baseURL]
// 需要 ADMIN_USERNAMES=cfgadmin（环境变量）预置管理员
const base = process.argv[2] ?? "http://localhost:3000";
let failed = 0;

function check(name, cond, detail = "") {
  if (cond) console.log(`✅ ${name}`);
  else {
    failed += 1;
    console.log(`❌ ${name} ${detail}`);
  }
}

async function json(method, path, body, cookie) {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})), setCookie: res.headers.get("set-cookie") };
}

// 1. admin 会话（固定名 cfgadmin：注册失败则登录）
async function adminSession() {
  const reg = await json("POST", "/api/auth/register", { username: "cfgadmin", email: "cfgadmin@test.local", password: "pass-12345678" });
  if (reg.status === 201) return { cookie: reg.setCookie?.split(";")[0] ?? "", role: reg.body.user?.role };
  const login = await json("POST", "/api/auth/login", { username: "cfgadmin", password: "pass-12345678" });
  return { cookie: login.setCookie?.split(";")[0] ?? "", role: login.body.user?.role };
}
const admin = await adminSession();
const sid = admin.cookie;
check("admin 会话", admin.role === "admin", JSON.stringify(admin.role));

// 2. GET：密钥打码 + masterKeyOk
const get1 = await json("GET", "/api/admin/config", undefined, sid);
check("GET 200", get1.status === 200, `→ ${get1.status}`);
check("masterKeyOk=true", get1.body.masterKeyOk === true, JSON.stringify(get1.body.masterKeyOk));
const llmKey = get1.body.config?.find((c) => c.key === "LLM_API_KEY");
check(
  "密钥打码不回显",
  llmKey?.sensitive === true && (llmKey?.value === "••••••••" || llmKey?.value === ""),
  JSON.stringify(llmKey)
);

// 3. PUT 保存模型/协议 → GET 验证
const put = await json("PUT", "/api/admin/config", {
  config: [
    { key: "LLM_TEXT_MODEL", value: "panel-model-x" },
    { key: "LLM_PROTOCOL", value: "chat" },
  ],
}, sid);
check("PUT 200", put.status === 200, `→ ${put.status}`);
const get2 = await json("GET", "/api/admin/config", undefined, sid);
const model = get2.body.config?.find((c) => c.key === "LLM_TEXT_MODEL");
check("模型已入库且来源=面板", model?.value === "panel-model-x" && model?.source === "db", JSON.stringify(model));

// 4. 清空 → 回退默认
const clear = await json("PUT", "/api/admin/config", { config: [{ key: "LLM_TEXT_MODEL", value: "" }] }, sid);
check("清空 200", clear.status === 200, `→ ${clear.status}`);
const get3 = await json("GET", "/api/admin/config", undefined, sid);
check("清空后非 db 来源", get3.body.config?.find((c) => c.key === "LLM_TEXT_MODEL")?.source !== "db", "");

// 5. 普通用户 403
const normName = `cfgn${Date.now().toString(36)}`;
const norm = await json("POST", "/api/auth/register", { username: normName, email: `${normName}@test.local`, password: "pass-12345678" });
const normSid = norm.setCookie?.split(";")[0] ?? "";
const forbidden = await json("GET", "/api/admin/config", undefined, normSid);
check("普通用户 403", forbidden.status === 403, `→ ${forbidden.status}`);

console.log(failed === 0 ? `\n全部通过` : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
