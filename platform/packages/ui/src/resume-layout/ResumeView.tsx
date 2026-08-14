import type { ResumeData } from "@platform/shared";

/**
 * 简历渲染组件（一致性内核的核心）：
 * 同一组件服务 编辑器预览 / 公共分享页 / 打印（@media print）。
 * 全部样式走 CSS 变量（--color-*），由外层注入主题令牌。
 */

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="resume-section" style={{ marginBottom: "18px" }}>
      <h3
        className="resume-section-title"
        style={{
          fontSize: "15px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: "var(--color-primary)",
          borderBottom: `2px solid var(--color-border)`,
          paddingBottom: "4px",
          marginBottom: "10px",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  const list = items.filter(Boolean);
  if (list.length === 0) return null;
  return (
    <ul style={{ margin: "4px 0 0", paddingLeft: "18px", color: "var(--color-text)" }}>
      {list.map((item, i) => (
        <li key={i} style={{ fontSize: "13px", lineHeight: 1.7, marginBottom: "2px" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ItemHead({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="resume-item-head" style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
      <span style={{ fontSize: "13.5px", fontWeight: 600 }}>{left}</span>
      {right ? <span style={{ fontSize: "12px", color: "var(--color-muted)", whiteSpace: "nowrap" }}>{right}</span> : null}
    </div>
  );
}

export function ResumeView({ data }: { data: ResumeData }) {
  const { basic, summary, workExperience, projects, education, skills, certs } = data;

  return (
    <article className="resume-view" style={{ color: "var(--color-text)", fontSize: "14px" }}>
      {/* 头部 */}
      <header className="resume-header" style={{ marginBottom: "20px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
        {basic.avatarUrl ? (
          <img
            src={basic.avatarUrl}
            alt="头像"
            className="resume-avatar"
            style={{ width: 72, height: 72, borderRadius: "var(--radius)", objectFit: "cover", border: `2px solid var(--color-border)` }}
          />
        ) : null}
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, letterSpacing: "0.02em" }}>
            {basic.name || "你的名字"}
          </h1>
          {basic.title ? (
            <p style={{ margin: "6px 0 0", fontSize: "15px", color: "var(--color-primary)", fontWeight: 600 }}>
              {basic.title}
            </p>
          ) : null}
          {(basic.email || basic.phone || basic.location) && (
            <p className="resume-contact" style={{ margin: "8px 0 0", fontSize: "12.5px", color: "var(--color-muted)" }}>
              {[basic.email, basic.phone, basic.location].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </header>

      {/* 简介 */}
      {summary ? (
        <Section title="个人简介">
          <p style={{ fontSize: "13px", lineHeight: 1.8, margin: 0 }}>{summary}</p>
        </Section>
      ) : null}

      {/* 工作经历 */}
      {workExperience.length > 0 ? (
        <Section title="工作经历">
          {workExperience.map((item, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <ItemHead
                left={`${item.company || "公司"}${item.role ? ` · ${item.role}` : ""}`}
                right={item.period || undefined}
              />
              <Bullets items={item.description} />
            </div>
          ))}
        </Section>
      ) : null}

      {/* 项目经历 */}
      {projects.length > 0 ? (
        <Section title="项目经历">
          {projects.map((item, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <ItemHead
                left={`${item.name || "项目"}${item.role ? ` · ${item.role}` : ""}`}
                right={item.period || undefined}
              />
              {item.link ? (
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-accent)" }}>{item.link}</p>
              ) : null}
              <Bullets items={item.description} />
            </div>
          ))}
        </Section>
      ) : null}

      {/* 教育经历 */}
      {education.length > 0 ? (
        <Section title="教育经历">
          {education.map((item, i) => (
            <ItemHead
              key={i}
              left={`${item.school || "学校"}${item.degree ? ` · ${item.degree}` : ""}`}
              right={item.period || undefined}
            />
          ))}
        </Section>
      ) : null}

      {/* 技能 */}
      {skills.length > 0 ? (
        <Section title="技能">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
            {skills.map((item, i) => (
              <span key={i} style={{ fontSize: "13px" }}>
                {item.name}
                <span style={{ color: "var(--color-primary)", marginLeft: "4px", letterSpacing: "1px" }}>
                  {"●".repeat(Math.max(0, Math.min(5, item.level ?? 0)))}
                  <span style={{ color: "var(--color-border)" }}>
                    {"○".repeat(Math.max(0, 5 - Math.min(5, item.level ?? 0)))}
                  </span>
                </span>
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {/* 证书 */}
      {certs.length > 0 ? (
        <Section title="证书">
          {certs.map((item, i) => (
            <ItemHead key={i} left={`${item.name || "证书"}`} right={item.date || undefined} />
          ))}
        </Section>
      ) : null}
    </article>
  );
}
