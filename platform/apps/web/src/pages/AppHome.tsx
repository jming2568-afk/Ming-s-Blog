import { useAuth } from "../components/AuthContext.js";

export function AppHome() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-black">工作台</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
        欢迎，{user?.displayName ?? user?.username}（{user?.email}）
      </p>
      <div className="mt-6 rounded border-2 border-dashed p-8 text-center" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-sm">暂无简历</p>
        <button className="mt-4 rounded px-5 py-2 font-bold" style={{ background: "var(--color-primary)", color: "#fff" }}>
          新建简历（P3 实现）
        </button>
      </div>
    </div>
  );
}
