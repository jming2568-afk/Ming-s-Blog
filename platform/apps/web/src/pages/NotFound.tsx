import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl font-black">404</h1>
      <p className="mt-2" style={{ color: "var(--color-muted)" }}>
        页面不存在
      </p>
      <Link to="/" className="mt-6 inline-block font-bold" style={{ color: "var(--color-primary)" }}>
        返回首页
      </Link>
    </div>
  );
}
