// 认证链路冒烟测试（P2）：node scripts/e2e-auth.mjs [baseURL]
// 默认 baseURL http://localhost:8080（compose nginx 入口）
const base = process.argv[2] ?? "http://localhost:8080";
const uname = `e2e${Date.now().toString(36)}`;
let failed = 0;

function check(name, cond, detail = "") {
  if (cond) console.log(`✅ ${name}`);
  else {
    failed += 1;
    console.log(`❌ ${name} ${detail}`);
  }
}

async function post(path, body, cookie) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, body: await res.json().catch(() => ({})), setCookie };
}

async function get(path, cookie) {
  const res = await fetch(base + path, { headers: cookie ? { cookie } : {} });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// 1. 注册
const reg = await post("/api/auth/register", { username: uname, email: `${uname}@test.local`, password: "pass-12345678" });
check("注册 201", reg.status === 201, `→ ${reg.status} ${JSON.stringify(reg.body)}`);
const sid = reg.setCookie?.split(";")[0] ?? "";

// 2. me（带 cookie）
const me = await get("/api/auth/me", sid);
check("me 200 且用户一致", me.status === 200 && me.body.user?.username === uname, `→ ${me.status}`);

// 3. 错误密码
const bad = await post("/api/auth/login", { username: uname, password: "wrong-pass" });
check("错误密码 401", bad.status === 401, `→ ${bad.status}`);

// 4. 重复注册
const dup = await post("/api/auth/register", { username: uname, email: `${uname}@test.local`, password: "pass-12345678" });
check("重复注册 409", dup.status === 409, `→ ${dup.status}`);

// 5. 格式非法
const invalid = await post("/api/auth/register", { username: "x", email: "bad", password: "short" });
check("格式非法 400", invalid.status === 400, `→ ${invalid.status}`);

// 6. 登出 → me 401
await post("/api/auth/logout", undefined, sid);
const meAfter = await get("/api/auth/me", sid);
check("登出后 me 401", meAfter.status === 401, `→ ${meAfter.status}`);

// 7. 未登录 me 401
const anon = await get("/api/auth/me");
check("未登录 me 401", anon.status === 401, `→ ${anon.status}`);

console.log(failed === 0 ? `\n全部通过（用户 ${uname}）` : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
