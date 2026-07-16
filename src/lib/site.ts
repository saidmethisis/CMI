// Canonical site URL — set SITE_URL in .env for production (fixes localhost in sitemap/RSS/OG).
export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "Asosiy Aktiv";
export const SITE_DESC = "Деловое медиа нового поколения: бизнес, технологии, дипломатия и политика.";
