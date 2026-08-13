"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

// 安全解析 JSON：若响应不是 JSON，返回带可读上下文的 Error，避免出现 `Unexpected token '<', "<!DOCTYPE "...`
async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return res.json();
  }
  let text = "";
  try {
    text = await res.text();
  } catch {
    text = "";
  }
  const snippet = text.replace(/\s+/g, " ").slice(0, 200);
  const hint = snippet
    ? `响应片段：${snippet}`
    : "响应体为空";
  throw new Error(`服务器返回非 JSON（status=${res.status}）。${hint}`);
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    isLoading: true,
    isLoggedIn: false,
    user: null,
  });

  const refreshSession = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await safeJson(res);
      setState({
        isLoading: false,
        isLoggedIn: !!data?.isLoggedIn,
        user: data?.user || null,
      });
    } catch (err) {
      setState({ isLoading: false, isLoggedIn: false, user: null });
      // 只在开发模式下 log，避免污染生产控制台
      if (process.env.NODE_ENV !== "production") {
        console.warn("[AuthContext] refreshSession failed:", err?.message || err);
      }
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async ({ username, password }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await safeJson(res);
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "登录失败");
    }
    await refreshSession();
    return data;
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      // 登出即使返回非 JSON，也尽量同步刷新本地状态
      if ((res.headers.get("content-type") || "").includes("application/json")) {
        await res.json();
      }
    } catch {
      // ignore
    }
    await refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
