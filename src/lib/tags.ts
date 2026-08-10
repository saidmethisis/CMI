// Справочник тегов делового медиа.
//
// Зачем справочник, а не свободный ввод. Автор писал теги руками и на одном
// языке: под узбекской статьёй висело «#экспорт», под английской — тоже. Тег
// при этом должен работать как рубрика — по нему ищут и переходят, — а
// «#eksport», «#Экспорт» и «#export» для системы три разных тега, между собой
// никак не связанные.
//
// Теперь в базе хранится slug, а подпись подставляется на языке страницы. Автор
// выбирает из списка, и материал сразу помечен на всех трёх языках.
//
// Список можно и нужно пополнять — это обычный массив. Существующие статьи со
// свободными тегами не ломаются: неизвестный slug показывается как есть.

export type TagDef = { slug: string; ru: string; uz: string; en: string };

export const TAGS: TagDef[] = [
  // Экономика и финансы
  { slug: "economy", ru: "Экономика", uz: "Iqtisodiyot", en: "Economy" },
  { slug: "budget", ru: "Бюджет", uz: "Byudjet", en: "Budget" },
  { slug: "inflation", ru: "Инфляция", uz: "Inflyatsiya", en: "Inflation" },
  { slug: "banks", ru: "Банки", uz: "Banklar", en: "Banks" },
  { slug: "currency", ru: "Валюта", uz: "Valyuta", en: "Currency" },
  { slug: "taxes", ru: "Налоги", uz: "Soliqlar", en: "Taxes" },
  { slug: "investments", ru: "Инвестиции", uz: "Investitsiyalar", en: "Investments" },
  { slug: "stock-market", ru: "Фондовый рынок", uz: "Fond bozori", en: "Stock market" },
  { slug: "crypto", ru: "Криптовалюты", uz: "Kriptovalyutalar", en: "Crypto" },
  { slug: "insurance", ru: "Страхование", uz: "Sug'urta", en: "Insurance" },

  // Бизнес
  { slug: "business", ru: "Бизнес", uz: "Biznes", en: "Business" },
  { slug: "startups", ru: "Стартапы", uz: "Startaplar", en: "Startups" },
  { slug: "sme", ru: "Малый бизнес", uz: "Kichik biznes", en: "Small business" },
  { slug: "privatization", ru: "Приватизация", uz: "Xususiylashtirish", en: "Privatization" },
  { slug: "retail", ru: "Ритейл", uz: "Chakana savdo", en: "Retail" },
  { slug: "real-estate", ru: "Недвижимость", uz: "Ko'chmas mulk", en: "Real estate" },
  { slug: "construction", ru: "Строительство", uz: "Qurilish", en: "Construction" },
  { slug: "tourism", ru: "Туризм", uz: "Turizm", en: "Tourism" },

  // Промышленность и ресурсы
  { slug: "industry", ru: "Промышленность", uz: "Sanoat", en: "Industry" },
  { slug: "energy", ru: "Энергетика", uz: "Energetika", en: "Energy" },
  { slug: "oil-gas", ru: "Нефть и газ", uz: "Neft va gaz", en: "Oil and gas" },
  { slug: "mining", ru: "Горная добыча", uz: "Kon sanoati", en: "Mining" },
  { slug: "agriculture", ru: "Сельское хозяйство", uz: "Qishloq xo'jaligi", en: "Agriculture" },
  { slug: "textile", ru: "Текстиль", uz: "To'qimachilik", en: "Textile" },
  { slug: "green-energy", ru: "Зелёная энергетика", uz: "Yashil energetika", en: "Green energy" },

  // Логистика и торговля
  { slug: "logistics", ru: "Логистика", uz: "Logistika", en: "Logistics" },
  { slug: "export", ru: "Экспорт", uz: "Eksport", en: "Export" },
  { slug: "import", ru: "Импорт", uz: "Import", en: "Import" },
  { slug: "transport", ru: "Транспорт", uz: "Transport", en: "Transport" },
  { slug: "railway", ru: "Железные дороги", uz: "Temir yo'llar", en: "Railways" },
  { slug: "ports", ru: "Порты", uz: "Portlar", en: "Ports" },

  // Технологии
  { slug: "technology", ru: "Технологии", uz: "Texnologiyalar", en: "Technology" },
  { slug: "ai", ru: "Искусственный интеллект", uz: "Sun'iy intellekt", en: "Artificial intelligence" },
  { slug: "it", ru: "IT-отрасль", uz: "IT soha", en: "IT industry" },
  { slug: "fintech", ru: "Финтех", uz: "Fintex", en: "Fintech" },
  { slug: "telecom", ru: "Связь", uz: "Aloqa", en: "Telecom" },
  { slug: "ecommerce", ru: "Электронная торговля", uz: "Elektron savdo", en: "E-commerce" },

  // Государство и общество
  { slug: "politics", ru: "Политика", uz: "Siyosat", en: "Politics" },
  { slug: "diplomacy", ru: "Дипломатия", uz: "Diplomatiya", en: "Diplomacy" },
  { slug: "law", ru: "Законодательство", uz: "Qonunchilik", en: "Legislation" },
  { slug: "reforms", ru: "Реформы", uz: "Islohotlar", en: "Reforms" },
  { slug: "education", ru: "Образование", uz: "Ta'lim", en: "Education" },
  { slug: "healthcare", ru: "Здравоохранение", uz: "Sog'liqni saqlash", en: "Healthcare" },
  { slug: "ecology", ru: "Экология", uz: "Ekologiya", en: "Ecology" },
  { slug: "labour", ru: "Рынок труда", uz: "Mehnat bozori", en: "Labour market" },

  // География
  { slug: "uzbekistan", ru: "Узбекистан", uz: "O'zbekiston", en: "Uzbekistan" },
  { slug: "tashkent", ru: "Ташкент", uz: "Toshkent", en: "Tashkent" },
  { slug: "central-asia", ru: "Центральная Азия", uz: "Markaziy Osiyo", en: "Central Asia" },
  { slug: "kazakhstan", ru: "Казахстан", uz: "Qozog'iston", en: "Kazakhstan" },
  { slug: "china", ru: "Китай", uz: "Xitoy", en: "China" },
  { slug: "russia", ru: "Россия", uz: "Rossiya", en: "Russia" },
  { slug: "europe", ru: "Европа", uz: "Yevropa", en: "Europe" },
];

