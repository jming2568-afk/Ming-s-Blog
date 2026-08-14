import { z } from "zod";

/** 简历结构化数据 schema（编辑/校验/展示共用的唯一事实源） */

export const basicSectionSchema = z.object({
  name: z.string().max(50).optional().default(""),
  title: z.string().max(80).optional().default(""),
  email: z.string().max(120).optional().default(""),
  phone: z.string().max(30).optional().default(""),
  location: z.string().max(80).optional().default(""),
  avatarUrl: z.string().max(500).optional().default(""),
});

export const experienceItemSchema = z.object({
  company: z.string().max(100).default(""),
  role: z.string().max(100).default(""),
  period: z.string().max(50).default(""),
  description: z.array(z.string().max(500)).default([]),
});

export const projectItemSchema = z.object({
  name: z.string().max(100).default(""),
  role: z.string().max(100).default(""),
  period: z.string().max(50).default(""),
  link: z.string().max(300).default(""),
  description: z.array(z.string().max(500)).default([]),
});

export const educationItemSchema = z.object({
  school: z.string().max(100).default(""),
  degree: z.string().max(100).default(""),
  period: z.string().max(50).default(""),
});

export const skillItemSchema = z.object({
  name: z.string().max(50).default(""),
  level: z.number().min(0).max(5).default(3),
});

export const certItemSchema = z.object({
  name: z.string().max(100).default(""),
  issuer: z.string().max(100).default(""),
  date: z.string().max(50).default(""),
});

export const resumeDataSchema = z.object({
  basic: basicSectionSchema.default({}),
  summary: z.string().max(2000).default(""),
  workExperience: z.array(experienceItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  skills: z.array(skillItemSchema).default([]),
  certs: z.array(certItemSchema).default([]),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;
export type BasicSection = z.infer<typeof basicSectionSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type SkillItem = z.infer<typeof skillItemSchema>;
export type CertItem = z.infer<typeof certItemSchema>;

export const emptyResumeData: ResumeData = {
  basic: { name: "", title: "", email: "", phone: "", location: "", avatarUrl: "" },
  summary: "",
  workExperience: [],
  projects: [],
  education: [],
  skills: [],
  certs: [],
};

/** 解析并归一化（自动补默认值）；非法结构抛 ZodError */
export function parseResumeData(data: unknown): ResumeData {
  return resumeDataSchema.parse(data);
}

/** 发布前最小校验：姓名 + 联系方式（邮箱或电话） */
export function isPublishable(data: ResumeData): { ok: boolean; reason?: string } {
  if (!data.basic.name?.trim()) return { ok: false, reason: "请填写姓名" };
  if (!data.basic.email?.trim() && !data.basic.phone?.trim()) {
    return { ok: false, reason: "请至少填写邮箱或电话" };
  }
  return { ok: true };
}
