"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

// Глобальная плашка «вы вошли как …»: видна на всех страницах, пока активна имперсонация.
// Флаг лежит в не-httpOnly cookie aktiv_impersonate, который ставит /api/admin/login-as.
export default function ImpersonationBanner() {
  const { t } = useI18n();
  const [who, setWho] = useState<{ name: string; roleSlug: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)aktiv_impersonate=([^;]+)/);
    if (m) { try { setWho(JSON.parse(decodeURIComponent(m[1]))); } catch { /* */ } }
  }, []);

  if (!who) return null;

  const exit = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/login-as", { method: "DELETE" });
      window.location.href = "/admin/staff";
    } finally { setBusy(false); }
  };

  return (
    <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black">
      <span>{t("imp.title")}: «{who.name}» · {who.roleSlug}</span>
      <button onClick={exit} disabled={busy} className="rounded-full bg-black/85 px-3 py-1 text-xs font-bold text-white hover:bg-black disabled:opacity-60">
        {busy ? "…" : t("imp.exit")}
      </button>
    </div>
  );
}
