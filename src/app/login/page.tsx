"use client";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import GoogleRecaptcha from "@/components/GoogleRecaptcha";

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [human, setHuman] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState("");

  const submit = async () => {
    setError("");
    if (!twoFA && !human) { setError("Подтвердите, что вы не робот."); return; }
    setBusy(true);
    const r = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(twoFA ? { email, password, code, challenge } : { email, password, human }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) {
      if (j.twoFactorRequired) {
        setChallenge(j.challenge || challenge);
        setError(twoFA ? (j.error?.message || "") : ""); // первый раз — просто показываем поле кода
        setTwoFA(true);
        return;
      }
      setError(j.error?.message || "Ошибка"); setHuman(null); return;
    }
    const next = new URLSearchParams(window.location.search).get("next") || "/account";
    window.location.href = next.startsWith("/") ? next : "/account";
  };

  return (
    <div className="container-content grid min-h-[70vh] place-items-center py-10">
      <div className="card w-full max-w-sm p-6">
        <h1 className="font-serif text-2xl font-bold">{t("auth.loginTitle")}</h1>
        {error &&<div className="mt-3 rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-sm text-down">{error}</div>}
        <div className="mt-5 space-y-3">
          {!twoFA ? (
            <>
              <div><label className="label">{t("auth.email")}</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.com" /></div>
              <div><label className="label">{t("auth.password")}</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
              <GoogleRecaptcha onToken={setHuman} />
            </>
          ) : (
            <div>
              <label className="label">{t("auth.twoFACode")}</label>
              <input autoFocus className="input tracking-[0.4em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" onKeyDown={(e) => e.key === "Enter" && submit()} />
              <p className="mt-1 text-xs text-black/45 dark:text-white/45">{t("auth.twoFAHint")}</p>
            </div>
          )}
          <button type="button" onClick={submit} disabled={busy || (twoFA && code.length < 6)} className="btn-primary w-full">{busy ? "…" : twoFA ? t("auth.confirm") : t("auth.signin")}</button>
        </div>
        <div className="mt-4 flex justify-between text-sm text-black/50 dark:text-white/50">
          <Link href="/forgot" className="hover:text-brand dark:hover:text-white">Забыли пароль?</Link>
          <Link href="/register" className="text-brand dark:text-white">{t("auth.register")}</Link>
        </div>
      </div>
    </div>
  );
}
