import { ownArticles } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import { requirePermission } from "@/lib/guard";
import AuthorSections from "./AuthorSections";

export const metadata = { title: "Кабинет автора" };
export const dynamic = "force-dynamic";

export default async function AuthorPanelPage() {
  const { user } = await requirePermission("news.create", "/author-panel");
  const { t } = await serverT();
  const mine = await ownArticles(user!.id);
  const articles = mine.map((a) => ({ id: a.id, slug: a.slug, title: a.title, lead: a.lead, body: a.body, categorySlug: a.categorySlug, status: a.status, createdAt: a.createdAt, views: a.views }));
  return (
    <div className="container-content py-6">
      <h1 className="mb-4 font-serif text-2xl font-bold">{t("author.title")}</h1>
      <AuthorSections articles={articles} name={user!.displayName || user!.name} />
    </div>
  );
}
