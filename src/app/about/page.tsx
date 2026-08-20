import Link from "next/link";
import LegalShell from "@/components/LegalShell";
import { ORG } from "@/lib/org";
import { serverT } from "@/lib/i18n-server";
import { getCategories } from "@/lib/store";
import { SITE_URL, SITE_NAME } from "@/lib/site";

// Страница «Об издании».
//
// Нужна не для красоты. Google решает, считать ли сайт настоящим изданием, по
// тому, может ли он понять, кто за ним стоит: есть ли рассказ о редакции, чем
// она занимается, по каким правилам работает и как с ней связаться. От этого
// зависит и попадание в новостную выдачу, и те самые быстрые ссылки под
// названием сайта в результатах поиска — Google берёт их из разделов, которые
// счёл важными, а «О сайте» у соседей по рынку в их числе.
//
// Здесь только проверяемые факты: реквизиты берутся из настроек, разделы — из
// базы. Ничего про редакцию, чего нельзя подтвердить, не пишем.
export async function generateMetadata() {
  const { t } = await serverT();
  return {
    title: t("about.title"),
    description: t("about.lead"),
    alternates: { canonical: `${SITE_URL}/about` },
  };
}

export default async function AboutPage() {
  const { t, lang } = await serverT();
  const categories = await getCategories();

  // Разметка для поисковика: страница описывает саму организацию.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: t("about.title"),
    url: `${SITE_URL}/about`,
    mainEntity: {
      "@type": "NewsMediaOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: t("about.lead"),
      ...(ORG.founder ? { founder: { "@type": "Organization", name: ORG.founder } } : {}),
      ...(ORG.email ? { email: ORG.email } : {}),
      ...(ORG.phone ? { telephone: ORG.phone } : {}),
      ...(ORG.address ? { address: { "@type": "PostalAddress", streetAddress: ORG.address, addressCountry: "UZ" } } : {}),
      knowsLanguage: ["ru", "uz", "en"],
    },
  };

  return (
    <LegalShell title={t("about.title")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p className="text-lg">{t("about.lead")}</p>

      <h2>{t("about.h1")}</h2>
      <p>{t("about.what")}</p>

      <h2>{t("about.h2")}</h2>
      <ul>
        <li>{t("about.rule1")}</li>
        <li>{t("about.rule2")}</li>
        <li>{t("about.rule3")}</li>
        <li>{t("about.rule4")}</li>
      </ul>

      <h2>{t("about.h3")}</h2>
      {/* Разделы перечислены ссылками: так поисковик видит структуру издания,
          а читатель со страницы «Об издании» попадает прямо в интересующее. */}
      <ul>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={lang === "ru" ? `/category/${c.slug}` : `/${lang}/category/${c.slug}`}>
              {(c as { nameRu?: string; name?: string }).name ?? c.slug}
            </Link>
          </li>
        ))}
      </ul>

      <h2>{t("about.h4")}</h2>
      <p>
        {t("about.contact")}
        {ORG.email && <> <a href={`mailto:${ORG.email}`}>{ORG.email}</a></>}
        {ORG.phone && <>, {ORG.phone}</>}
      </p>
      <p>
        {t("about.imprint")}{" "}
        <Link href={lang === "ru" ? "/legal" : `/${lang}/legal`}>{t("footer.imprint")}</Link>
      </p>
    </LegalShell>
  );
}
