import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiLogin, apiLogout, apiMe, apiRegister, type PublicUser } from "../lib/api.js";

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<PublicUser>;
  register: (input: { username: string; email: string; password: string }) => Promise<PublicUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 启动时恢复会话
  useEffect(() => {
    apiMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin({ username, password });
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (input: { username: string; email: string; password: string }) => {
    const res = await apiRegister(input);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => undefined);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
