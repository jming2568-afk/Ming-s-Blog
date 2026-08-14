// P5 AI/安全/管理端冒烟：node scripts/e2e-p5.mjs [baseURL]
const base = process.argv[2] ?? "http://localhost:3000";
const uname = `p5e2e${Date.now().toString(36)}`;
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
  return { status: res.status, body: await res.json().catch(() => ({})), setCookie: res.headers.get("set-cookie"), headers: res.headers };
}

// 1. 注册普通用户
const reg = await json("POST", "/api/auth/register", { username: uname, email: `${uname}@test.local`, password: "pass-12345678" });
check("注册 201", reg.status === 201, `→ ${reg.status}`);
const sid = reg.setCookie?.split(";")[0] ?? "";

// 2. 安全头
check("安全头 X-Content-Type-Options", reg.headers.get("x-content-type-options") === "nosniff", "");

// 3. AI 未配置 key → 503 明确提示
const polishNoKey = await json("POST", "/api/ai/polish", { kind: "summary", text: "开发" }, sid);
check("AI 无 key → 503 提示", polishNoKey.status === 503 && String(polishNoKey.body.error).includes("LLM 未配置"), `→ ${polishNoKey.status} ${JSON.stringify(polishNoKey.body)}`);

// 4. 匿名访问 AI → 401
const anonAi = await json("POST", "/api/ai/polish", { kind: "summary", text: "x" });
check("匿名 AI → 401", anonAi.status === 401, `→ ${anonAi.status}`);

// 5. 导入非法文件类型 → 400 明确提示
const form = new FormData();
form.append("file", new Blob(["hello"], { type: "text/plain" }), "a.txt");
const impRes = await fetch(`${base}/api/ai/import`, { method: "POST", headers: { cookie: sid }, body: form });
const impBody = await impRes.json().catch(() => ({}));
check("导入非法类型 → 400 提示", impRes.status === 400 && String(impBody.error).includes("仅支持"), `→ ${impRes.status} ${JSON.stringify(impBody)}`);

// 6. 普通用户访问 admin → 403
const adminForbidden = await json("GET", "/api/admin/users", undefined, sid);
check("普通用户 admin → 403", adminForbidden.status === 403, `→ ${adminForbidden.status}`);

// 7. ADMIN_USERNAMES 用户 → admin + 200（adminuser 由环境变量预置；已存在则登录）
async function adminSession() {
  const reg = await json("POST", "/api/auth/register", { username: "adminuser", email: "adminuser@test.local", password: "pass-12345678" });
  if (reg.status === 201) return { cookie: reg.setCookie?.split(";")[0] ?? "", user: reg.body.user };
  const login = await json("POST", "/api/auth/login", { username: "adminuser", password: "pass-12345678" });
  return { cookie: login.setCookie?.split(";")[0] ?? "", user: login.body.user };
}
const admin = await adminSession();
check("ADMIN_USERNAMES 提升为 admin", admin.user?.role === "admin", JSON.stringify(admin.user?.role));
const adminList = await json("GET", "/api/admin/users", undefined, admin.cookie);
check("admin 用户列表 200", adminList.status === 200 && Array.isArray(adminList.body.users), `→ ${adminList.status}`);

console.log(failed === 0 ? `\n全部通过` : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
