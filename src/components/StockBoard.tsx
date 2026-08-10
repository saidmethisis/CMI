"use client";
import { useCallback, useEffect, useState } from "react";
import { SOURCE_NAME, SOURCE_URL, type StockQuote } from "@/lib/stock";
import { useI18n } from "@/lib/i18n";
import ScrollRow from "./ScrollRow";

// Котировки Республиканской фондовой биржи — карточками в горизонтальной прокрутке.
// Данные приходят с сервера уже отрендеренными; клиент лишь освежает их со временем.
// Если котировок нет (нет ключа API или биржа недоступна) — блок не рисуется вовсе:
// пустая рамка на финансовом сайте выглядит как поломка, а выдуманные цифры
// показывать нельзя.
const REFRESH_MS = 15 * 60 * 1000;

// compact — вид для узкой правой колонки: вертикальный список вместо карусели.
// Карточки шириной 256 пикселей в колонку 300 не помещаются с полями, а
// горизонтальная прокрутка внутри вертикальной ленты раздражает.
export default function StockBoard({ initial, compact = false }: { initial?: { data: StockQuote[]; updatedAt: string; source: string }; compact?: boolean }) {
  const { t, lang } = useI18n();
  const loc = lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU";
  const [rows, setRows] = useState<StockQuote[]>(initial?.data ?? []);
  const [updatedAt, setUpdatedAt] = useState(initial?.updatedAt ?? "");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/stock", { cache: "no-store" });
      const j = await r.json();
      if (Array.isArray(j.data) && j.data.length) { setRows(j.data); setUpdatedAt(j.updatedAt ?? ""); }
    } catch { /* оставляем прошлый снимок */ }
  }, []);

  // Сервер уже сходил за котировками. Если он ответил «unavailable» — ключа нет
  // или биржа недоступна, и клиентский запрос вернёт ровно то же самое. Тогда не
  // дёргаем сеть вовсе: иначе каждый читатель делал бы лишний запрос ради блока,
  // который всё равно не показывается.
  const offline = !initial?.data?.length && initial?.source === "unavailable";

  useEffect(() => {
    if (offline) return;
    if (!initial?.data?.length) load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, offline]);

  if (!rows.length) return null;

  const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  return (
    <section className="card overflow-hidden" aria-label={t("stock.title")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-black/5 px-4 py-3 dark:border-white/10">
        <h2 className={`font-serif font-bold ${compact ? "text-sm" : "text-lg"}`}>{t("stock.title")}</h2>
        <span className="ml-auto text-xs text-black/60 dark:text-white/65">
          {t("w.source")}:{" "}
          <a href={SOURCE_URL} target="_blank" rel="noopener nofollow" className="font-semibold hover:underline">{SOURCE_NAME}</a>
          {updatedAt && ` · ${t("w.updated")}: ${new Date(updatedAt).toLocaleString(loc, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
        </span>
      </div>

      {compact ? (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {rows.slice(0, 8).map((q) => (
            <li key={q.ticker || q.name} className="flex items-baseline gap-2 px-4 py-2 text-sm">
              <span className="w-16 shrink-0 truncate text-xs font-bold uppercase text-black/55 dark:text-white/55" title={q.name}>
                {q.ticker || q.name}
              </span>
              <span className="flex-1 truncate text-xs text-black/60 dark:text-white/65">{q.name}</span>
              <span className="shrink-0 font-semibold tabular-nums">{fmt(q.last ?? q.close)}</span>
              {q.change !== null && q.direction && (
                <span className={`shrink-0 text-xs font-semibold ${q.direction === "up" ? "text-up" : "text-down"}`}>
                  {q.direction === "up" ? "▲" : "▼"}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
      <div className="p-4">
        <ScrollRow gap="gap-3">
          {rows.map((q) => (
            <article key={q.ticker || q.name} className="w-64 shrink-0 rounded-xl border border-black/[0.07] p-4 dark:border-white/10">
              <h3 className="truncate font-semibold text-brand dark:text-white/90" title={q.name}>{q.name}</h3>
              {q.ticker && <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-black/45 dark:text-white/45">{q.ticker}</div>}
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-black/60 dark:text-white/65">{t("stock.close")}</dt>
                  <dd className="font-semibold tabular-nums">{fmt(q.close)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-black/60 dark:text-white/65">{t("stock.last")}</dt>
                  <dd className="font-semibold tabular-nums">
                    {fmt(q.last)}
                    {q.change !== null && q.direction && (
                      <span className={`ml-1 text-xs font-semibold ${q.direction === "up" ? "text-up" : "text-down"}`}>
                        {q.direction === "up" ? "▲" : "▼"} {fmt(q.change)}
                      </span>
                    )}
                  </dd>
                </div>
                {q.lastDate && (
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-black/60 dark:text-white/65">{t("stock.lastDate")}</dt>
                    <dd className="tabular-nums">{q.lastDate}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </ScrollRow>
      </div>
      )}
    </section>
  );
}
