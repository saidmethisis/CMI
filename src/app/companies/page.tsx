import Link from "next/link";
import { publicCompanies } from "@/lib/rbac-store";
import { serverT, langAlternates } from "@/lib/i18n-server";
import Cover from "@/components/Cover";

// Каталог бизнеса (ТЗ, блок 1.2 — вкладка «Компании» в разделе «Главное»).
// Публичная страница: до этого компании существовали только внутри кабинета,
// и читатель не мог посмотреть, кто публикуется на площадке.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("co.title"), description: t("co.subtitle"), alternates: await langAlternates("/companies") };
}

export default async function CompaniesPage() {
  const { t } = await serverT();
  const items = await publicCompanies().catch(() => []);

  return (
    <div className="container-content py-6">
      <h1 className="mb-1 font-serif text-3xl font-bold">{t("co.title")}</h1>
      <p className="mb-6 text-black/60 dark:text-white/60">{t("co.subtitle")}</p>

      {items.length === 0 ? (
        <p className="card p-6 text-center text-black/60 dark:text-white/65">{t("co.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link key={c.slug} href={`/companies/${c.slug}`} className="card card-hover flex gap-3 p-4">
              {c.logo && <Cover src={c.logo} alt="" width={112} height={112} sizes="56px" className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-serif text-lg font-bold">{c.name}</span>
                  {c.verified && <span className="chip !border-up/40 !py-0 text-[10px] text-up">✓</span>}
                </div>
                {c.about && <p className="mt-0.5 line-clamp-2 text-sm text-black/60 dark:text-white/65">{c.about}</p>}
                <p className="mt-1 text-xs text-black/55 dark:text-white/55">{c.materials} {t("co.materials")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
