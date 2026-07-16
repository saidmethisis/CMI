import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PRIVATE = ["/admin", "/business", "/author-panel", "/company", "/account", "/api/"];
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "Google-Extended", "PerplexityBot", "Applebot-Extended", "CCBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "Bytespider", "Amazonbot", "YandexAdditional", "cohere-ai", "Meta-ExternalAgent", "Diffbot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE }, // AI crawlers may read public content
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
