"use client";
import { useCallback, useEffect, useState } from "react";
import { BANK_CODES, SOURCE_NAME, SOURCE_URL, type BankRate, type BankRatesByCode } from "@/lib/bank-rates";
import { useI18n } from "@/lib/i18n";

// Реальные курсы покупки/продажи в коммерческих банках Узбекистана (источник — bank.uz).
// Ничего не досчитываем и не моделируем: показываем ровно то, что отдал источник,
// со ссылкой на него. Если данных нет — блок не рисуется вовсе.
const REFRESH_MS = 30 * 60 * 1000;
const COLLAPSED = 8;

export default function BankRates({ initial }: { initial?: { data: BankRatesByCode; updatedAt: string; source: string } }) {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  // Данные приходят с сервера уже отрендеренными; клиент лишь освежает их со временем.
  const [data, setData] = useState<BankRatesByCode>(initial?.data ?? {});
  const [updatedAt, setUpdatedAt] = useState(initial?.updatedAt ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [tab, setTab] = useState<string>("USD");
  const [sort, setSort] = useState<null | "buy" | "sell">(null);
  const [all, setAll] = useState(false);
  const [loaded, setLoaded] = useState(!!initial);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/bank-rates", { cache: "no-store" });
      const j = await r.json();
      setData(j.data ?? {});
      setUpdatedAt(j.updatedAt ?? "");
      setSource(j.source ?? "");
    } catch {
      /* оставляем прошлый снимок */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!initial) load(); // с серверными данными первый запрос не нужен
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const codes = BANK_CODES.filter((c) => (data[c]?.length ?? 0) > 0);
  // пока грузим — тихо; если источник недоступен — блок не показываем, чтобы не
  // занимать место пустой таблицей и не вводить читателя в заблуждение
  if (!loaded || codes.length === 0) return null;

  const active = codes.includes(tab as (typeof codes)[number]) ? tab : codes[0];
  let rows: BankRate[] = data[active] ?? [];
  if (sort) rows = [...rows].sort((a, b) => b[sort] - a[sort]);
  const shown = all ? rows : rows.slice(0, COLLAPSED);

  return (
    <section className="card overflow-hidden" aria-label={t("w.bankRates")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-black/5 px-4 py-3 dark:border-white/10">
        <h2 className="font-serif text-lg font-bold">{t("w.bankRates")}</h2>
        <div className="ml-auto flex gap-1 text-sm">
          {codes.map((code) => (
            <button
              key={code}
              onClick={() => { setTab(code); setAll(false); }}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${active === code ? "bg-brand text-white" : "text-black/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"}`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs text-black/45 dark:border-white/10 dark:text-white/45">
              <th className="px-4 py-2.5 font-semibold">{t("w.bank")}</th>
              <th className="cursor-pointer px-4 py-2.5 text-right font-semibold" onClick={() => setSort(sort === "buy" ? null : "buy")}>
                {active} {t("w.buy")} ▲▼
              </th>
              <th className="cursor-pointer px-4 py-2.5 text-right font-semibold" onClick={() => setSort(sort === "sell" ? null : "sell")}>
                {active} {t("w.sell")} ▲▼
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.slug} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] dark:border-white/[0.05] dark:hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-semibold text-brand dark:text-white/85">
                  <a href={r.url} target="_blank" rel="noopener nofollow" className="hover:underline">{r.bank}</a>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-up">
                  {r.buy.toLocaleString(loc)} <span className="text-black/40 dark:text-white/40">{t("w.sum")}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-down">
                  {r.sell.toLocaleString(loc)} <span className="text-black/40 dark:text-white/40">{t("w.sum")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 px-4 py-2.5 text-xs text-black/45 dark:border-white/10 dark:text-white/45">
        {rows.length > COLLAPSED ? (
          <button onClick={() => setAll((v) => !v)} className="font-semibold text-accent hover:underline">
            {all ? t("w.showLess") : `${t("w.showAll")} (${rows.length})`}
          </button>
        ) : <span />}
        <span>
          {t("w.source")}:{" "}
          <a href={SOURCE_URL} target="_blank" rel="noopener nofollow" className="font-semibold hover:underline">{SOURCE_NAME}</a>
          {source !== "unavailable" && updatedAt && ` · ${t("w.updated")}: ${new Date(updatedAt).toLocaleString(loc, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
        </span>
      </div>
    </section>
  );
}
