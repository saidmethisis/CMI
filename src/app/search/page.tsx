import { Suspense } from "react";
import { listPublished } from "@/lib/store";
import SearchClient from "./SearchClient";

export const metadata = { title: "Поиск" };
export const dynamic = "force-dynamic";

export default async function SearchPage() {
  // pass a lightweight index to the client for instant filtering
  const index = (await listPublished()).map((a) => ({
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
    <Suspense fallback={<div className="container-content py-10 text-center text-black/50">Загрузка…</div>}>
      <SearchClient index={index} />
    </Suspense>
  );
}
