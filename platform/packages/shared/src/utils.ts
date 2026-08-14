/** 生成 URL 安全的 kebab-slug：保留中文/字母/数字，其余转 `-`，去重连字符 */
export function slugify(input: string): string {
  const cleaned = input
    .normalize("NFKC")
    .trim()
    .replace(/[\p{L}\p{N}]+/gu, (m) => m.toLowerCase())
    .replace(/\s+/g, "-");
  return cleaned || "";
}

/** slug 合法性：1-64 位，字母/数字/中文字符 + 连字符 */
export function isValidSlug(slug: string): boolean {
  return /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,62}[\p{L}\p{N}])?$/u.test(slug);
}

/** 截断字符串（按字符数，不切断代理对） */
export function truncate(text: string, max: number): string {
  return Array.from(text).length <= max ? text : `${Array.from(text).slice(0, max).join("")}…`;
}
