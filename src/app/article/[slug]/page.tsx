import { permanentRedirect, notFound } from "next/navigation";
import { getArticle } from "@/lib/store";

// Старый адрес статьи: /article/ugc-длинная-транслитерация-msr3zo8g9e51
//
// Материалы переехали на короткие адреса вида /n/08121429 — длинная ссылка
// занимала в мессенджере три строки. Но разосланные раньше ссылки, закладки и
// то, что уже попало в поисковую выдачу, обязаны продолжать работать.
//
// Поэтому здесь постоянное перенаправление (301): читатель попадает на статью,
// а поисковик переносит на новый адрес накопленный вес старого и убирает
// прежнюю ссылку из индекса. Временное (302) этого не делает — в выдаче
// остались бы обе, и они конкурировали бы между собой.
export const dynamic = "force-dynamic";

export default async function LegacyArticleUrl({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getArticle(slug).catch(() => null);
  if (!a) notFound();
  permanentRedirect(`/n/${a.slug}`);
}