const BY_SLUG = new Map(TAGS.map((t) => [t.slug, t]));

/** Подпись тега на языке страницы. Неизвестный slug показываем как есть. */
export function tagLabel(slug: string, lang: string): string {
  const t = BY_SLUG.get(slug);
  if (!t) return slug;
  return lang === "uz" ? t.uz : lang === "en" ? t.en : t.ru;
}

/** Есть ли такой тег в справочнике. */
export const isKnownTag = (slug: string) => BY_SLUG.has(slug);

/** Теги, сгруппированные для выбора в редакторе. */
export const TAG_GROUPS: { title: Record<string, string>; slugs: string[] }[] = [
  { title: { ru: "Экономика и финансы", uz: "Iqtisod va moliya", en: "Economy & finance" },
    slugs: ["economy", "budget", "inflation", "banks", "currency", "taxes", "investments", "stock-market", "crypto", "insurance"] },
  { title: { ru: "Бизнес", uz: "Biznes", en: "Business" },
    slugs: ["business", "startups", "sme", "privatization", "retail", "real-estate", "construction", "tourism"] },
  { title: { ru: "Промышленность", uz: "Sanoat", en: "Industry" },
    slugs: ["industry", "energy", "oil-gas", "mining", "agriculture", "textile", "green-energy"] },
  { title: { ru: "Логистика и торговля", uz: "Logistika va savdo", en: "Logistics & trade" },
    slugs: ["logistics", "export", "import", "transport", "railway", "ports"] },
  { title: { ru: "Технологии", uz: "Texnologiyalar", en: "Technology" },
    slugs: ["technology", "ai", "it", "fintech", "telecom", "ecommerce"] },
  { title: { ru: "Государство и общество", uz: "Davlat va jamiyat", en: "State & society" },
    slugs: ["politics", "diplomacy", "law", "reforms", "education", "healthcare", "ecology", "labour"] },
  { title: { ru: "География", uz: "Geografiya", en: "Geography" },
    slugs: ["uzbekistan", "tashkent", "central-asia", "kazakhstan", "china", "russia", "europe"] },
];
