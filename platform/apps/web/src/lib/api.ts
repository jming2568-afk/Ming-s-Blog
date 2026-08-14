/** 极简 API 客户端（P2 起扩展认证与会话） */
export interface ApiResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `请求失败 (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  version: string;
  time: string;
  db: string;
}

export function fetchHealth() {
  return apiGet<HealthResponse>("/api/health");
}
