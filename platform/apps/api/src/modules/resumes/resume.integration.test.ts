// 简历 CRUD / 发布 / 公共接口集成测试：需真实 PostgreSQL（本地 compose 起 postgres 后运行；CI 无 DB 自动跳过）
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

const hasDb = Boolean(process.env.DATABASE_URL);
const base = Date.now().toString(36);

async function register(app: ReturnType<typeof createApp>, name: string) {
  const res = await app.request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: name, email: `${name}@test.local`, password: "pass-12345678" }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  return { cookie: setCookie.split(";")[0]!, user: (await res.json() as { user: { id: number } }).user };
}

async function req(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  cookie?: string,
  body?: unknown
) {
  return app.request(path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe.skipIf(!hasDb)("resumes API 集成", () => {
  const app = createApp();
  const userA = `ra_${base}`;
  const userB = `rb_${base}`;

  it("创建 → 更新 → 发布 → 公共页 → 下架 → 删除 全流程（含所有权）", async () => {
    const a = await register(app, userA);
    const b = await register(app, userB);

    // A 创建
    const created = await req(app, "POST", "/api/resumes", a.cookie, { title: "我的简历" });
    expect(created.status).toBe(201);
    const resume = (await created.json() as { resume: { id: number; slug: string; title: string } }).resume;
    expect(resume.slug).toBeTruthy();
    expect(resume.title).toBe("我的简历");

    // 数据不完整（刚创建为空）：发布被拒 400
    const badPublish = await req(app, "POST", `/api/resumes/${resume.id}/publish`, a.cookie, { isPublic: true });
    expect(badPublish.status).toBe(400);

    // A 更新数据（自动保存路径）
    const data = {
      basic: { name: "李佳铭", email: "a@test.local" },
      summary: "全栈开发",
      workExperience: [{ company: "某公司", role: "工程师", period: "2022-2024", description: ["做了啥"] }],
      skills: [{ name: "TypeScript", level: 4 }],
    };
    const updated = await req(app, "PUT", `/api/resumes/${resume.id}`, a.cookie, { data });
    expect(updated.status).toBe(200);
    expect((await updated.json() as { resume: { data: typeof data } }).resume.data.basic.name).toBe("李佳铭");

    // 未发布：公共页 404
    const pubBefore = await req(app, "GET", `/api/public/resumes/${resume.slug}`);
    expect(pubBefore.status).toBe(404);

    // 补齐姓名+邮箱后发布
    const published = await req(app, "POST", `/api/resumes/${resume.id}/publish`, a.cookie, { isPublic: true });
    expect(published.status).toBe(200);

    // 公共页 200 + 数据一致
    const pub = await req(app, "GET", `/api/public/resumes/${resume.slug}`);
    expect(pub.status).toBe(200);
    const pubBody = (await pub.json() as { resume: { data: { basic: { name: string } }; owner: { displayName: string } } }).resume;
    expect(pubBody.data.basic.name).toBe("李佳铭");
    expect(pubBody.owner.displayName).toBe(userA);

    // 所有权：B 不能读/改 A 的简历
    const bRead = await req(app, "GET", `/api/resumes/${resume.id}`, b.cookie);
    expect(bRead.status).toBe(404);
    const bWrite = await req(app, "PUT", `/api/resumes/${resume.id}`, b.cookie, { title: "hack" });
    expect(bWrite.status).toBe(404);

    // slug 冲突：另一个简历抢用 A 的 slug → 409
    const clash2 = await req(app, "POST", "/api/resumes", a.cookie, { title: resume.slug });
    const other = (await clash2.json() as { resume: { id: number; slug: string } }).resume;
    const dup = await req(app, "PUT", `/api/resumes/${other.id}`, a.cookie, { slug: resume.slug });
    expect(dup.status).toBe(409);

    // 下架 → 公共 404
    await req(app, "POST", `/api/resumes/${resume.id}/publish`, a.cookie, { isPublic: false });
    const pubAfter = await req(app, "GET", `/api/public/resumes/${resume.slug}`);
    expect(pubAfter.status).toBe(404);

    // 删除
    const del = await req(app, "DELETE", `/api/resumes/${resume.id}`, a.cookie);
    expect(del.status).toBe(200);
    await req(app, "DELETE", `/api/resumes/${other.id}`, a.cookie);
  });
});
