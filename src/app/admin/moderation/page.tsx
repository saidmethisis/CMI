import { moderationQueue } from "@/lib/store";
import { categories } from "@/lib/seed";
import { serverT } from "@/lib/i18n-server";
import ModerationRow from "./ModerationRow";

export const metadata = { title: "Admin — Модерация" };
export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const { t } = await serverT();
  const queue = await moderationQueue();
  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold">{t("adm.modTitle")}</h1>
      <p className="mb-5 text-sm text-black/50 dark:text-white/50">{t("adm.modSubtitle")}</p>

      {queue.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-lg font-semibold">{t("adm.modEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((a) => (
            <ModerationRow
              key={a.id}
              id={a.id}
              title={a.title}
              lead={a.lead}
              kind={a.authorKind}
              author={a.company ?? a.authorName}
              category={categories.find((c) => c.slug === a.categorySlug)?.name ?? a.categorySlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
