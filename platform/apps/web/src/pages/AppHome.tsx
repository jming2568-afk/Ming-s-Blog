export function AppHome() {
  return (
    <div>
      <h1 className="text-2xl font-black">工作台</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
        P2 起：未登录访问重定向 /login；P3 起：简历列表 + 新建
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
