"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function CookieConsent() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem("aktiv_cookie_ok")) setShow(true); } catch { /* */ } }, []);
  if (!show) return null;
  const accept = () => { try { localStorage.setItem("aktiv_cookie_ok", "1"); } catch { /* */ } setShow(false); };
  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-3 rounded-2xl border border-black/10 bg-[var(--surface)] p-3 shadow-xl dark:border-white/10 dark:bg-ink-surface md:bottom-4 md:left-1/2 md:right-auto md:mx-0 md:w-[580px] md:-translate-x-1/2">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <p className="min-w-0 flex-1 text-black/70 dark:text-white/70">
          {t("cookie.text")}{" "}
          <Link href="/privacy" className="text-accent underline">{t("cookie.policy")}</Link>.
        </p>
        <button onClick={accept} className="btn-primary shrink-0 text-sm">{t("cookie.accept")}</button>
      </div>
    </div>
  );
}
