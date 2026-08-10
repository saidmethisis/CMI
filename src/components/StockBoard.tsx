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

export default function StockBoard({ initial }: { initial?: { data: StockQuote[]; updatedAt: string; source: string } }) {
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
        <h2 className="font-serif text-lg font-bold">{t("stock.title")}</h2>
        <span className="ml-auto text-xs text-black/60 dark:text-white/65">
          {t("w.source")}:{" "}
          <a href={SOURCE_URL} target="_blank" rel="noopener nofollow" className="font-semibold hover:underline">{SOURCE_NAME}</a>
          {updatedAt && ` · ${t("w.updated")}: ${new Date(updatedAt).toLocaleString(loc, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
        </span>
      </div>

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
                    {/* Изменение — ровно то, что отдала биржа: направление и
                        величина. Проценты не считаем: источник даёт изменение
                        к другой базе, и наш расчёт был бы выдумкой. */}
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
    </section>
  );
}
