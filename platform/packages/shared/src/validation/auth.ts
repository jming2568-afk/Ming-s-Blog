import { z } from "zod";

/** 认证相关校验 schema（前后端唯一事实源） */

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "用户名至少 3 个字符")
  .max(20, "用户名最多 20 个字符")
  .regex(/^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/, "用户名只能包含字母、数字、下划线、连字符或中文");

export const emailSchema = z.string().trim().email("邮箱格式不正确").max(120);

export const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .max(72, "密码最多 72 位");

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "请输入密码"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
