import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { IS_STAGING } from "@/lib/env";

// Считается по запросу, а не на сборке. APP_ENV задаётся в рантайме (docker compose),
// а при статической генерации его ещё нет — стейджинг тогда получал бы боевой
// robots.txt с «Allow: /» и ссылкой на sitemap продакшена.
export const dynamic = "force-dynamic";

const PRIVATE = ["/admin", "/business", "/author-panel", "/company", "/account", "/api/"];
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "Google-Extended", "PerplexityBot", "Applebot-Extended", "CCBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "Bytespider", "Amazonbot", "YandexAdditional", "cohere-ai", "Meta-ExternalAgent", "Diffbot"];

export default function robots(): MetadataRoute.Robots {
  // Стейджинг закрыт от индексации целиком: тестовая копия в выдаче — это дубль
  // контента, который отбирает позиции у боевого сайта.
  if (IS_STAGING) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE }, // AI crawlers may read public content
    ],
    // Две карты: обычная перечисляет весь сайт, новостная — только материалы
    // за последние двое суток, по формату Google News. Робот новостей ходит в
    // неё отдельно и заметно чаще.
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
    host: SITE_URL,
  };
}
