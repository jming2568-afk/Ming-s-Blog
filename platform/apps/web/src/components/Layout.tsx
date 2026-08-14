import { Link, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.js";

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-bold">
            简历一站到底
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/app">工作台</Link>
            {user ? (
              <>
                <Link to="/app/settings">设置</Link>
                <span style={{ color: "var(--color-muted)" }}>{user.displayName ?? user.username}</span>
                <button onClick={() => void logout()} style={{ color: "var(--color-primary)" }}>
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login">登录</Link>
                <Link to="/register">注册</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
