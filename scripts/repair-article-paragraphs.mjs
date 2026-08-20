// Восстановление разбивки на абзацы у материалов, сохранённых до исправления.
//
// Проверка «это разметка?» не знала про <div> и <br>, поэтому текст, набранный
// в редакторе или вставленный из Word, считался простым и сохранялся без
// обработки — абзацы автора пропадали, статья становилась сплошной простынёй.
//
// Здесь мы ничего не придумываем: границы абзацев берём из того, что уцелело
// в самой записи — переводов строки и тегов <br>. Если ни того, ни другого нет,
// материал не трогаем: угадывать, где автор хотел абзац, нельзя.
//
// Запуск: node scripts/repair-article-paragraphs.mjs [--apply]
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient();

const esc = (s) => s.replace(/&(?![a-z#0-9]+;)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function repair(body) {
  // Сначала переводы строки — их ставит автор осознанно.
  let parts = body.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  // Если переводов не было, границы могли остаться в виде <br>.
  if (parts.length < 2) {
    parts = body.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
  }
  if (parts.length < 2) return null; // границ не осталось — не трогаем
  return parts.map((p) => `<p>${esc(p.replace(/<br\s*\/?>/gi, " ")).trim()}</p>`).join("");
}

const rows = await prisma.article.findMany({
  where: { status: "published", NOT: { body: { contains: "<p" } } },
  select: { id: true, shortId: true, title: true, body: true },
});

console.log(`Материалов без абзацев: ${rows.length}\n`);
let fixed = 0, skipped = 0;

for (const a of rows) {
  const out = repair(a.body);
  if (!out) {
    console.log(`  ПРОПУСК  ${a.shortId}  ${a.title.slice(0, 44)} — границ абзацев не осталось`);
    skipped++;
    continue;
  }
  const n = (out.match(/<p>/g) || []).length;
  console.log(`  ${APPLY ? "ИСПРАВЛЕНО" : "БУДЕТ"}   ${a.shortId}  ${a.title.slice(0, 40)} → ${n} абзацев`);
  if (APPLY) await prisma.article.update({ where: { id: a.id }, data: { body: out } });
  fixed++;
}

console.log(`\nИтого: ${fixed} ${APPLY ? "исправлено" : "к исправлению"}, ${skipped} пропущено`);
if (!APPLY) console.log("Это пробный прогон. Для записи запустите с ключом --apply");
await prisma.$disconnect();
