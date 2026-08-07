import Link from "next/link";
import { publicAuthors } from "@/lib/rbac-store";
import { serverT, langAlternates } from "@/lib/i18n-server";
import Cover from "@/components/Cover";

// Список авторов и UGC-креаторов (ТЗ, блок 1.2 — вкладка «Авторы»).
// Отдельные страницы авторов были и раньше, но попасть на них можно было
// только из статьи: общего входа не существовало.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("au.title"), description: t("au.subtitle"), alternates: await langAlternates("/authors") };
}

export default async function AuthorsPage() {
  const { t } = await serverT();
  const items = await publicAuthors().catch(() => []);

  return (
    <div className="container-content py-6">
      <h1 className="mb-1 font-serif text-3xl font-bold">{t("au.title")}</h1>
      <p className="mb-6 text-black/60 dark:text-white/60">{t("au.subtitle")}</p>

      {items.length === 0 ? (
        <p className="card p-6 text-center text-black/60 dark:text-white/65">{t("au.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link key={a.slug} href={`/author/${a.slug}`} className="card card-hover flex items-center gap-3 p-4">
              {a.avatar && <Cover src={a.avatar} alt="" width={112} height={112} sizes="56px" className="h-14 w-14 shrink-0 rounded-full object-cover" />}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold">{a.name}</span>
                  {a.verified && <span className="chip !border-up/40 !py-0 text-[10px] text-up">✓</span>}
                </div>
                {a.position && <p className="truncate text-sm text-black/60 dark:text-white/65">{a.position}</p>}
                <p className="mt-0.5 text-xs text-black/55 dark:text-white/55">{a.materials} {t("co.materials")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
