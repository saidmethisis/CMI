"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function ModerationRow({
  id, title, lead, kind, author, category,
}: { id: string; title: string; lead: string; kind: string; author: string; category: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);

  const act = async (action: string) => {
    setBusy(true);
    try {
      await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, pinned }),
      });
      setDone(action);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const labels: Record<string, string> = { approve: t("status.published"), reject: t("status.rejected"), return: t("status.returned") };
    return <div className="card p-4 text-sm text-black/50 dark:text-white/50">{title} — {labels[done]}</div>;
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className={`chip !py-0.5 text-[11px] ${kind === "pr" ? "!border-amber-400/50 text-amber-600" : ""}`}>
              {kind === "pr" ? "PR" : "UGC"}
            </span>
            <span className="text-xs text-black/50 dark:text-white/50">{category} · {author}</span>
          </div>
          <h3 className="font-serif text-lg font-bold">{title}</h3>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">{lead}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3 dark:border-white/10">
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          {t("adm.pinTop")}
        </label>
        <div className="ml-auto flex gap-2">
          <button disabled={busy} onClick={() => act("return")} className="btn-ghost text-xs">{t("adm.return")}</button>
          <button disabled={busy} onClick={() => act("reject")} className="btn-ghost text-xs !text-down">{t("adm.reject")}</button>
          <button disabled={busy} onClick={() => act("approve")} className="btn-primary text-xs">{t("adm.approve")}</button>
        </div>
      </div>
    </div>
  );
}
