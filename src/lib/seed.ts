import type {
  Article,
  Category,
  Story,
  Instrument,
  BusinessAccount,
  AccreditationRequest,
  AdBanner,
} from "./types";

export const categories: Category[] = [
  { slug: "tech", name: "Технологии", nameUz: "Texnologiya", nameEn: "Tech", color: "#2563eb", order: 1 },
  { slug: "startups", name: "Стартапы", nameUz: "Startaplar", nameEn: "Startups", color: "#7c3aed", order: 2 },
  { slug: "politics", name: "Политика", nameUz: "Siyosat", nameEn: "Politics", color: "#0891b2", order: 3 },
  { slug: "business", name: "Бизнес", nameUz: "Biznes", nameEn: "Business", color: "#16a34a", order: 4 },
  { slug: "diplomacy", name: "Дипломатия", nameUz: "Diplomatiya", nameEn: "Diplomacy", color: "#c2410c", order: 5 },
  { slug: "markets", name: "Рынки", nameUz: "Bozorlar", nameEn: "Markets", color: "#db2777", order: 6 },
  { slug: "finance", name: "Финансы", nameUz: "Moliya", nameEn: "Finance", color: "#ca8a04", order: 7 },
];

const img = (id: number) => `https://picsum.photos/seed/aktiv${id}/1200/675`;

export const stories: Story[] = [
  { id: "s1", categorySlug: "tech", title: "AI-регуляции 2026", image: img(11), articleSlug: "ai-regulation-2026" },
  { id: "s2", categorySlug: "startups", title: "Раунд $40M", image: img(12), articleSlug: "uzbek-fintech-series-b" },
  { id: "s3", categorySlug: "politics", title: "Саммит ШОС", image: img(13), articleSlug: "sco-summit-outcomes" },
  { id: "s4", categorySlug: "markets", title: "Нефть растёт", image: img(14), articleSlug: "oil-rally-continues" },
  { id: "s5", categorySlug: "diplomacy", title: "Торговый пакт", image: img(15), articleSlug: "regional-trade-pact" },
  { id: "s6", categorySlug: "business", title: "IPO года", image: img(16), articleSlug: "biggest-ipo-of-year" },
];

const lorem = (topic: string) =>
  [
    `${topic} становится определяющей темой делового сезона. Аналитики отмечают, что происходящие изменения затрагивают не только крупных игроков, но и малый бизнес, вынужденный адаптировать стратегию под новую реальность.`,
    `«Мы наблюдаем структурный сдвиг, а не временную коррекцию», — говорит источник в отрасли. Ключевые показатели указывают на устойчивость тренда в среднесрочной перспективе.`,
    `Эксперты выделяют три фактора влияния: технологическую трансформацию, изменение регуляторной среды и приток частного капитала. Каждый из них по отдельности значим, а их сочетание усиливает эффект.`,
    `Что это означает для читателя-предпринимателя: окно возможностей открыто, но требует быстрых и выверенных решений. Редакция продолжит следить за развитием ситуации.`,
  ].join("\n\n");

let n = 100;
const mk = (a: Partial<Article> & Pick<Article, "slug" | "title" | "categorySlug">): Article => ({
  id: `a${n++}`,
  lead: a.lead ?? "Краткое описание материала для карточки и мета-тегов.",
  body: a.body ?? lorem(a.title),
  aiSummary:
    a.aiSummary ??
    `• Главное: ${a.title.toLowerCase()} влияет на рынок.\n• Контекст: тренд устойчив в среднесрочной перспективе.\n• Вывод: окно возможностей для бизнеса открыто, но требует быстрых решений.`,
  cover: a.cover ?? img(n),
  tags: a.tags ?? ["аналитика", "экономика"],
  authorName: a.authorName ?? "Редакция Aktiv",
  authorKind: a.authorKind ?? "editorial",
  company: a.company,
  createdAt: a.createdAt ?? new Date(Date.now() - Math.random() * 6e8).toISOString(),
  readingMinutes: a.readingMinutes ?? 3 + (n % 5),
  premium: a.premium ?? false,
  pinned: a.pinned ?? false,
  status: a.status ?? "published",
  views: a.views ?? Math.floor(Math.random() * 40000),
  comments: a.comments ?? [],
  ...a,
});

