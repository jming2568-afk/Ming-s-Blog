import { Link, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-bold">
            简历一站到底
          </Link>
          <div className="flex gap-4 text-sm">
            <Link to="/app">工作台</Link>
            <Link to="/login">登录</Link>
            <Link to="/register">注册</Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
