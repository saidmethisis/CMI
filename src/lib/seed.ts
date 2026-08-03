import type { Category, Story } from "./types";

// Справочные данные. Здесь только рубрики — реальная таксономия сайта.
//
// Раньше файл содержал ещё и демо-контент: выдуманные статьи «Редакции Aktiv»
// с текстом-рыбой и случайными стоковыми фото, подставные сторис («Саммит ШОС»,
// «IPO года»), фиктивные рекламные баннеры, заявки на аккредитацию от
// несуществующих компаний и котировки (S&P 500, BTC, Brent). Всё это удалено:
// на новостном сайте выдуманный материал читатель не отличит от настоящего.
// Контент появляется только от редакции и авторов и хранится в базе.

export const categories: Category[] = [
  { slug: "tech", name: "Технологии", nameUz: "Texnologiya", nameEn: "Tech", color: "#2563eb", order: 1 },
  { slug: "startups", name: "Стартапы", nameUz: "Startaplar", nameEn: "Startups", color: "#7c3aed", order: 2 },
  { slug: "politics", name: "Политика", nameUz: "Siyosat", nameEn: "Politics", color: "#0891b2", order: 3 },
  { slug: "business", name: "Бизнес", nameUz: "Biznes", nameEn: "Business", color: "#16a34a", order: 4 },
  { slug: "diplomacy", name: "Дипломатия", nameUz: "Diplomatiya", nameEn: "Diplomacy", color: "#c2410c", order: 5 },
  { slug: "markets", name: "Рынки", nameUz: "Bozorlar", nameEn: "Markets", color: "#db2777", order: 6 },
  { slug: "finance", name: "Финансы", nameUz: "Moliya", nameEn: "Finance", color: "#ca8a04", order: 7 },
];

// Сторис добавляют редакция и авторы, хранятся в БД и читаются через getStories().
// Пустой массив — осознанное значение по умолчанию для клиента до загрузки данных.
export const stories: Story[] = [];
