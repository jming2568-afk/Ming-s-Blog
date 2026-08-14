import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext.js";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username, password);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <h1 className="text-xl font-bold">登录</h1>
      {error && (
        <p className="mt-3 rounded px-3 py-2 text-sm" style={{ background: "var(--color-primary)", color: "#fff" }}>
          {error}
        </p>
      )}
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="用户名"
          className="w-full rounded border px-3 py-2"
          style={{ borderColor: "var(--color-border)" }}
          autoComplete="username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
          className="w-full rounded border px-3 py-2"
          style={{ borderColor: "var(--color-border)" }}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded py-2 font-bold disabled:opacity-50"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          {busy ? "登录中…" : "登录"}
        </button>
      </form>
      <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
        还没有账号？<Link to="/register" style={{ color: "var(--color-primary)" }}>去注册</Link>
      </p>
    </div>
  );
}
