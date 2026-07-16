// Demo dataset generator — populates the DB as if the site ran ~3 months.
// Run:   npm run seed:demo      (wipes and fills)
// Reset: npm run db:reset       (clean working site again)
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAYS = 92;
const NOW = Date.now();

// ── helpers ───────────────────────────────────────────────────────────────────
const rnd = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[rndInt(0, arr.length - 1)];
const pickN = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const daysAgo = (d) => new Date(NOW - d * 864e5 - rndInt(0, 86_400_000));
let _id = 0;
const mkid = (p) => `${p}-${(_id++).toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
const TR = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",ў:"o",қ:"q",ғ:"g",ҳ:"h" };
function slugify(s, i) {
  const base = s.toLowerCase().split("").map((c) => (c in TR ? TR[c] : c)).join("").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50).replace(/-$/g, "");
  return `${base || "art"}-${i}`;
}
const img = (seed) => `https://picsum.photos/seed/${seed}/1200/675`;
const SAMPLE_VIDEOS = [
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
];

// ── reference data ────────────────────────────────────────────────────────────
const categories = [
  { slug: "tech", name: "Технологии", nameUz: "Texnologiya", nameEn: "Tech", color: "#2563eb" },
  { slug: "startups", name: "Стартапы", nameUz: "Startaplar", nameEn: "Startups", color: "#7c3aed" },
  { slug: "politics", name: "Политика", nameUz: "Siyosat", nameEn: "Politics", color: "#0891b2" },
  { slug: "business", name: "Бизнес", nameUz: "Biznes", nameEn: "Business", color: "#16a34a" },
  { slug: "diplomacy", name: "Дипломатия", nameUz: "Diplomatiya", nameEn: "Diplomacy", color: "#c2410c" },
  { slug: "markets", name: "Рынки", nameUz: "Bozorlar", nameEn: "Markets", color: "#db2777" },
  { slug: "finance", name: "Финансы", nameUz: "Moliya", nameEn: "Finance", color: "#ca8a04" },
];

const companies = ["Neo Bank", "Uzum", "Payme", "Click", "TBC Bank", "Alif", "IT Park", "Humans", "EPAM", "MyTaxi"];
const techs = ["ИИ", "облачные технологии", "финтех", "блокчейн", "кибербезопасность", "5G", "дата-центры", "open-source", "big data", "IoT"];
const nums = ["$40M", "$120M", "рекордные $250M", "€25M", "35%", "в 2 раза", "12%", "рекордный"];
const geos = ["Узбекистан", "Казахстан", "регион", "Центральная Азия", "ЕАЭС", "Ташкент", "Самарканд"];
const sub = (t) => t.replace("{company}", pick(companies)).replace("{tech}", pick(techs)).replace("{num}", pick(nums)).replace("{geo}", pick(geos));

const titlePools = {
  tech: ["Как {tech} меняет бизнес в {geo}", "{company} внедряет {tech}: что это даёт рынку", "Инвестиции в {tech} выросли на {num}", "{geo}: спрос на {tech}-специалистов бьёт рекорды", "Обзор: главные {tech}-тренды сезона", "Почему {company} делает ставку на {tech}"],
  startups: ["{company} привлёк {num} в раунде", "Стартап из {geo} выходит на новые рынки", "Как основатель {company} построил бизнес с нуля", "{geo}: венчурный рынок оживает", "Питч недели: {tech}-стартап показал результат", "Единорог из {geo}: миф или реальность"],
  politics: ["{geo}: новые правила для бизнеса", "Реформа затронет {tech}-сектор", "Итоги заседания: что решили по экономике", "Власти {geo} представили дорожную карту", "Регулирование {tech}: проект вынесен на обсуждение", "Что означают новые меры для рынка"],
  business: ["{company} открывает офис в {geo}", "Ритейл уходит в онлайн: цифры и прогнозы", "{company}: выручка выросла на {num}", "Крупнейшая сделка сезона в {geo}", "Как {company} оптимизирует издержки", "Индустрия меняется: разбор для предпринимателей"],
  diplomacy: ["{geo}: подписан торговый пакт", "Итоги саммита: договорённости для региона", "Санкции и {tech}: как адаптируется бизнес", "{geo} укрепляет экономические связи", "Дипломатия и торговля: новый этап", "Региональное партнёрство: что дальше"],
  markets: ["Ралли продолжается: обзор рынка", "{company} готовит IPO года", "Крипта растёт: {num} за неделю", "Нефть и валюты: сводка по {geo}", "Инвесторы {geo} пересматривают портфели", "Фондовый рынок {geo}: недельный итог"],
  finance: ["{company} запускает мультивалютные счета", "Зелёные облигации набирают вес", "Как копить и инвестировать в {geo}", "Кредитование малого бизнеса: новые условия", "{company}: комиссия 0% для бизнеса", "Финтех {geo}: кто лидирует рынок"],
};
const tagPools = { tech: ["ИИ", "облака", "инфраструктура", "разработка"], startups: ["венчур", "founder", "инвестиции", "MVP"], politics: ["регулирование", "регион", "реформа"], business: ["ритейл", "e-commerce", "МСБ", "сделка"], diplomacy: ["торговля", "саммит", "санкции"], markets: ["акции", "крипто", "нефть", "IPO"], finance: ["финтех", "ESG", "кредиты", "депозиты"] };

