"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

// Демо-подписка: без бэкенда, даёт обратную связь на клиенте.
export default function NewsletterForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr(t("footer.emailErr")); return; }
    setErr(""); setDone(true);
  };

  if (done) return <p className="rounded-lg bg-up/10 px-3 py-2 text-sm text-up">{t("footer.subscribed")}</p>;

  return (
    <form className="flex flex-wrap gap-2" onSubmit={submit}>
      <input className="input min-w-0 flex-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e-mail" aria-label="e-mail" />
      <button className="btn-primary shrink-0" type="submit">OK</button>
      {err && <p className="w-full text-xs text-down">{err}</p>}
    </form>
  );
}
