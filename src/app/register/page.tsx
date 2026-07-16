"use client";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import GoogleRecaptcha from "@/components/GoogleRecaptcha";

export default function RegisterPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [human, setHuman] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!consent) { setError("Необходимо согласие на обработку персональных данных."); return; }
    if (!human) { setError("Подтвердите, что вы не робот."); return; }
    setBusy(true);
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, human, consent }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setError(j.error?.message || "Ошибка"); setHuman(null); return; }
    window.location.href = "/account";
  };

  return (
    <div className="container-content grid min-h-[70vh] place-items-center py-10">
      <div className="card w-full max-w-sm p-6">
        <h1 className="font-serif text-2xl font-bold">{t("auth.registerTitle")}</h1>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">Регистрация доступна только читателям. Аккаунты авторов и компаний создаёт администрация.</p>
        {error && <div className="mt-3 rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-sm text-down">{error}</div>}
        <div className="mt-5 space-y-3">
          <div><label className="label">{t("auth.name")}</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">{t("auth.email")}</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@mail.com" /></div>
          <div><label className="label">{t("auth.password")}</label><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Минимум 8 символов" /></div>
          <label className="flex items-start gap-2 text-xs text-black/60 dark:text-white/60">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-accent" />
            <span>Я даю согласие на обработку персональных данных и принимаю <Link href="/privacy" className="text-accent underline">Политику конфиденциальности</Link> и <Link href="/terms" className="text-accent underline">Пользовательское соглашение</Link>.</span>
          </label>
          <GoogleRecaptcha onToken={setHuman} />
          <button type="button" onClick={submit} disabled={busy || !consent} className="btn-primary w-full">{busy ? "…" : t("auth.create")}</button>
        </div>
        <p className="mt-4 text-center text-sm text-black/50 dark:text-white/50">{t("auth.haveAccount")} <Link href="/login" className="text-brand dark:text-white">{t("auth.signin")}</Link></p>
      </div>
    </div>
  );
}