const authorPool = [
  { first: "Азиз", last: "Каримов", spec: "Финансы, финтех" }, { first: "Малика", last: "Юсупова", spec: "Технологии, стартапы" },
  { first: "Дилшод", last: "Рахимов", spec: "Рынки, инвестиции" }, { first: "Нигора", last: "Абдуллаева", spec: "Бизнес, ритейл" },
  { first: "Тимур", last: "Саидов", spec: "Политика, дипломатия" }, { first: "Камила", last: "Исмаилова", spec: "Экономика" },
  { first: "Бобур", last: "Тошматов", spec: "Технологии" }, { first: "Севара", last: "Назарова", spec: "Финансы" },
];
const readerNames = ["Джамшид", "Феруза", "Отабек", "Гулнора", "Шерзод", "Мадина", "Улугбек", "Зарина", "Санжар", "Дилноза", "Рустам", "Лола"];
const commentBodies = [
  "Отличный разбор, спасибо!", "Наконец-то внятная аналитика по теме.", "А что с рисками? Хотелось бы подробнее.",
  "Не согласен с выводами, но материал сильный.", "Полезно для предпринимателей.", "Ждём продолжения по этой теме.",
  "Цифры впечатляют. Интересно, что будет через год.", "Как это скажется на малом бизнесе?", "Спасибо редакции за качество!",
  "Хороший пример из практики.", "Можно ссылку на источник данных?", "Актуально как никогда.",
];

function paragraphs(topic) {
  return [
    `${topic} становится одной из определяющих тем сезона. Аналитики отмечают, что изменения затрагивают не только крупных игроков, но и малый бизнес, вынужденный быстро адаптировать стратегию.`,
    `«Мы наблюдаем структурный сдвиг, а не временную коррекцию», — отмечает источник в отрасли. Ключевые показатели указывают на устойчивость тренда в среднесрочной перспективе.`,
    `Эксперты выделяют три фактора влияния: технологическую трансформацию, изменение регуляторной среды и приток частного капитала. Их сочетание усиливает эффект.`,
    `Что это означает для читателя-предпринимателя: окно возможностей открыто, но требует быстрых и выверенных решений. Редакция продолжит следить за развитием ситуации.`,
  ].join("\n\n");
}

async function wipe() {
  // order matters for FKs
  await prisma.notification.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.commentReaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.article.deleteMany();
  await prisma.story.deleteMany();
  await prisma.category.deleteMany();
  await prisma.author.deleteMany();
  await prisma.appUser.deleteMany();
  await prisma.company.deleteMany();
  await prisma.accreditationRequest.deleteMany();
  await prisma.adBanner.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.businessAccount.deleteMany();
  // roles left to the app's ensureRbacSeed (keeps full permission sets)
  await prisma.role.deleteMany();
}

