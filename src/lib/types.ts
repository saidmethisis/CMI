// ── Domain types (merged from both TZ documents) ──────────────────────────────

export type Role =
  | "reader"
  | "author" // UGC
  | "business" // PR partner
  | "admin";

export type ArticleStatus =
  | "draft"
  | "review" // на модерации
  | "returned" // возвращено с правками
  | "published"
  | "rejected"
  | "unpublished";

export type ArticleKind = "editorial" | "ugc" | "pr";

export interface Category {
  slug: string;
  name: string;
  nameUz?: string;
  nameEn?: string;
  color: string;
  order?: number;
  visible?: boolean;
}

export interface Story {
  id: string;
  categorySlug: string;
  title: string;
  image: string; // URL or data-URI
  articleSlug?: string | null;
  order?: number;
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  status: "approved" | "pending";
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  lead: string; // dek / краткое описание
  body: string; // markdown-ish plain blocks separated by \n\n
  aiSummary: string; // AI-Саммари блок
  cover: string;
  videoUrl?: string; // lead video; if set, the article is "video-first"
  categorySlug: string;
  tags: string[];
  authorName: string;
  authorKind: ArticleKind;
  authorSocials?: { label: string; url: string }[];
  company?: string; // for PR
  createdAt: string;
  readingMinutes: number;
  premium: boolean; // paywall
  pinned: boolean; // "Asosiy Aktiv" топ-подборка
  status: ArticleStatus;
  views: number;
  comments: Comment[];
}

export interface Instrument {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  kind: "index" | "stock" | "crypto" | "currency";
}

export type Tier = "Standard" | "Premium" | "Partner";

export interface BusinessAccount {
  id: string;
  company: string;
  tier: Tier;
  publicationsLimit: number;
  publicationsUsed: number;
  verified: boolean;
}

export interface AccreditationRequest {
  id: string;
  name: string;
  type: "business" | "author";
  detail: string;
  status: "pending" | "approved" | "blocked";
}

export interface AdBanner {
  id: string;
  slot: "top" | "in-article" | "sidebar";
  title: string;
  url: string;
  active: boolean;
  frequency: number; // показов на пользователя
  impressions: number;
}
