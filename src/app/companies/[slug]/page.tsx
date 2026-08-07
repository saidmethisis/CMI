import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany } from "@/lib/rbac-store";
import { listPublished, localizeList } from "@/lib/store";
import { serverT, langAlternates } from "@/lib/i18n-server";
import { SITE_URL } from "@/lib/site";
import Cover from "@/components/Cover";
import ArticleCard from "@/components/ArticleCard";

// Публичная карточка компании. Раньше компания существовала только внутри
// кабинета: читатель видел её имя в подписи к статье, но пойти было некуда.
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = await getCompany(slug).catch(() => null);
  if (!c) return { title: "—" };
  const p = c.profile as Record<string, string>;
  const description = (p.about ?? p.description ?? c.name).slice(0, 300);
  return {
    title: c.name,
    description,
    alternates: await langAlternates(`/companies/${slug}`),
    openGraph: { type: "profile", title: c.name, description, url: `${SITE_URL}/companies/${slug}` },
  };
}

export default async function CompanyPublicPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCompany(slug).catch(() => null);
  if (!c || !c.active) notFound();
  const { t, lang } = await serverT();
  const p = c.profile as Record<string, string>;
  const all = localizeList(await listPublished().catch(() => []), lang);
  const mine = all.filter((a) => a.company === c.name);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: c.name,
    url: `${SITE_URL}/companies/${slug}`,
    ...(p.logo ? { logo: p.logo.startsWith("http") ? p.logo : `${SITE_URL}${p.logo}` } : {}),
    ...(p.about ? { description: p.about } : {}),
    ...(p.website ? { sameAs: [p.website] } : {}),
    ...(p.email ? { email: p.email } : {}),
    ...(p.phone ? { telephone: p.phone } : {}),
  };

  const contacts = [["Email", p.email], [t("ap.phone"), p.phone], ["Website", p.website], ["Telegram", p.telegram]]
    .filter(([, v]) => v) as [string, string][];

  return (
    <div className="container-content max-w-4xl py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="card flex flex-wrap items-center gap-4 p-5">
        {p.logo && <Cover src={p.logo} alt="" width={160} height={160} sizes="80px" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl font-bold">{c.name}</h1>
            {c.verified && <span className="chip !border-up/40 !py-0.5 text-up">{t("a.verified")}</span>}
          </div>
          {(p.about || p.description) && <p className="mt-1 text-sm text-black/70 dark:text-white/70">{p.about || p.description}</p>}
          <p className="mt-1 text-xs text-black/55 dark:text-white/55">{mine.length} {t("co.materials")}</p>
        </div>
      </div>

      {contacts.length > 0 && (
        <div className="card mt-4 p-5">
          <h2 className="mb-3 font-semibold">{t("ap.contacts")}</h2>
          <ul className="space-y-1.5 text-sm">
            {contacts.map(([l, v]) => (
              <li key={l} className="flex justify-between gap-2">
                <span className="text-black/60 dark:text-white/65">{l}</span>
                <span className="truncate font-medium">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mine.length > 0 && (
        <>
          <h2 className="mb-4 mt-8 border-b-2 border-brand pb-1 font-serif text-2xl font-extrabold">{t("main.latest")}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {mine.slice(0, 12).map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>
        </>
      )}

      <p className="mt-8 text-sm">
        <Link href="/companies" className="font-semibold text-accent hover:underline">← {t("co.title")}</Link>
      </p>
    </div>
  );
}