async function main() {
  console.log("Wiping…");
  await wipe();

  console.log("Categories & stories…");
  await prisma.category.createMany({ data: categories.map((c, i) => ({ slug: c.slug, name: c.name, nameUz: c.nameUz, nameEn: c.nameEn, color: c.color, order: i + 1, visible: true })) });

  console.log("Companies…");
  const capsAll = { publish_news: true, publish_press: true, create_authors: true, use_analytics: true, use_seo: true };
  await prisma.company.createMany({ data: [
    { id: "co-neobank", slug: "neo-bank", name: "Neo Bank", active: true, verified: true, premium: true, featured: true, ownerUserId: "u-owner", capabilities: JSON.stringify(capsAll), sections: JSON.stringify(["dashboard","news","press","media","analytics","ads","seo","comments","requests","authors","statistics"]), profile: JSON.stringify({ shortName: "NeoBank", legalName: "OOO Neo Bank", country: "Узбекистан", city: "Ташкент", email: "press@neobank.uz", website: "https://neobank.uz", description: "Цифровой банк для бизнеса." }) },
    { id: "co-uzum", slug: "uzum", name: "Uzum", active: true, verified: true, premium: true, featured: false, capabilities: JSON.stringify(capsAll), sections: JSON.stringify(["dashboard","news","ads","analytics"]), profile: JSON.stringify({ country: "Узбекистан", city: "Ташкент", description: "Маркетплейс и финтех-экосистема." }) },
    { id: "co-greentech", slug: "greentech", name: "GreenTech", active: true, verified: false, premium: false, featured: false, capabilities: JSON.stringify({ place_ads: true, use_analytics: true }), sections: JSON.stringify(["dashboard","news","ads"]), profile: JSON.stringify({ country: "Узбекистан", city: "Самарканд", description: "Зелёные технологии и ESG." }) },
  ] });

  console.log("Authors…");
  const authors = authorPool.map((a, i) => ({
    id: mkid("au"), slug: slugify(`${a.first} ${a.last}`, i), firstName: a.first, lastName: a.last,
    avatar: "", verifyStatus: i % 4 === 0 ? "pending" : "verified", companyId: i === 0 ? "co-neobank" : null,
    capabilities: JSON.stringify({ write: true, edit_own: true, upload_photos: true, use_ai: i % 2 === 0, publish_self: i % 3 === 0 }),
    profile: JSON.stringify({ position: pick(["Обозреватель", "Журналист", "Аналитик", "Редактор"]), country: "Узбекистан", city: pick(["Ташкент", "Самарканд", "Бухара"]), languages: "uz, ru, en", specialization: a.spec, bio: `Пишет о теме «${a.spec}» более ${rndInt(2, 9)} лет.` }),
  }));
  await prisma.author.createMany({ data: authors });

  console.log("Users…");
  const pw = hashPassword("aktiv12345");
  // one Writer account per author profile (so each writer owns only their own articles)
  const writerUsers = authorPool.map((a, i) => ({
    id: `u-w-${i}`, name: `${a.first} ${a.last}`,
    email: i === 0 ? "aziz@aktiv.uz" : `writer${i}@aktiv.uz`,
    roleSlug: "writer", authorId: authors[i].id,
  }));
  const nameToUserId = Object.fromEntries(writerUsers.map((u) => [u.name, u.id]));
  const staff = [
    { id: "u-super", name: "Суперадмин", email: "super@aktiv.uz", roleSlug: "superadmin" },
    { id: "u-owner", name: "Владелец Neo Bank", email: "owner@neobank.uz", roleSlug: "company", companyId: "co-neobank" },
    { id: "u-reader", name: "Читатель", email: "reader@aktiv.uz", roleSlug: "reader" },
    { id: "u-blocked", name: "Заблокированный", email: "blocked@aktiv.uz", roleSlug: "reader" },
  ];
  const readers = readerNames.map((n, i) => ({ id: mkid("u"), name: n, email: `${n.toLowerCase()}${i}@mail.uz`, roleSlug: "reader" }));
  const allUsers = [...staff, ...writerUsers, ...readers].map((u) => ({ ...u, passwordHash: pw, emailVerified: true, displayName: u.name, status: u.email === "blocked@aktiv.uz" ? "blocked" : "active", createdAt: daysAgo(rndInt(10, DAYS)) }));
  await prisma.appUser.createMany({ data: allUsers });
  // expose the map for article ownership below
  globalThis.__nameToUserId = nameToUserId;

  console.log("Articles…");
  const articles = [];
  let idx = 0;
  const total = 140;
  for (let i = 0; i < total; i++) {
    const cat = pick(categories);
    const title = sub(pick(titlePools[cat.slug]));
    const created = daysAgo(rndInt(0, DAYS));
    const ageDays = (NOW - created.getTime()) / 864e5;
    const kindRoll = Math.random();
    const authorKind = kindRoll < 0.11 ? "pr" : kindRoll < 0.28 ? "ugc" : "editorial";
    const company = authorKind === "pr" ? pick(["Neo Bank", "Uzum", "GreenTech"]) : null;
    const author = authorKind === "pr" ? `Пресс-служба ${company}` : authorKind === "ugc" ? pick(authorPool) : null;
    const authorName = authorKind === "pr" ? `Пресс-служба ${company}` : author ? `${author.first} ${author.last}` : "Редакция Aktiv";
    // status distribution
    let status = "published";
    const sRoll = Math.random();
    if (i < 8 && sRoll < 0.9) status = "review";
    else if (sRoll < 0.03) status = "draft";
    else if (sRoll < 0.06) status = "archived";
    const views = status === "published" ? Math.round(ageDays * rnd(120, 900) + rnd(200, 30000)) : 0;
    const slug = slugify(title, idx++);
    articles.push({
      id: mkid("a"), slug, title, lead: `${sub("Разбор темы для делового читателя")}. ${title}.`.slice(0, 180),
      body: paragraphs(title), aiSummary: `• Главное: ${title.toLowerCase()}.\n• Контекст: тренд устойчив в среднесрочной перспективе.\n• Вывод: окно возможностей для бизнеса открыто.`,
      cover: img(slug), videoUrl: Math.random() < 0.09 && status === "published" ? pick(SAMPLE_VIDEOS) : "",
      categorySlug: cat.slug, tags: JSON.stringify(pickN(tagPools[cat.slug], rndInt(1, 3))),
      authorName, authorUserId: authorKind === "ugc" ? (globalThis.__nameToUserId?.[authorName] ?? "") : "", authorKind, authorSocials: "[]", company, createdAt: created,
      readingMinutes: rndInt(2, 9), premium: false, pinned: false, status, views,
    });
  }
  // pin one recent published article
  const recentPub = articles.filter((a) => a.status === "published").sort((a, b) => b.createdAt - a.createdAt)[0];
  if (recentPub) recentPub.pinned = true;
  await prisma.article.createMany({ data: articles });

  console.log("Stories…");
  const pubSlugs = articles.filter((a) => a.status === "published");
  await prisma.story.createMany({ data: pickN(pubSlugs, 6).map((a, i) => ({ id: mkid("s"), categorySlug: a.categorySlug, title: a.title.slice(0, 40), image: img("story" + i), articleSlug: a.slug, order: i })) });

  console.log("Comments & reactions…");
  const commenters = allUsers.filter((u) => u.roleSlug === "reader" || u.roleSlug === "writer");
  let cCount = 0, rCount = 0;
  for (const art of pickN(pubSlugs, 55)) {
    const roots = [];
    const n = rndInt(1, 5);
    for (let k = 0; k < n; k++) {
      const u = pick(commenters);
      const likes = rndInt(0, 40), dislikes = rndInt(0, 6);
      const c = { id: mkid("c"), articleId: art.id, userId: u.id, author: u.name, authorAvatar: "", body: pick(commentBodies), status: Math.random() < 0.06 ? "pending" : "approved", parentId: null, likes, dislikes, reports: Math.random() < 0.08 ? rndInt(1, 4) : 0, pinned: k === 0 && Math.random() < 0.2, edited: Math.random() < 0.1, createdAt: new Date(art.createdAt.getTime() + rndInt(1, 72) * 36e5) };
      await prisma.comment.create({ data: c });
      cCount++; roots.push(c);
      // reactions rows (a few, so toggling works)
      for (const ru of pickN(commenters, Math.min(3, rndInt(0, 3)))) {
        try { await prisma.commentReaction.create({ data: { id: mkid("rx"), commentId: c.id, userId: ru.id, type: Math.random() < 0.8 ? "like" : "dislike" } }); rCount++; } catch { /* dup */ }
      }
      // a reply sometimes
      if (Math.random() < 0.4) {
        const ru = pick(commenters);
        await prisma.comment.create({ data: { id: mkid("c"), articleId: art.id, userId: ru.id, author: ru.name, authorAvatar: "", body: pick(["Согласен!", "Хороший вопрос.", "Дополню: важно учитывать риски.", "Спасибо за уточнение."]), status: "approved", parentId: c.id, likes: rndInt(0, 12), dislikes: rndInt(0, 2), reports: 0, pinned: false, edited: false, createdAt: new Date(c.createdAt.getTime() + rndInt(1, 48) * 36e5) } });
        cCount++;
      }
    }
  }

  console.log("Business / accreditation / ads…");
  const neoPub = articles.filter((a) => a.company === "Neo Bank").length;
  await prisma.businessAccount.create({ data: { id: "biz1", company: "Neo Bank", tier: "Premium", publicationsLimit: 10, publicationsUsed: Math.min(10, neoPub), verified: true } });
  await prisma.accreditationRequest.createMany({ data: [
    { id: "r1", name: "GreenTech LLC", type: "business", detail: "Хочет доступ к PR-кабинету, тариф Partner", status: "pending" },
    { id: "r2", name: "Малика Юсупова", type: "author", detail: "CV + 3 публикации в отраслевых СМИ", status: "pending" },
    { id: "r3", name: "Uztelecom", type: "business", detail: "Продление аккредитации", status: "approved" },
    { id: "r4", name: "Бобур Тошматов", type: "author", detail: "Заявка на аккредитацию", status: "pending" },
  ] });
  await prisma.adBanner.createMany({ data: [
    { id: "ad1", slot: "top", title: "Payme для бизнеса — 0% первый месяц", url: "#", active: true, frequency: 3, impressions: rndInt(80000, 220000) },
    { id: "ad2", slot: "in-article", title: "Курс «Финмодель за выходные»", url: "#", active: true, frequency: 2, impressions: rndInt(40000, 120000) },
    { id: "ad3", slot: "sidebar", title: "Uzum Business — эквайринг", url: "#", active: true, frequency: 5, impressions: rndInt(20000, 90000) },
    { id: "ad4", slot: "top", title: "IT Park — резидентство", url: "#", active: false, frequency: 4, impressions: rndInt(10000, 50000) },
  ] });

  console.log("Notifications & follows…");
  const subs = allUsers.filter((u) => u.roleSlug === "reader");
  await prisma.notification.createMany({
    data: subs.flatMap((u, i) => [
      { id: mkid("n"), userId: u.id, type: "reply", title: "Вам ответили на комментарий", body: pick(["Согласен с вашим мнением!", "Хороший вопрос, дополню…", "Спасибо за уточнение."]), link: `/article/${pick(pubSlugs).slug}#comments`, read: i % 3 === 0, createdAt: daysAgo(rndInt(0, 12)) },
      { id: mkid("n"), userId: u.id, type: "system", title: "Добро пожаловать в Asosiy Aktiv", body: "Подпишитесь на темы и авторов, чтобы формировать свою ленту.", read: false, createdAt: daysAgo(rndInt(5, 30)) },
    ]),
  });
  const follows = [];
  const seen = new Set();
  for (const u of subs) {
    for (const a of pickN(authors, rndInt(0, 4))) { const k = u.id + "author" + a.id; if (!seen.has(k)) { seen.add(k); follows.push({ id: mkid("f"), followerId: u.id, targetType: "author", targetId: a.id, createdAt: daysAgo(rndInt(0, 60)) }); } }
    for (const c of pickN(categories, rndInt(0, 3))) { const k = u.id + "topic" + c.slug; if (!seen.has(k)) { seen.add(k); follows.push({ id: mkid("f"), followerId: u.id, targetType: "topic", targetId: c.slug, createdAt: daysAgo(rndInt(0, 60)) }); } }
  }
  await prisma.follow.createMany({ data: follows });

  console.log("Audit logs…");
  const acts = ["auth.login", "article.publish", "comment.create", "company.update", "role.update", "user.create", "author.update", "auth.login_fail"];
  await prisma.auditLog.createMany({ data: Array.from({ length: 40 }, () => ({ id: mkid("log"), actor: pick(["Суперадмин", "Гл. редактор", "Редактор", "reader@aktiv.uz"]), action: pick(acts), target: pick(["", "articles", "co-neobank", "editor"]), createdAt: daysAgo(rndInt(0, 30)) })) });

  const [ac, cc, uc, coc, auc, cmc] = await Promise.all([
    prisma.article.count(), prisma.category.count(), prisma.appUser.count(), prisma.company.count(), prisma.author.count(), prisma.comment.count(),
  ]);
  console.log(`\n✅ Готово (демо «3 месяца»):`);
  console.log(`   статьи: ${ac}  (published: ${articles.filter((a) => a.status === "published").length}, на модерации: ${articles.filter((a) => a.status === "review").length})`);
  console.log(`   категории: ${cc} · компании: ${coc} · авторы: ${auc} · пользователи: ${uc} · комментарии: ${cmc} (+${rCount} реакций)`);
  console.log(`   логин для теста: reader@aktiv.uz / aktiv12345  (и super@, chief@, owner@neobank.uz)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
