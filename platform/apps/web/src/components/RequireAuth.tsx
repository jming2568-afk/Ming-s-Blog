import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.js";
import type { ReactNode } from "react";

/** 路由守卫：未登录重定向 /login（带回跳地址） */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: "var(--color-muted)" }}>
        会话加载中…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
