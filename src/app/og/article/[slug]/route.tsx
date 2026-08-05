import { OgCard, renderOg } from "@/lib/og";
import { getArticle, getCategories, localizedArticle } from "@/lib/store";
import { getLang } from "@/lib/i18n-server";
import { localizeName } from "@/lib/dictionaries";
import { guardRate } from "@/lib/rate-limit";

// Карточка статьи для соцсетей: /og/article/<slug>. Нужна там, где у материала
// нет своей обложки — иначе мессенджер показывает ссылку голым текстом.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await guardRate("og");
  if (limited) return limited;

  const { slug } = await params;
  // База может быть недоступна — карточка не тот повод, чтобы отдавать 500.
  const a = await getArticle(slug).catch(() => null);
  const lang = await getLang();
  const L = a ? localizedArticle(a, lang) : null;
  const cat = a ? (await getCategories().catch(() => [])).find((c) => c.slug === a.categorySlug) : undefined;

  return renderOg(
    <OgCard
      title={L?.title || "Asosiy Aktiv"}
      kicker={cat ? localizeName(lang, cat) : undefined}
      footer={a ? [a.company ?? a.authorName, new Date(a.createdAt).toLocaleDateString("ru-RU")].filter(Boolean).join(" · ") : undefined}
    />,
  );
}
