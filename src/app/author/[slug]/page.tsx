import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthor, getCompany } from "@/lib/rbac-store";
import { followerCount } from "@/lib/follow";
import { listPublished, localizeList } from "@/lib/store";
import { serverT, langAlternates } from "@/lib/i18n-server";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import FollowButton from "@/components/FollowButton";
import Cover from "@/components/Cover";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await serverT();
  const a = await getAuthor(slug);
  if (!a) return { title: t("misc.author"), alternates: await langAlternates(`/author/${slug}`) };
  const p = a.profile as Record<string, string>;
  const name = `${a.firstName} ${a.lastName}`.trim();
  // Описание — из биографии автора; без него в выдаче показывался бы случайный
  // кусок разметки страницы.
  const description = (p.bio || [p.position, p.city].filter(Boolean).join(", ") || name).slice(0, 300);
  return {
    title: name,
    description,
    alternates: await langAlternates(`/author/${slug}`),
    openGraph: { type: "profile", title: name, description, url: `${SITE_URL}/author/${slug}`, ...(a.avatar ? { images: [a.avatar] } : {}) },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const a = await getAuthor(slug);
  if (!a) notFound();
  const { t, lang } = await serverT();
  const company = a.companyId ? await getCompany(a.companyId) : null;
  const p = a.profile as Record<string, string>;
  const [subs, published] = await Promise.all([followerCount("author", a.id), listPublished()]);
  const mine = localizeList(published, lang).filter((x) => x.authorName === `${a.firstName} ${a.lastName}`);
  const views = mine.reduce((s, x) => s + x.views, 0);
  const stats = [[t("ap.articles"), String(mine.length)], [t("ap.views"), views.toLocaleString("ru-RU")], [t("ap.subs"), subs.toLocaleString("ru-RU")], [t("ap.avgRead"), "4:12"]];
  const chips = (v?: string) => (v ? v.split(/[,;]/).map((x) => x.trim()).filter(Boolean) : []);

  // Разметка Schema.org: страница-профиль автора и сам автор как Person.
  // Поисковики и ИИ-ассистенты по ней связывают статьи с конкретным человеком —
  // без этого автор для них просто строка текста. Пустые поля не выводим:
  // незаполненное свойство в разметке хуже отсутствующего.
  const fullName = `${a.firstName} ${a.lastName}`.trim();
  const authorUrl = `${SITE_URL}/author/${a.slug}`;
  const sameAs = [p.website, p.linkedin, p.telegram && (p.telegram.startsWith("http") ? p.telegram : `https://t.me/${p.telegram.replace(/^@/, "")}`)]
    .filter((v): v is string => !!v && /^https?:\/\//.test(v));
  const person: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${authorUrl}#person`,
    name: fullName,
    url: authorUrl,
    ...(a.avatar ? { image: a.avatar.startsWith("http") ? a.avatar : `${SITE_URL}${a.avatar}` } : {}),
    ...(p.position ? { jobTitle: p.position } : {}),
    ...(p.bio ? { description: p.bio } : {}),
    ...(p.email ? { email: p.email } : {}),
    ...(chips(p.specialization).length ? { knowsAbout: chips(p.specialization) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(company ? { worksFor: { "@type": "Organization", name: company.name } } : { worksFor: { "@type": "NewsMediaOrganization", name: SITE_NAME, url: SITE_URL } }),
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: authorUrl,
    mainEntity: person,
    ...(mine.length
      ? {
          hasPart: mine.slice(0, 10).map((x) => ({
            "@type": "NewsArticle",
            headline: x.title,
            url: `${SITE_URL}/article/${x.slug}`,
            datePublished: x.createdAt,
            author: { "@id": `${authorUrl}#person` },
          })),
        }
      : {}),
  };

  return (
    <div className="container-content max-w-4xl py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* banner + header */}
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand to-brand-700" style={p.banner ? { backgroundImage: `url(${p.banner})`, backgroundSize: "cover" } : undefined} />
        <div className="flex flex-wrap items-center gap-4 p-5">
          <span className="-mt-14 grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-brand text-3xl font-bold text-white ring-4 ring-[var(--surface)] dark:ring-ink-surface">
            {a.avatar ? <Cover src={a.avatar} alt="" width={192} height={192} sizes="96px" className="h-full w-full object-cover" /> : a.firstName.charAt(0)}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold">{a.firstName} {a.lastName}</h1>
              {a.verifyStatus === "verified" && <span className="chip !border-up/40 !py-0.5 text-up">{t("a.verified")}</span>}
            </div>
            <p className="text-sm text-black/55 dark:text-white/55">{p.position}{company ? ` · ${company.name}` : ""}</p>
            <p className="text-xs text-black/60 dark:text-white/65">{[p.city, p.country].filter(Boolean).join(", ")}</p>
          </div>
          <FollowButton type="author" id={a.id} showCount={false} className="!py-2 text-sm" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([l, v]) => <div key={l} className="card p-4 text-center"><div className="text-xl font-bold">{v}</div><div className="text-xs text-black/60 dark:text-white/65">{l}</div></div>)}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="card p-5">
          <h2 className="mb-2 font-semibold">{t("ap.about")}</h2>
          <p className="text-sm text-black/70 dark:text-white/70">{p.bio || "—"}</p>
          {chips(p.specialization).length > 0 && (
            <><h3 className="mb-2 mt-4 text-sm font-semibold">{t("ap.spec")}</h3><div className="flex flex-wrap gap-2">{chips(p.specialization).map((c) => <span key={c} className="chip">{c}</span>)}</div></>
          )}
          {chips(p.skills).length > 0 && (
            <><h3 className="mb-2 mt-4 text-sm font-semibold">{t("ap.skills")}</h3><div className="flex flex-wrap gap-2">{chips(p.skills).map((c) => <span key={c} className="chip">{c}</span>)}</div></>
          )}
        </div>
        <aside className="card p-5">
          <h2 className="mb-3 font-semibold">{t("ap.contacts")}</h2>
          <ul className="space-y-1.5 text-sm">
            {[["Email", p.email], [t("ap.phone"), p.phone], ["Telegram", p.telegram], ["LinkedIn", p.linkedin], ["Website", p.website], [t("ap.langs"), p.languages], [t("ap.education"), p.education]].filter(([, v]) => v).map(([l, v]) => (
              <li key={l as string} className="flex justify-between gap-2"><span className="text-black/60 dark:text-white/65">{l}</span><span className="truncate font-medium">{v}</span></li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
