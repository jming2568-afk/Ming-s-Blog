export function Register() {
  return (
    <div className="mx-auto max-w-sm rounded p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <h1 className="text-xl font-bold">注册</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
        P2 阶段实现（注册/登录/会话）
      </p>
      <form className="mt-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
        <input placeholder="用户名" className="w-full rounded border px-3 py-2" style={{ borderColor: "var(--color-border)" }} />
        <input placeholder="邮箱" className="w-full rounded border px-3 py-2" style={{ borderColor: "var(--color-border)" }} />
        <input type="password" placeholder="密码" className="w-full rounded border px-3 py-2" style={{ borderColor: "var(--color-border)" }} />
        <button type="submit" disabled className="w-full rounded py-2 font-bold opacity-50" style={{ background: "var(--color-primary)", color: "#fff" }}>
          注册（待实现）
        </button>
      </form>
    </div>
  );
}
