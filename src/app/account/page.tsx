"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "@/lib/session";
import { useAuth } from "@/lib/useAuth";
import { useI18n } from "@/lib/i18n";
import { LANGS } from "@/lib/dictionaries";
import ImageUpload from "@/components/ImageUpload";
import Cover from "@/components/Cover";

const TABS = ["profile", "saved", "history", "comments", "subs", "notif", "security"] as const;

export default function AccountPage() {
  const { user, sessions, loading, refresh, logout } = useAuth();
  const { t, setLang } = useI18n();
  const [saved] = useSaved();
  const [tab, setTab] = useState<string>("profile");
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  // настройки уведомлений (сохраняются в профиль)
  const NOTIF_KEYS: [string, string][] = [["replies", "acc.notifReplies"], ["articles", "acc.notifArticles"], ["digest", "acc.notifDigest"]];
  const [notif, setNotif] = useState<Record<string, boolean>>({ replies: true, articles: true, digest: false });
  const [notifMsg, setNotifMsg] = useState("");
  useEffect(() => {
    if (!user) return;
    try { const p = JSON.parse((user as { notifPrefs?: string }).notifPrefs || "{}"); setNotif({ replies: p.replies ?? true, articles: p.articles ?? true, digest: p.digest ?? false }); } catch { /* */ }
  }, [user]);
  const saveNotif = async () => {
    const r = await fetch("/api/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notifPrefs: notif }) });
    setNotifMsg(r.ok ? t("a.saved") : t("acc.error")); if (r.ok) refresh(); setTimeout(() => setNotifMsg(""), 1500);
  };

  if (loading) return <div className="container-content py-16 text-center text-black/60">{t("notif.loading")}</div>;
  if (!user) return (
    <div className="container-content grid min-h-[60vh] place-items-center py-10 text-center">
      <div>
        <h1 className="font-serif text-2xl font-bold">{t("menu.account")}</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">{t("acc.loginPrompt")}</p>
        <div className="mt-4 flex justify-center gap-2"><Link href="/login" className="btn-primary">{t("auth.signin")}</Link><Link href="/register" className="btn-ghost">{t("auth.register")}</Link></div>
      </div>
    </div>
  );

  const toggleDark = () => { const n = !dark; setDark(n); document.documentElement.classList.toggle("dark", n); localStorage.setItem("aktiv.theme", n ? "dark" : "light"); };

  return (
    <div className="container-content grid gap-6 py-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-3 flex items-center gap-2 px-1">
          {user.avatar && (
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full">
              <Cover src={user.avatar} alt="" width={80} height={80} sizes="40px" className="h-full w-full object-cover" />
            </span>
          )}
          <div className="min-w-0"><div className="truncate text-sm font-semibold">{user.displayName || user.name}</div><div className="truncate text-xs text-black/60">{user.email}</div></div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col">
          {TABS.map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${tab === k ? "bg-accent/10 text-accent" : "text-black/65 hover:bg-black/[0.04] dark:text-white/65 dark:hover:bg-white/[0.06]"}`}>{t(`acc.${k}`)}</button>
          ))}
          <button onClick={logout} className="mt-2 rounded-lg px-3 py-2 text-left text-sm text-down hover:bg-down/5">{t("acc.logout")}</button>
        </nav>
      </aside>

      <section>
        {tab === "profile" && <ProfileTab onSaved={refresh} />}
        {tab === "saved" && <SavedTab slugs={saved} />}
        {tab === "history" && <Panel title={t("acc.historyTitle")}><p className="text-sm text-black/60">{t("acc.historyEmpty")}</p></Panel>}
        {tab === "comments" && <MyCommentsTab />}
        {tab === "subs" && <SubsTab />}
        {tab === "notif" && (
          <Panel title={t("acc.notifTitle")}>
            {notifMsg && <div className="mb-2 rounded-lg bg-up/10 px-3 py-1.5 text-sm text-up">{notifMsg}</div>}
            <div className="space-y-2 text-sm">
              {NOTIF_KEYS.map(([k, l]) => (
                <label key={k} className="flex items-center justify-between rounded-lg border border-black/[0.06] px-3 py-2 dark:border-white/10">{t(l)}<input type="checkbox" checked={!!notif[k]} onChange={(e) => setNotif((p) => ({ ...p, [k]: e.target.checked }))} className="h-4 w-4 accent-accent" /></label>
              ))}
            </div>
            <button onClick={saveNotif} className="btn-primary mt-3 text-sm">{t("a.save")}</button>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm">{t("acc.uiLang")}</span>
              <select className="input max-w-[120px]" onChange={(e) => setLang(e.target.value as never)} defaultValue={user.locale}>{LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
              <label className="ml-auto flex items-center gap-2 text-sm">{t("acc.darkTheme")}<button onClick={toggleDark} className={`h-6 w-11 rounded-full p-0.5 transition ${dark ? "bg-brand" : "bg-black/20"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${dark ? "translate-x-5" : ""}`} /></button></label>
            </div>
          </Panel>
        )}
        {tab === "security" && <SecurityTab user={user} sessions={sessions} onChange={refresh} />}
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card p-5"><h2 className="mb-3 font-serif text-lg font-bold">{title}</h2>{children}</div>;
}

function SavedTab({ slugs }: { slugs: string[] }) {
  const { t } = useI18n();
  const [items, setItems] = useState<{ slug: string; title: string; cover?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await Promise.all(slugs.map((s) => fetch(`/api/articles/${s}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
        if (alive) setItems(res.map((j, i) => (j?.data ? { slug: slugs[i], title: j.data.title, cover: j.data.cover } : { slug: slugs[i], title: slugs[i] })));
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [slugs]);
  if (loading) return <Panel title={t("acc.saved")}><p className="text-sm text-black/60">{t("notif.loading")}</p></Panel>;
  return (
    <Panel title={t("acc.saved")}>
      {items.length === 0 ? <p className="text-sm text-black/60">{t("account.noSaved")}</p> : (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {items.map((a) => (
            <li key={a.slug} className="py-2.5">
              <Link href={`/n/${a.slug}`} className="flex items-center gap-3 text-sm hover:text-accent">
                {a.cover && <Cover src={a.cover} alt="" width={112} height={80} sizes="56px" className="h-10 w-14 shrink-0 rounded object-cover" />}
                <span className="line-clamp-2">{a.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function MyCommentsTab() {
  const { t } = useI18n();
  const [rows, setRows] = useState<{ id: string; body: string; status: string; createdAt: string; articleSlug: string; articleTitle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try { const r = await fetch("/api/comments/mine", { cache: "no-store" }); const j = await r.json(); if (alive && r.ok) setRows(j.data); } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);
  if (loading) return <Panel title={t("acc.myComments")}><p className="text-sm text-black/60">{t("notif.loading")}</p></Panel>;
  return (
    <Panel title={t("acc.myComments")}>
      {rows.length === 0 ? <p className="text-sm text-black/60">{t("acc.noComments")}</p> : (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {rows.map((c) => (
            <li key={c.id} className="py-3 text-sm">
              <p className="text-black/70 dark:text-white/70">{c.body}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <Link href={`/n/${c.articleSlug}#c-${c.id}`} className="text-accent hover:underline">→ {c.articleTitle}</Link>
                {c.status !== "approved" && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">{c.status === "pending" ? t("comments.pending") : c.status}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function SubsTab() {
  const { t } = useI18n();
  const [items, setItems] = useState<{ targetType: string; targetId: string; name: string; href: string }[]>([]);
  const load = async () => { const r = await fetch("/api/follow", { cache: "no-store" }); const j = await r.json(); setItems(j.data ?? []); };
  useEffect(() => { load(); }, []);
  const unfollow = async (t: { targetType: string; targetId: string }) => {
    await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: t.targetType, targetId: t.targetId }) });
    load();
  };
  return (
    <Panel title={t("acc.subs")}>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((x) => (
            <li key={x.targetType + x.targetId} className="flex items-center gap-2 rounded-lg border border-black/[0.06] px-3 py-2 text-sm dark:border-white/10">
              <span className="chip !py-0 text-[10px]">{x.targetType === "author" ? t("acc.chipAuthor") : t("acc.chipTopic")}</span>
              <Link href={x.href} className="flex-1 truncate hover:text-brand dark:hover:text-white">{x.name}</Link>
              <button onClick={() => unfollow(x)} className="text-xs text-down">{t("acc.unfollow")}</button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-black/60 dark:text-white/65">{t("acc.noSubs")}</p>
      )}
    </Panel>
  );
}

function ProfileTab({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [f, setF] = useState({ name: user!.name, displayName: user!.displayName, email: user!.email, avatar: user!.avatar, banner: user!.banner, bio: user!.bio, phone: user!.phone, timezone: user!.timezone });
  const [msg, setMsg] = useState("");
  const save = async () => {
    const r = await fetch("/api/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    setMsg(r.ok ? (f.email !== user!.email ? t("acc.savedEmailCheck") : t("a.saved")) : j.error?.message);
    onSaved();
  };
  return (
    <Panel title={t("acc.profile")}>
      {msg && <div className="mb-3 rounded-lg bg-up/10 px-3 py-2 text-sm text-up">{msg}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">{t("auth.name")}</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">{t("acc.displayName")}</label><input className="input" value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} /></div>
        <div><label className="label">{t("auth.email")} {user!.emailVerified ? "✓" : t("acc.emailUnverified")}</label><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">{t("ap.phone")}</label><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <ImageUpload label={t("acc.avatarLabel")} value={f.avatar} onChange={(v) => setF({ ...f, avatar: v })} variant="avatar" maxW={512} />
        <ImageUpload label={t("acc.bannerLabel")} value={f.banner} onChange={(v) => setF({ ...f, banner: v })} variant="banner" maxW={1600} />
        <div className="sm:col-span-2"><label className="label">{t("a.bio")}</label><textarea className="input resize-y" rows={2} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
      </div>
      <button className="btn-primary mt-4" onClick={save}>{t("acc.saveProfile")}</button>
    </Panel>
  );
}

function SecurityTab({ user, sessions, onChange }: { user: { twoFactor: boolean; emailVerified: boolean }; sessions: { id: string; userAgent: string; ip: string; lastSeenAt: string; current: boolean }[]; onChange: () => void }) {
  const { t } = useI18n();
  const [pw, setPw] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState("");
  const [tf, setTf] = useState<{ secret: string; otpauth: string } | null>(null);
  const [tfCode, setTfCode] = useState("");
  const [tfErr, setTfErr] = useState("");
  const H = { "Content-Type": "application/json" };
  const changePw = async () => { const r = await fetch("/api/auth/password", { method: "POST", headers: H, body: JSON.stringify(pw) }); const j = await r.json(); setMsg(r.ok ? t("acc.pwChanged") : j.error?.message); setPw({ current: "", next: "" }); };
  const init2fa = async () => { setTfErr(""); const r = await fetch("/api/auth/2fa", { method: "POST", headers: H, body: JSON.stringify({ action: "init" }) }); const j = await r.json(); if (r.ok) { setTf(j.data); setTfCode(""); } };
  const enable2fa = async () => { setTfErr(""); const r = await fetch("/api/auth/2fa", { method: "POST", headers: H, body: JSON.stringify({ action: "enable", code: tfCode }) }); const j = await r.json(); if (!r.ok) { setTfErr(j.error?.message || t("acc.error")); return; } setTf(null); onChange(); };
  const disable2fa = async () => { const c = prompt(t("acc.disable2faPrompt")); if (c === null) return; const r = await fetch("/api/auth/2fa", { method: "POST", headers: H, body: JSON.stringify({ action: "disable", code: c }) }); const j = await r.json(); if (!r.ok) { alert(j.error?.message); return; } onChange(); };
  const revoke = async () => { await fetch("/api/auth/sessions", { method: "DELETE" }); onChange(); };
  const del = async () => { if (!confirm(t("acc.confirmDelete"))) return; await fetch("/api/auth/delete", { method: "POST" }); window.location.href = "/"; };

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-lg bg-up/10 px-3 py-2 text-sm text-up">{msg}</div>}
      <Panel title={t("acc.changePw")}>
        <div className="grid max-w-md gap-3">
          <input className="input" type="password" placeholder={t("acc.currentPw")} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <input className="input" type="password" placeholder={t("acc.newPw")} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <button className="btn-primary w-fit" onClick={changePw}>{t("acc.changePwBtn")}</button>
        </div>
      </Panel>
      <Panel title={t("acc.twoFaTitle")}>
        {user.twoFactor ? (
          <div className="flex items-center justify-between rounded-lg border border-up/30 bg-up/5 px-3 py-2 text-sm">
            <span className="font-medium text-up">{t("acc.twoFaOn")}</span>
            <button onClick={disable2fa} className="btn-ghost text-xs !text-down">{t("a.disable")}</button>
          </div>
        ) : tf ? (
          <div className="space-y-3">
            <p className="text-sm text-black/60 dark:text-white/70">{t("acc.twoFaHelp")}</p>
            <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 font-mono text-sm tracking-wider dark:border-white/10 dark:bg-white/[0.04]">{tf.secret}</div>
            <a href={tf.otpauth} className="text-xs text-accent hover:underline">{t("acc.twoFaOpenApp")}</a>
            {tfErr && <div className="text-xs text-down">{tfErr}</div>}
            <div className="flex flex-wrap items-end gap-2">
              <div><label className="label">{t("acc.twoFaCode")}</label><input className="input tracking-[0.3em]" inputMode="numeric" maxLength={6} value={tfCode} onChange={(e) => setTfCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" /></div>
              <button className="btn-primary" disabled={tfCode.length < 6} onClick={enable2fa}>{t("acc.twoFaConfirm")}</button>
              <button className="btn-ghost" onClick={() => setTf(null)}>{t("a.cancel")}</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-black/[0.06] px-3 py-2 text-sm dark:border-white/10">
            <span>{t("acc.twoFaOff")}</span>
            <button onClick={init2fa} className="btn-primary text-xs">{t("a.enable")}</button>
          </div>
        )}
      </Panel>
      <Panel title={t("acc.devices")}>
        <ul className="space-y-2 text-sm">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-lg border border-black/[0.06] px-3 py-2 dark:border-white/10">
              <div className="flex-1 truncate"><span className="font-medium">{s.userAgent.slice(0, 40) || t("acc.device")}</span> <span className="text-xs text-black/60">· {s.ip}</span></div>
              {s.current ? <span className="chip !py-0 text-[10px] !border-up/40 text-up">{t("acc.current")}</span> : <span className="text-xs text-black/60">{new Date(s.lastSeenAt).toLocaleDateString("ru-RU")}</span>}
            </li>
          ))}
        </ul>
        <button className="btn-ghost mt-3 text-xs" onClick={revoke}>{t("acc.revokeAll")}</button>
      </Panel>
      <Panel title={t("acc.deleteTitle")}>
        <p className="mb-3 text-sm text-black/60 dark:text-white/65">{t("acc.deleteNote")}</p>
        <button className="btn-ghost !text-down" onClick={del}>{t("acc.deleteBtn")}</button>
      </Panel>
    </div>
  );
}
