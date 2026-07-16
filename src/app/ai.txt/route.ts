import { SITE_URL } from "@/lib/site";

// ai.txt — content-usage policy for AI systems
export function GET() {
  const body = [
    "# ai.txt — политика использования контента AI-системами",
    "User-Agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /account",
    "Content-Usage: search, summarization, citation, training-allowed",
    "Attribution: required",
    "Contact: businessrobotsai@gmail.com",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Feed: ${SITE_URL}/feed.xml`,
    `LLMs: ${SITE_URL}/llms.txt`,
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=86400" } });
}
