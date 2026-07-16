"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type User = { id: string; name: string; email: string; roleSlug: string; companyId: string | null; status: string };
type Role = { slug: string; name: string };

const statusMap: Record<string, string> = { active: "!border-up/40 text-up", blocked: "!border-down/40 text-down", disabled: "!border-amber-400/50 text-amber-600" };
const statusLabel: Record<string, string> = { active: "Активен", blocked: "Заблокирован", disabled: "Отключён" };

export default function StaffPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", roleSlug: "writer", password: "" });
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [u, r] = await Promise.all([fetch("/api/admin/users", { cache: "no-store" }).then((x) => x.json()), fetch("/api/admin/roles", { cache: "no-store" }).then((x) => x.json())]);
    setUsers(u.data); setRoles(r.data);
    const m = document.cookie.match(/aktiv_impersonate=([^;]+)/);
    if (m) try { setImpersonating(JSON.parse(decodeURIComponent(m[1])).name); } catch { /* */ }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const patch = async (id: string, body: Record<string, unknown>) => {
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    load();
  };
  const create = async () => {
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json(); if (!r.ok) { setMsg(j.error?.message || "Ошибка"); setTimeout(() => setMsg(""), 3000); return; }
    setCreating(false); setForm({ name: "", email: "", roleSlug: "writer", password: "" }); load();
  };
  const loginAs = async (u: User) => {
    await fetch("/api/admin/login-as", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, name: u.name, roleSlug: u.roleSlug }) });
    setImpersonating(u.name);
  };
  const stopImpersonate = async () => { await fetch("/api/admin/login-as", { method: "DELETE" }); setImpersonating(null); };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div><h1 className="font-serif text-2xl font-bold">{t("a.hUsers")}</h1></div>
        <button className="btn-primary text-sm" onClick={() => setCreating((v) => !v)}>+ {t("a.create")}</button>
      </div>
      {msg && <div className="mb-3 rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-sm text-down">{msg}</div>}

      {impersonating && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand dark:text-white">
          Вы вошли как «{impersonating}» (демо-имперсонация). <button className="btn-ghost text-xs" onClick={stopImpersonate}>Выйти</button>
        </div>
      )}
      {creating && (
        <div className="card mb-4 flex flex-wrap items-end gap-2 p-3">
          <div><label className="label">{t("a.name")}</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">{t("a.password")}</label><input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div><label className="label">{t("a.role")}</label><select className="input" value={form.roleSlug} onChange={(e) => setForm({ ...form, roleSlug: e.target.value })}>{roles.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}</select></div>
          <button className="btn-primary" onClick={create}>{t("a.create")}</button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="text-left text-xs uppercase text-black/40 dark:text-white/40"><th className="px-4 py-2 font-medium">{t("a.hUsers")}</th><th className="px-4 py-2 font-medium">{t("a.role")}</th><th className="px-4 py-2 font-medium">{t("a.status")}</th><th className="px-4 py-2 font-medium">{t("a.actions")}</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-black/5 dark:border-white/10">
                <td className="px-4 py-3"><div className="font-medium">{u.name}</div><div className="text-xs text-black/40">{u.email}</div></td>
                <td className="px-4 py-3">
                  <select className="rounded-lg border border-black/10 bg-transparent px-2 py-1 text-xs dark:border-white/15" value={u.roleSlug} onChange={(e) => patch(u.id, { roleSlug: e.target.value })}>
                    {roles.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3"><span className={`chip !py-0.5 text-[11px] ${statusMap[u.status] ?? ""}`}>{statusLabel[u.status] ?? u.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button className="btn-ghost text-xs" onClick={() => loginAs(u)}>{t("a.loginAs")}</button>
                    {u.status !== "blocked"
                      ? <button className="btn-ghost text-xs !text-down" onClick={() => patch(u.id, { status: "blocked" })}>{t("a.block")}</button>
                      : <button className="btn-ghost text-xs !text-up" onClick={() => patch(u.id, { status: "active" })}>{t("a.unblock")}</button>}
                    {u.status !== "disabled"
                      ? <button className="btn-ghost text-xs" onClick={() => patch(u.id, { status: "disabled" })}>{t("a.disable")}</button>
                      : <button className="btn-ghost text-xs" onClick={() => patch(u.id, { status: "active" })}>{t("a.enable")}</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
