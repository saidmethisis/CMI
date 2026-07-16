// Mock ad creatives for demo (stand-ins for the ad-decision server / external networks).
export interface Creative {
  id: string;
  advertiser: string;
  title: string;
  subtitle: string;
  cta: string;
  color: string;
  kind: "banner" | "native";
}

export const creatives: Creative[] = [
  { id: "cr1", advertiser: "Payme Business", title: "Эквайринг 0% первый месяц", subtitle: "Приём платежей для бизнеса за 1 день", cta: "Подключить", color: "#00A9E0", kind: "banner" },
  { id: "cr2", advertiser: "Uzum Bank", title: "Мультивалютные счета", subtitle: "USD · EUR · RUB — открытие онлайн", cta: "Открыть счёт", color: "#7A3FF2", kind: "banner" },
  { id: "cr3", advertiser: "IT Park", title: "Резидентство для IT-компаний", subtitle: "Налоговые льготы и экспорт услуг", cta: "Узнать больше", color: "#0E7C66", kind: "banner" },
  { id: "cr4", advertiser: "MTS Cloud", title: "Облако для медиа-нагрузок", subtitle: "CDN + S3 + автоскейлинг", cta: "Тест 14 дней", color: "#C81E3A", kind: "banner" },
  { id: "cr5", advertiser: "EDU Pro", title: "Курс «Финмодель за выходные»", subtitle: "Партнёрский материал для предпринимателей", cta: "Записаться", color: "#E0A008", kind: "native" },
  { id: "cr6", advertiser: "GreenTech", title: "Зелёные инвестиции 2026", subtitle: "Как заработать на ESG — спецпроект", cta: "Читать спецпроект", color: "#16A34A", kind: "native" },
];

// External ad integrations shown in the "Ad integrations" block (admin + landing demo).
export const adIntegrations = [
  { id: "gam", name: "Google Ad Manager", status: "connected", note: "Прямые сделки + programmatic" },
  { id: "adsense", name: "Google AdSense", status: "connected", note: "Контекстные блоки" },
  { id: "prebid", name: "Prebid.js (Header Bidding)", status: "connected", note: "Аукцион в реальном времени" },
  { id: "meta", name: "Meta Audience Network", status: "paused", note: "Нативные форматы" },
  { id: "yandex", name: "Яндекс.Реклама (РСЯ)", status: "connected", note: "Локальный трафик" },
  { id: "self", name: "Собственный Ad-Server", status: "connected", note: "House ads + прямые кампании" },
] as const;
