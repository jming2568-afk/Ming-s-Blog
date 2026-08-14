import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext.js";
import {
  apiAdminUsers,
  apiGetAdminConfig,
  apiTestLlm,
  apiTestStorage,
  apiUpdateAdminConfig,
  type AdminUser,
  type ConfigEntry,
  type TestLlmResult,
  type TestStorageResult,
} from "../lib/api.js";

/** 平台配置中心（P5.5）：全量入库 + 敏感值加密；仅 admin */
function ControlPanel() {
  const [entries, setEntries] = useState<ConfigEntry[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [masterKeyOk, setMasterKeyOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [llmResult, setLlmResult] = useState<TestLlmResult | null>(null);
  const [storageResult, setStorageResult] = useState<TestStorageResult | null>(null);
  const [llmBusy, setLlmBusy] = useState(false);
  const [storageBusy, setStorageBusy] = useState(false);

  const load = () => {
    void (async () => {
      try {
        const res = await apiGetAdminConfig();
        setMasterKeyOk(res.masterKeyOk);
        setEntries(res.config);
        const next: Record<string, string> = {};
        for (const e of res.config) next[e.key] = "";
        setValues(next);
      } catch (err) {
        alert(err instanceof Error ? err.message : "加载配置失败");
      }
    })();
  };
  useEffect(load, []);

  const groups: Array<{ title: string; keys: string[] }> = [
    { title: "LLM（写作助手 / 简历导入）", keys: ["LLM_API_KEY", "LLM_BASE_URL", "LLM_TEXT_MODEL", "LLM_VISION_MODEL", "LLM_PROTOCOL"] },
    { title: "对象存储（OSS / TOS / MinIO）", keys: ["STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY", "STORAGE_ENDPOINT", "STORAGE_REGION", "STORAGE_BUCKET", "STORAGE_PUBLIC_URL_BASE", "STORAGE_PATH_STYLE"] },
    { title: "平台", keys: ["CORS_ORIGINS", "ADMIN_USERNAMES"] },
  ];
  const entryOf = (key: string) => entries.find((e) => e.key === key);

  const save = async () => {
    setSaving(true);
    try {
      await apiUpdateAdminConfig(
        entries.map((e) => ({ key: e.key, value: values[e.key] ?? "" }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const testLlm = async () => {
    setLlmBusy(true);
    setLlmResult(null);
    try {
      setLlmResult(await apiTestLlm());
    } catch (err) {
      setLlmResult({ ok: false, latencyMs: 0, protocol: "", model: "", error: err instanceof Error ? err.message : "测试失败" });
    } finally {
      setLlmBusy(false);
    }
  };
  const testStorage = async () => {
    setStorageBusy(true);
    setStorageResult(null);
    try {
      setStorageResult(await apiTestStorage());
    } catch (err) {
      setStorageResult({ ok: false, latencyMs: 0, error: err instanceof Error ? err.message : "测试失败" });
    } finally {
      setStorageBusy(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">平台控制面板</h2>
        <span className="text-xs" style={{ color: masterKeyOk ? "var(--color-accent)" : "var(--color-primary)" }}>
          {masterKeyOk ? "🔒 密钥加密已启用（CONFIG_MASTER_KEY）" : "⚠ 未配置 CONFIG_MASTER_KEY，密钥项不可保存"}
        </span>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
        保存后立即生效，无需重启；密钥存库前 AES-256-GCM 加密，页面不回显原文
      </p>

      {groups.map((g) => (
        <div key={g.title} className="mt-4 rounded p-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h3 className="mb-3 text-sm font-bold">{g.title}</h3>
          <div className="space-y-3">
            {g.keys.map((key) => {
              const e = entryOf(key);
              if (!e) return null;
              const isSecret = e.sensitive;
              return (
                <div key={key} className="flex items-center gap-3">
                  <label className="flex-1">
                    <span className="mb-1 block text-xs" style={{ color: "var(--color-muted)" }}>
                      {key}
                      <span
                        className="ml-2 rounded px-1.5 py-0.5 text-[10px]"
                        style={{
                          background: e.source === "db" ? "var(--color-accent)" : e.source === "env" ? "var(--color-primary)" : "transparent",
                          color: e.source === "db" ? "#fff" : e.source === "env" ? "#fff" : "var(--color-muted)",
                          border: e.source === "default" ? "1px solid var(--color-border)" : "none",
                        }}
                      >
                        {e.source === "db" ? "面板" : e.source === "env" ? "环境变量" : "默认"}
                      </span>
                    </span>
                    <div className="flex gap-2">
                      <input
                        type={isSecret && !showSecret[key] ? "password" : "text"}
                        value={values[key] ?? ""}
                        placeholder={e.configured && e.source !== "db" ? "已配置（修改则留空=保持）" : e.configured ? "已配置（留空=保持，输入可覆盖）" : "未配置"}
                        onChange={(v) => setValues((p) => ({ ...p, [key]: v.target.value }))}
                        className="flex-1 rounded border px-3 py-1.5 text-sm"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                      />
                      {isSecret && (
                        <button
                          type="button"
                          onClick={() => setShowSecret((p) => ({ ...p, [key]: !p[key] }))}
                          className="rounded px-2 py-1 text-xs"
                          style={{ border: "1px solid var(--color-border)" }}
                        >
                          {showSecret[key] ? "隐藏" : "显示"}
                        </button>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void save()}
          disabled={saving || !masterKeyOk}
          className="rounded px-4 py-2 text-sm font-bold disabled:opacity-50"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          {saving ? "保存中…" : "保存配置"}
        </button>
        {saved && <span className="text-sm" style={{ color: "var(--color-accent)" }}>已保存 ✓（立即生效）</span>}
        <button
          onClick={() => void testLlm()}
          disabled={llmBusy}
          className="rounded px-4 py-2 text-sm font-bold disabled:opacity-50"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {llmBusy ? "测试中…" : "🧪 测试 LLM"}
        </button>
        {llmResult && (
          <span className="text-xs" style={{ color: llmResult.ok ? "var(--color-accent)" : "var(--color-primary)" }}>
            {llmResult.ok
              ? `LLM ✅ ${llmResult.latencyMs}ms · 协议 ${llmResult.protocol} · ${llmResult.model}`
              : `LLM ❌ ${llmResult.error}`}
          </span>
        )}
        <button
          onClick={() => void testStorage()}
          disabled={storageBusy}
          className="rounded px-4 py-2 text-sm font-bold disabled:opacity-50"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {storageBusy ? "测试中…" : "🧪 测试存储"}
        </button>
        {storageResult && (
          <span className="text-xs" style={{ color: storageResult.ok ? "var(--color-accent)" : "var(--color-primary)" }}>
            {storageResult.ok
              ? `存储 ✅ ${storageResult.latencyMs}ms · ${storageResult.bucket} · path-style=${storageResult.pathStyle}`
              : `存储 ❌ ${storageResult.error}`}
          </span>
        )}
      </div>
    </div>
  );
}

/** 管理端（P5 最小实现）：用户列表（admin 角色可见）+ 配置中心 */
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

      {/* 平台配置中心 */}
      <ControlPanel />
    </div>
  );
}
