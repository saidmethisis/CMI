// Server component: разделы кабинета компании. Статистика/аналитика/пресс-релизы/
// авторы — из РЕАЛЬНЫХ данных компании. Медиатека/реклама/SEO — честные заглушки
// (нет файлового хранилища / внешних интеграций), без выдуманных цифр.
import Link from "next/link";
import CompanyRequests from "./CompanyRequests";
import StoryUploader from "@/components/StoryUploader";
import type { CompanyComment } from "@/lib/store";

type T = (k: string) => string;
type Art = { slug: string; title: string; views: number; status: string };
type Data = {
  stats: { total: number; published: number; review: number; views: number };
  topArts: Art[];
  catBreakdown: { name: string; count: number; views: number }[];
  press: { slug: string; title: string; date: string; status: string }[];
  authors: { id: string; slug: string; name: string; position: string; verified: boolean }[];
};

const chip = (tone: string) => `inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`;
const TONE: Record<string, string> = {
  published: "bg-up/12 text-up", review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  returned: "bg-down/12 text-down", draft: "bg-black/8 text-black/55 dark:bg-white/10 dark:text-white/60",
};
const nf = (n: number) => n.toLocaleString("ru-RU");
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const th = "px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40";
const td = "px-3 py-2.5 border-t border-black/[0.04] dark:border-white/[0.06]";

function Panel({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="card overflow-hidden">
      <h2 className="border-b border-black/5 px-5 py-3 font-semibold dark:border-white/10">{title}</h2>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-black/50 dark:text-white/50">{children}</p>;
}

export default function CompanyDemoSections({ keys, t, comments, companyId, data }: { keys: string[]; t: T; comments: CompanyComment[]; companyId: string; data: Data }) {
  const has = (k: string) => keys.includes(k);
  const maxCatViews = Math.max(1, ...data.catBreakdown.map((c) => c.views));

  return (
    <>
      {has("press") && (
        <Panel id="press" title={t("co.press")}>
          {data.press.length === 0 ? <Empty>Пока нет публикаций компании.</Empty> : (
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {data.press.map((r) => (
                <div key={r.slug} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <Link href={`/article/${r.slug}`} className="flex-1 hover:text-accent">{r.title}</Link>
                  <span className="shrink-0 text-xs text-black/45 dark:text-white/45">{fmtDate(r.date)}</span>
                  <span className={chip(TONE[r.status] ?? TONE.draft)}>{t(`status.${r.status}`)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {has("media") && (
        <Panel id="media" title={t("co.media")}>
          <div className="mb-5">
            <h3 className="mb-1 text-sm font-bold">Добавить стори</h3>
            <p className="mb-3 text-xs text-black/45 dark:text-white/45">Вертикальная стори появится в ленте сторис на главной от имени компании.</p>
            <StoryUploader />
          </div>
          <h3 className="mb-1 text-sm font-bold">Медиатека файлов</h3>
          <Empty>Хранилище документов и изображений подключается отдельно. Пока доступна загрузка сторис и обложек прямо в материалах.</Empty>
        </Panel>
      )}

      {has("authors") && (
        <Panel id="authors" title={t("co.authors")}>
          {data.authors.length === 0 ? (
            <Empty>У компании пока нет прикреплённых авторов. Добавить их можно в админ-панели → Авторы.</Empty>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {data.authors.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-bold text-white">{a.name.charAt(0)}</span>
                  <Link href={`/author/${a.slug}`} className="flex-1 font-medium hover:text-accent">{a.name}</Link>
                  {a.position && <span className="text-xs text-black/50 dark:text-white/50">{a.position}</span>}
                  {a.verified && <span className="chip !py-0 text-[10px] !border-up/40 text-up">проверен</span>}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {has("statistics") && (
        <Panel id="statistics" title={t("co.statistics")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Всего материалов", nf(data.stats.total)], ["Опубликовано", nf(data.stats.published)], ["На проверке", nf(data.stats.review)], ["Суммарные просмотры", nf(data.stats.views)]].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-black/5 p-4 dark:border-white/10"><div className="text-2xl font-bold tabular-nums">{v}</div><div className="text-xs text-black/45 dark:text-white/45">{l}</div></div>
            ))}
          </div>
        </Panel>
      )}

      {has("analytics") && (
        <Panel id="analytics" title={t("co.analytics")}>
          {data.catBreakdown.length === 0 ? <Empty>Недостаточно данных для аналитики.</Empty> : (
            <>
              <h3 className="mb-2 text-sm font-bold">Просмотры по рубрикам</h3>
              <div className="mb-5 space-y-2.5">
                {data.catBreakdown.map((c) => (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium">{c.name}</span><span className="tabular-nums text-black/50 dark:text-white/50">{nf(c.views)} · {c.count} мат.</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, (c.views / maxCatViews) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
              <h3 className="mb-2 text-sm font-bold">Топ материалы</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={th}>Материал</th><th className={`${th} text-right`}>Просмотры</th></tr></thead>
                  <tbody>{data.topArts.map((a) => <tr key={a.slug}><td className={td}><Link href={`/article/${a.slug}`} className="hover:text-accent">{a.title}</Link></td><td className={`${td} text-right tabular-nums`}>{nf(a.views)}</td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}
        </Panel>
      )}

      {has("ads") && (
        <Panel id="ads" title={t("co.ads")}>
          <Empty>Рекламные кампании подключаются через редакцию. Оставьте заявку в разделе «Заявки» или напишите менеджеру — здесь появится статистика ваших размещений.</Empty>
        </Panel>
      )}

      {has("seo") && (
        <Panel id="seo" title={t("co.seo")}>
          <Empty>SEO-статистика (позиции по запросам, трафик из поиска) подключается через интеграцию с поисковыми сервисами. Пока не подключено.</Empty>
        </Panel>
      )}

      {has("comments") && (
        <Panel id="comments" title={t("co.comments")}>
          {comments.length === 0 && <Empty>Пока нет комментариев к материалам компании.</Empty>}
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {comments.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                <span className="font-medium">{c.author}</span>
                <span className="min-w-0 flex-1 truncate text-black/60 dark:text-white/60">{c.body}</span>
                <span className={chip(TONE[c.status] ?? "bg-amber-500/15 text-amber-600 dark:text-amber-400")}>{c.status}</span>
                <div className="flex w-full items-center gap-2 pl-0 sm:w-auto sm:pl-3">
                  <span className="max-w-[220px] truncate text-xs text-black/45 dark:text-white/45">→ {c.articleTitle}</span>
                  <Link href={`/article/${c.articleSlug}#c-${c.id}`} className="btn-ghost shrink-0 text-xs">{t("co.open")}</Link>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {has("requests") && (
        <Panel id="requests" title={t("co.requests")}>
          <CompanyRequests companyId={companyId} />
        </Panel>
      )}

      {/* прочие включённые разделы без спец-обработки */}
      {keys.filter((k) => !["dashboard", "news", "press", "media", "authors", "statistics", "analytics", "ads", "seo", "comments", "requests", "settings"].includes(k)).map((k) => (
        <Panel key={k} id={k} title={t(`co.${k}`)}>
          <Empty>Раздел доступен этой компании.</Empty>
        </Panel>
      ))}
    </>
  );
}
