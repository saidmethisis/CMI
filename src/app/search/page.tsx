import { Suspense } from "react";
import { listPublished, localizeList } from "@/lib/store";
import { serverT } from "@/lib/i18n-server";
import SearchClient from "./SearchClient";

export async function generateMetadata() {
  const { t } = await serverT();
  return { title: t("nav.search") };
}
export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const { t, lang } = await serverT();
  // pass a lightweight index to the client for instant filtering
  const index = localizeList(await listPublished(), lang).map((a) => ({
    slug: a.slug,
    title: a.title,
    lead: a.lead,
    tags: a.tags,
    category: a.categorySlug,
    cover: a.cover,
    reading: a.readingMinutes,
    views: a.views,
    createdAt: a.createdAt,
  }));
  return (
    <Suspense fallback={<div className="container-content py-10 text-center text-black/50">{t("misc.loading")}</div>}>
      <SearchClient index={index} />
    </Suspense>
  );
}
