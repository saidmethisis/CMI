"use client";
import { adIntegrations } from "@/lib/ads";
import { useI18n } from "@/lib/i18n";

// "Ad integrations" block (item #3) — shows connected networks + own ad-server.
export default function AdIntegrations({ compact = false, max }: { compact?: boolean; max?: number }) {
  const { t } = useI18n();
  // keep the connected own ad-server first, then trim to `max` if provided
  const ordered = [...adIntegrations].sort((a, b) => (a.id === "self" ? -1 : b.id === "self" ? 1 : 0));
  const items = max ? ordered.slice(0, max) : ordered;
  const cols = max === 1 ? "" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section className={compact ? "" : "container-content my-8"}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold">{t("ads.integrations")}</h2>
        <span className="text-xs text-black/45 dark:text-white/45">{items.filter((i) => i.status === "connected").length} {t("ads.active")}</span>
      </div>
      <div className={`grid gap-3 ${cols}`}>
        {items.map((i) => (
          <div key={i.id} className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-sm font-bold text-brand dark:bg-white/10 dark:text-white">{i.name.charAt(0)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{i.name}</div>
              <div className="truncate text-xs text-black/50 dark:text-white/50">{i.note}</div>
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${i.status === "connected" ? "bg-up" : "bg-black/25 dark:bg-white/25"}`} title={i.status} />
          </div>
        ))}
      </div>
    </section>
  );
}
