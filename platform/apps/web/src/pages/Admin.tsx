import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext.js";
import { apiAdminUsers, type AdminUser } from "../lib/api.js";

/** 管理端（P5 最小实现）：用户列表（admin 角色可见） */
export function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiAdminUsers();
        setUsers(res.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (user?.role !== "admin") {
    return <p className="text-sm" style={{ color: "var(--color-muted)" }}>无权限访问管理端（需要 admin 角色，见 ADMIN_USERNAMES）</p>;
  }
  if (error) return <p className="text-sm" style={{ color: "var(--color-primary)" }}>{error}</p>;
  if (loading) return <p className="text-sm" style={{ color: "var(--color-muted)" }}>加载中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">管理端</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>用户列表（{users.length}）</p>
      <div className="mt-4 overflow-x-auto rounded" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">用户名</th>
              <th className="px-3 py-2">邮箱</th>
              <th className="px-3 py-2">角色</th>
              <th className="px-3 py-2">简历数</th>
              <th className="px-3 py-2">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td className="px-3 py-2">{u.id}</td>
                <td className="px-3 py-2 font-bold">
                  {u.username}
                  {u.role === "admin" && (
                    <span className="ml-2 rounded px-1.5 py-0.5 text-xs" style={{ background: "var(--color-primary)", color: "#fff" }}>
                      admin
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">{u.resumeCount}</td>
                <td className="px-3 py-2" style={{ color: "var(--color-muted)" }}>
                  {new Date(u.createdAt).toLocaleString("zh-CN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