export const seedArticles: Article[] = [
  mk({
    slug: "ai-regulation-2026",
    title: "Как новые AI-регуляции 2026 меняют правила для стартапов",
    categorySlug: "tech",
    tags: ["AI", "регулирование", "стартапы"],
    pinned: true,
    readingMinutes: 6,
    views: 51200,
    comments: [
      { id: "c1", author: "Дилшод", body: "Наконец-то внятный разбор темы.", createdAt: new Date().toISOString(), status: "approved" },
    ],
  }),
  mk({ slug: "uzbek-fintech-series-b", title: "Узбекский финтех привлёк $40M в раунде Series B", categorySlug: "startups", tags: ["финтех", "инвестиции"], premium: true, views: 38400 }),
  mk({ slug: "sco-summit-outcomes", title: "Итоги саммита: что означают договорённости для региона", categorySlug: "politics", tags: ["дипломатия", "регион"], views: 29100, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }),
  mk({ slug: "oil-rally-continues", title: "Ралли на рынке нефти продолжается третью неделю", categorySlug: "markets", tags: ["нефть", "сырьё"], views: 22300, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" }),
  mk({ slug: "regional-trade-pact", title: "Региональный торговый пакт: выгоды и риски", categorySlug: "diplomacy", tags: ["торговля"], premium: true, views: 18700 }),
  mk({ slug: "biggest-ipo-of-year", title: "Крупнейшее IPO года: как разместилась компания", categorySlug: "business", tags: ["IPO", "рынки"], views: 41000 }),
  mk({ slug: "cloud-infra-boom", title: "Бум облачной инфраструктуры в Центральной Азии", categorySlug: "tech", tags: ["облака", "инфраструктура"], views: 15600, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" }),
  mk({ slug: "green-bonds-rise", title: "Зелёные облигации: новый класс активов набирает вес", categorySlug: "finance", tags: ["ESG", "облигации"], views: 12400 }),
  mk({ slug: "retail-ecom-shift", title: "Ритейл уходит в онлайн: цифры и прогнозы", categorySlug: "business", tags: ["ритейл", "e-commerce"], views: 9800 }),
  mk({ slug: "crypto-regulation-draft", title: "Проект крипто-регулирования вынесен на обсуждение", categorySlug: "markets", tags: ["крипто", "регулирование"], premium: true, views: 27300 }),
  // A PR piece pending moderation + a UGC piece in review (for admin queue demo)
  mk({
    slug: "pr-neo-bank-launch",
    title: "Neo Bank запускает мультивалютные счета для бизнеса",
    categorySlug: "finance",
    authorKind: "pr",
    authorName: "Пресс-служба Neo Bank",
    company: "Neo Bank",
    status: "review",
    tags: ["PR", "финтех"],
  }),
  mk({
    slug: "ugc-founder-diary",
    title: "Дневник основателя: первые 100 дней после запуска",
    categorySlug: "startups",
    authorKind: "ugc",
    authorName: "Азиз Каримов",
    status: "review",
    tags: ["опыт", "founder"],
  }),
];

export const instruments: Instrument[] = [
  { symbol: "UZSE", name: "UZ Composite", price: 512.34, changePct: 1.24, kind: "index" },
  { symbol: "S&P 500", name: "S&P 500", price: 5921.4, changePct: -0.42, kind: "index" },
  { symbol: "BTC", name: "Bitcoin", price: 98230, changePct: 2.81, kind: "crypto" },
  { symbol: "ETH", name: "Ethereum", price: 3410, changePct: 1.05, kind: "crypto" },
  { symbol: "USD/UZS", name: "Доллар", price: 12890, changePct: 0.12, kind: "currency" },
  { symbol: "BRENT", name: "Brent", price: 82.15, changePct: 1.9, kind: "stock" },
];

export const businessAccount: BusinessAccount = {
  id: "biz1",
  company: "Neo Bank",
  tier: "Premium",
  publicationsLimit: 10,
  publicationsUsed: 6,
  verified: true,
};

export const accreditationRequests: AccreditationRequest[] = [
  { id: "r1", name: "GreenTech LLC", type: "business", detail: "Хочет доступ к PR-кабинету, тариф Partner", status: "pending" },
  { id: "r2", name: "Малика Юсупова", type: "author", detail: "CV + 3 публикации в отраслевых СМИ", status: "pending" },
  { id: "r3", name: "Uztelecom", type: "business", detail: "Продление аккредитации", status: "approved" },
];

export const adBanners: AdBanner[] = [
  { id: "ad1", slot: "top", title: "Payme для бизнеса — 0% первый месяц", url: "#", active: true, frequency: 3, impressions: 15400 },
  { id: "ad2", slot: "in-article", title: "Курс «Финмодель за выходные»", url: "#", active: true, frequency: 2, impressions: 8900 },
  { id: "ad3", slot: "sidebar", title: "Uzum Business — эквайринг", url: "#", active: false, frequency: 5, impressions: 0 },
];
