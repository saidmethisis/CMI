import { getCategories, getStories, categoryCounts } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import CategoryManager from "./CategoryManager";
import StoryManager from "./StoryManager";

export const metadata = { title: "Admin — Категории" };
export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const [categories, stories, counts] = await Promise.all([getCategories(), getStories(), categoryCounts()]);
  const { t } = await serverT();
  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl font-bold">{t("anav.categories")}</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryManager categories={categories} counts={counts} />
        <StoryManager stories={stories} categories={categories} />
      </div>
    </div>
  );
}
