/** 极简 API 客户端（fetch 带 cookie，同源代理） */
export interface PublicUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  themeId: number | null;
  role: string;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `请求失败 (${res.status})`);
  }
  return body;
}

export function apiGet<T = unknown>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T = unknown>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: data !== undefined ? { "content-type": "application/json" } : undefined,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
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

// ---- auth ----
export interface AuthResponse {
  ok: boolean;
  user: PublicUser;
}

export function apiRegister(input: { username: string; email: string; password: string }) {
  return apiPost<AuthResponse>("/api/auth/register", input);
}

export function apiLogin(input: { username: string; password: string }) {
  return apiPost<AuthResponse>("/api/auth/login", input);
}

export function apiLogout() {
  return apiPost<{ ok: boolean }>("/api/auth/logout");
}

export async function apiMe(): Promise<PublicUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("获取会话失败");
  const body = (await res.json()) as { ok: boolean; user: PublicUser };
  return body.user;
}
