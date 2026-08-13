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

export type LangCode = "ru" | "uz" | "en";
// Переводы по языкам; базовые title/lead/body — язык-фолбэк.
export type ArticleTranslations = Partial<Record<LangCode, { title: string; lead: string; body: string }>>;

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
  // Публичный адрес материала: в slug лежит короткий идентификатор (/n/08121429).
  // Исходная транслитерация остаётся в fullSlug — по ней открываются ссылки,
  // разосланные до перехода на короткие адреса.
  fullSlug?: string;
  title: string;
  lead: string; // dek / краткое описание
  body: string; // markdown-ish plain blocks separated by \n\n
  translations?: ArticleTranslations; // переводы title/lead/body по языкам
  aiSummary: string; // AI-Саммари блок
  cover: string;
  videoUrl?: string; // lead video; if set, the article is "video-first"
  categorySlug: string;
  tags: string[];
  authorName: string;
  authorUserId?: string; // AppUser.id владельца (правка/удаление/предпросмотр)
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
