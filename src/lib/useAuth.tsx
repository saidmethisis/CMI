"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string; name: string; displayName: string; email: string; roleSlug: string; avatar: string;
  banner: string; bio: string; phone: string; locale: string; timezone: string; socials: string;
  emailVerified: boolean; twoFactor: boolean; companyId: string | null; authorId: string | null;
}
export interface SessionInfo { id: string; userAgent: string; ip: string; lastSeenAt: string; current: boolean }
type Role = { slug: string; name: string; permissions: string[] } | null;

interface Ctx {
  user: AuthUser | null; role: Role; sessions: SessionInfo[]; loading: boolean;
  refresh: () => Promise<void>; logout: () => Promise<void>;
  can: (perm: string) => boolean;
}
const AuthContext = createContext<Ctx>({ user: null, role: null, sessions: [], loading: true, refresh: async () => {}, logout: async () => {}, can: () => false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const j = await r.json();
      setUser(j.data ?? null); setRole(j.role ?? null); setSessions(j.sessions ?? []);
    } catch { setUser(null); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // auto-logout after 30 min of inactivity
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => logout(), 30 * 60 * 1000); };
    const evts = ["mousemove", "keydown", "scroll", "click"];
    evts.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer); evts.forEach((e) => window.removeEventListener(e, reset)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); setRole(null); setSessions([]);
  }, []);

  const can = useCallback((perm: string) => !!role && (role.permissions.includes("*") || role.permissions.includes(perm)), [role]);

  return <AuthContext.Provider value={{ user, role, sessions, loading, refresh, logout, can }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
