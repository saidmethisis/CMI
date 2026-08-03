"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function ForgotPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [issued, setIssued] = useState("");
  const [msg, setMsg] = useState("");

  // переход по ссылке из письма: /forgot?email=…&token=… — сразу показываем форму сброса
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const e = p.get("email"), tk = p.get("token");
    if (e) setEmail(e);
    if (tk) { setToken(tk); setIssued(tk); }
  }, []);

  const request = async () => {
    const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await r.json();
    setIssued(j.resetToken || "");
    setMsg(j.resetToken ? t("au.tokenIssued") : t("au.ifEmailExists"));
  };
  const reset = async () => {
    const r = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token, password }) });
    const j = await r.json();
    setMsg(r.ok ? t("au.passwordChanged") : j.error?.message);
  };

  return (
    <div className="container-content grid min-h-[70vh] place-items-center py-10">
      <div className="card w-full max-w-sm p-6">
        <h1 className="font-serif text-2xl font-bold">{t("au.forgotTitle")}</h1>
        {msg && <div className="mt-3 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand dark:text-white">{msg}</div>}
        <div className="mt-4 space-y-3">
          <div><label className="label">{t("auth.email")}</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.com" /></div>
          <button className="btn-ghost w-full" onClick={request}>{t("au.getToken")}</button>
          {issued && (
            <>
              <div><label className="label">{t("au.resetToken")}</label><input className="input" value={token} onChange={(e) => setToken(e.target.value)} placeholder={issued} /></div>
              <div><label className="label">{t("au.newPassword")}</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <button className="btn-primary w-full" onClick={reset}>{t("au.resetPassword")}</button>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-sm"><Link href="/login" className="text-brand dark:text-white">← {t("auth.loginTitle")}</Link></p>
      </div>
    </div>
  );
}
