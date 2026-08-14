// P4 交付与媒体冒烟：node scripts/e2e-p4.mjs [baseURL]
const base = process.argv[2] ?? "http://localhost:8080";
const uname = `p4e2e${Date.now().toString(36)}`;
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

// 1. 注册
const reg = await json("POST", "/api/auth/register", { username: uname, email: `${uname}@test.local`, password: "pass-12345678" });
check("注册 201", reg.status === 201, `→ ${reg.status}`);
const sid = reg.setCookie?.split(";")[0] ?? "";

// 2. 建简历 + 填数据 + 发布
const created = await json("POST", "/api/resumes", { title: "P4 导出测试" }, sid);
const { id, slug } = created.body.resume;
const data = {
  basic: { name: "张三", title: "全栈工程师", email: "z@test.local", phone: "13800000000", location: "北京" },
  summary: "全栈开发工程师，擅长 TypeScript / React / Node.js。",
  workExperience: [{ company: "某公司", role: "工程师", period: "2022-2026", description: ["负责平台架构", "性能优化"] }],
  skills: [{ name: "TypeScript", level: 5 }],
};
await json("PUT", `/api/resumes/${id}`, { data }, sid);
const pub = await json("POST", `/api/resumes/${id}/publish`, { isPublic: true }, sid);
check("发布 200", pub.status === 200, `→ ${pub.status}`);

// 3. 上传头像（multipart → MinIO）
const form = new FormData();
form.append("file", new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], { type: "image/png" }), "avatar.png");
const upRes = await fetch(`${base}/api/media`, { method: "POST", headers: { cookie: sid }, body: form });
const upBody = await upRes.json().catch(() => ({}));
check("上传头像 201", upRes.status === 201, `→ ${upRes.status} ${JSON.stringify(upBody)}`);
const mediaUrl = upBody.media?.url;
check("返回公网 URL", typeof mediaUrl === "string" && mediaUrl.startsWith("http"), mediaUrl ?? "");

// 4. Word 导出
const wordRes = await fetch(`${base}/api/export/word/${slug}`, { headers: { cookie: sid } });
const wordBuf = await wordRes.arrayBuffer();
check(
  "Word 导出 200 + docx",
  wordRes.status === 200 && (wordRes.headers.get("content-type") ?? "").includes("wordprocessingml") && wordBuf.byteLength > 1000,
  `→ ${wordRes.status} ${wordBuf.byteLength}B`
);

// 5. PDF 导出（首次渲染较慢，Chromium 启动 + 页面加载）
console.log("⏳ PDF 渲染中（首次约 10-30s）…");
const pdfRes = await fetch(`${base}/api/export/pdf/${slug}`, { headers: { cookie: sid } });
const pdfBuf = await pdfRes.arrayBuffer();
check(
  "PDF 导出 200 + application/pdf",
  pdfRes.status === 200 && (pdfRes.headers.get("content-type") ?? "").includes("application/pdf") && pdfBuf.byteLength > 1000,
  `→ ${pdfRes.status} ${pdfBuf.byteLength}B`
);

// 6. 匿名导出被拒
const anonWord = await fetch(`${base}/api/export/word/${slug}`);
check("匿名导出被拒 401", anonWord.status === 401, `→ ${anonWord.status}`);

// 7. 头像 URL 可匿名读取（MinIO 公开读策略）
if (mediaUrl) {
  const head = await fetch(mediaUrl, { method: "HEAD" });
  check("头像公网可读", head.ok, `→ ${head.status}`);
}

console.log(failed === 0 ? `\n全部通过（用户 ${uname}）` : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
