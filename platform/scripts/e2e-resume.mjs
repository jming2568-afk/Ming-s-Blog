// 简历链路冒烟测试（P3）：node scripts/e2e-resume.mjs [baseURL]
const base = process.argv[2] ?? "http://localhost:8080";
const uname = `p3e2e${Date.now().toString(36)}`;
let failed = 0;

function check(name, cond, detail = "") {
  if (cond) console.log(`✅ ${name}`);
  else {
    failed += 1;
    console.log(`❌ ${name} ${detail}`);
  }
}

async function req(method, path, body, cookie) {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, body: await res.json().catch(() => ({})), setCookie };
}

// 1. 注册
const reg = await req("POST", "/api/auth/register", { username: uname, email: `${uname}@test.local`, password: "pass-12345678" });
check("注册 201", reg.status === 201, `→ ${reg.status}`);
const sid = reg.setCookie?.split(";")[0] ?? "";

// 2. 主题列表（5 套系统主题已种子）
const themes = await req("GET", "/api/themes", undefined, sid);
check("主题列表 5 套", themes.status === 200 && themes.body.themes?.length === 5, `→ ${JSON.stringify(themes.body.themes?.length)}`);

// 3. 创建简历
const created = await req("POST", "/api/resumes", { title: "E2E 测试简历" }, sid);
check("创建简历 201", created.status === 201, `→ ${created.status}`);
const { id, slug } = created.body.resume;
check("slug 已生成", Boolean(slug), `slug=${slug}`);

// 4. 数据不完整 → 发布被拒 400
const badPub = await req("POST", `/api/resumes/${id}/publish`, { isPublic: true }, sid);
check("不完整发布被拒 400", badPub.status === 400, `→ ${badPub.status}`);

// 5. 填充数据（自动保存路径 PUT data）
const data = {
  basic: { name: "张三", title: "全栈开发工程师", email: "z@test.local", phone: "13800000000", location: "北京" },
  summary: "6 年前端与全栈开发经验，擅长 TypeScript / React / Node.js。",
  workExperience: [
    { company: "某科技公司", role: "高级工程师", period: "2022-2026", description: ["负责简历平台架构设计", "主导微服务迁移，性能提升 40%"] },
  ],
  projects: [{ name: "简历一站到底", role: "全栈", period: "2026", link: "", description: ["创建/展示/交付一体化"] }],
  education: [{ school: "某大学", degree: "本科", period: "2015-2019" }],
  skills: [{ name: "TypeScript", level: 5 }, { name: "React", level: 4 }],
  certs: [{ name: "CET-6", issuer: "教育部", date: "2017" }],
};
const saved = await req("PUT", `/api/resumes/${id}`, { data }, sid);
check("保存数据 200", saved.status === 200 && saved.body.resume.data.basic.name === "张三", `→ ${saved.status}`);

// 6. 未发布 → 公共页 404
const pubBefore = await req("GET", `/api/public/resumes/${slug}`);
check("未发布公共页 404", pubBefore.status === 404, `→ ${pubBefore.status}`);

// 7. 发布
const published = await req("POST", `/api/resumes/${id}/publish`, { isPublic: true }, sid);
check("发布 200", published.status === 200 && published.body.resume.isPublic === true, `→ ${published.status}`);

// 8. 公共页 200 且数据/主题一致
const pub = await req("GET", `/api/public/resumes/${slug}`);
check("公共页 200", pub.status === 200, `→ ${pub.status}`);
check(
  "公共数据一致",
  pub.body.resume.data.basic.name === "张三" && pub.body.resume.data.workExperience.length === 1,
  ""
);
check("主题令牌已附带", Boolean(pub.body.resume.owner.theme?.tokens), JSON.stringify(pub.body.resume.owner.theme?.name ?? "无"));
check("展示名一致", pub.body.resume.owner.displayName === uname, "");

// 9. 下架 → 404
await req("POST", `/api/resumes/${id}/publish`, { isPublic: false }, sid);
const pubAfter = await req("GET", `/api/public/resumes/${slug}`);
check("下架后公共页 404", pubAfter.status === 404, `→ ${pubAfter.status}`);

// 10. 所有权：匿名不能改
const anonPut = await req("PUT", `/api/resumes/${id}`, { title: "hack" });
check("匿名改简历被拒 401", anonPut.status === 401, `→ ${anonPut.status}`);

console.log(failed === 0 ? `\n全部通过（用户 ${uname}）` : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
