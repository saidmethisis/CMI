// Раздаёт короткие публичные адреса статьям, опубликованным до перехода
// на них. Формат тот же, что у новых: ММДД от даты выхода + четыре цифры.
//
// Запускать можно сколько угодно раз: материалы с уже заданным адресом
// пропускаются, чужие ссылки не меняются.
//
//   node scripts/backfill-short-ids.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const taken = new Set(
  (await prisma.article.findMany({ where: { shortId: { not: null } }, select: { shortId: true } }))
    .map((r) => r.shortId),
);

const rows = await prisma.article.findMany({
  where: { shortId: null },
  select: { id: true, slug: true, createdAt: true },
  orderBy: { createdAt: "asc" },
});

let done = 0;
for (const r of rows) {
  const d = r.createdAt;
  const head = String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  let id = "";
  for (let i = 0; i < 200; i++) {
    const candidate = head + String(Math.floor(1000 + Math.random() * 9000));
    if (!taken.has(candidate)) { id = candidate; break; }
  }
  if (!id) { console.error("не нашлось свободного номера для", r.slug); continue; }
  taken.add(id);
  await prisma.article.update({ where: { id: r.id }, data: { shortId: id } });
  console.log(`  ${id}  ←  ${r.slug.slice(0, 60)}`);
  done++;
}
console.log(`\nкоротких адресов выдано: ${done}, уже было: ${taken.size - done}`);
await prisma.$disconnect();
