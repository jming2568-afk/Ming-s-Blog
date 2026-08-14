import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { ResumeData } from "@platform/shared";

/** 简历数据 → docx（可编辑，投递用；结构一致，不追求像素级一致） */
export async function resumeToDocx(data: ResumeData): Promise<Buffer> {
  const children: Paragraph[] = [];
  const { basic, summary, workExperience, projects, education, skills, certs } = data;

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: basic.name || "简历", bold: true, size: 44 })],
    })
  );
  if (basic.title) {
    children.push(new Paragraph({ children: [new TextRun({ text: basic.title, size: 26, color: "444444" })] }));
  }
  const contact = [basic.email, basic.phone, basic.location].filter(Boolean).join("  |  ");
  if (contact) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: contact, size: 22, color: "666666" })] })
    );
  }

  const section = (title: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: title, bold: true, size: 28 })],
    });

  if (summary) {
    children.push(
      section("个人简介"),
      new Paragraph({ children: [new TextRun({ text: summary, size: 24 })] })
    );
  }

  if (workExperience.length > 0) {
    children.push(section("工作经历"));
    for (const item of workExperience) {
      const head = [item.company, item.role].filter(Boolean).join(" · ");
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: head, bold: true, size: 24 }),
            ...(item.period ? [new TextRun({ text: `    ${item.period}`, size: 22, color: "666666" })] : []),
          ],
        })
      );
      for (const line of item.description.filter(Boolean)) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: `• ${line}`, size: 24 })],
          })
        );
      }
    }
  }

  if (projects.length > 0) {
    children.push(section("项目经历"));
    for (const item of projects) {
      const head = [item.name, item.role].filter(Boolean).join(" · ");
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: head, bold: true, size: 24 }),
            ...(item.period ? [new TextRun({ text: `    ${item.period}`, size: 22, color: "666666" })] : []),
          ],
        })
      );
      for (const line of item.description.filter(Boolean)) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: `• ${line}`, size: 24 })],
          })
        );
      }
    }
  }

  if (education.length > 0) {
    children.push(section("教育经历"));
    for (const item of education) {
      const head = [item.school, item.degree].filter(Boolean).join(" · ");
      children.push(
        new Paragraph({
          spacing: { before: 80 },
          children: [
            new TextRun({ text: head, size: 24 }),
            ...(item.period ? [new TextRun({ text: `    ${item.period}`, size: 22, color: "666666" })] : []),
          ],
        })
      );
    }
  }

  if (skills.length > 0) {
    children.push(section("技能"));
    children.push(
      new Paragraph({
        children: skills
          .filter((s) => s.name)
          .map((s, i) => new TextRun({ text: `${i > 0 ? "  /  " : ""}${s.name}`, size: 24 })),
      })
    );
  }

  if (certs.length > 0) {
    children.push(section("证书"));
    for (const item of certs) {
      const head = [item.name, item.issuer].filter(Boolean).join(" · ");
      children.push(
        new Paragraph({
          spacing: { before: 80 },
          children: [
            new TextRun({ text: head, size: 24 }),
            ...(item.date ? [new TextRun({ text: `    ${item.date}`, size: 22, color: "666666" })] : []),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  return Packer.toBuffer(doc);
}
