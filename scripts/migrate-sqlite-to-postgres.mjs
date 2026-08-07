// Одноразовый перенос данных из старой SQLite-базы в PostgreSQL.
//
// Нужен ровно один раз — при переезде уже работающего сайта на новую БД.
// Читает файл dev.db напрямую (через встроенный node:sqlite, без зависимостей)
// и переливает строки в Postgres через Prisma.
//
// Запуск:
//   node scripts/migrate-sqlite-to-postgres.mjs <путь-к-dev.db>
//   node scripts/migrate-sqlite-to-postgres.mjs ./backup/dev.db --dry-run
//
// Чтение .db требует Node 22 (там появился встроенный node:sqlite). Если под
// рукой Node 20 — как в нашем образе, — выгрузите базу в JSON чем угодно и
// скормите его сюда: формат {"Имя таблицы": [ {строка}, ... ]}. Например,
// питоном, который есть на любом сервере:
//
//   python3 -c "import sqlite3,json;c=sqlite3.connect('dev.db');c.row_factory=sqlite3.Row;//   t=[r[0] for r in c.execute(\"select name from sqlite_master where type='table'\")];//   print(json.dumps({n:[dict(r) for r in c.execute(f'select * from \\\"{n}\\\"')] for n in t}))" > dump.json
//   node scripts/migrate-sqlite-to-postgres.mjs dump.json
//
// Требования: Postgres поднят, миграции применены (npx prisma migrate deploy),
// DATABASE_URL указывает на него.
//
// Безопасность: скрипт НИЧЕГО не удаляет. Записи, чей id уже есть в Postgres,
// пропускаются — значит его можно запускать повторно после сбоя.

import { existsSync, readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const SRC = process.argv[2];
const DRY = process.argv.includes("--dry-run");

if (!SRC || !existsSync(SRC)) {
  console.error("Укажите путь к файлу старой базы:\n  node scripts/migrate-sqlite-to-postgres.mjs ./dev.db");
  process.exit(1);
}

// Источник: либо готовый JSON-дамп, либо сам файл SQLite (нужен Node 22+).
const isJson = SRC.toLowerCase().endsWith(".json");
let dump = null, sqlite = null;
if (isJson) {
  dump = JSON.parse(readFileSync(SRC, "utf8"));
} else {
  const { DatabaseSync } = await import("node:sqlite").catch(() => {
    console.error("Этот Node не умеет читать SQLite напрямую (нужен 22+).");
    console.error("Выгрузите базу в JSON — как это сделать, написано в шапке файла.");
    process.exit(1);
  });
  sqlite = new DatabaseSync(SRC, { readOnly: true });
}
const prisma = new PrismaClient();

const tableRows = (name) => (isJson ? dump[name] ?? null : (sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name) ? sqlite.prepare(`SELECT * FROM "${name}"`).all() : null));

// В SQLite Prisma хранит DateTime числом (мс от эпохи) либо строкой — приводим к Date.
const toDate = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "bigint") return new Date(Number(v));
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const toBool = (v) => v === 1 || v === true || v === "true";

// Какие таблицы переносим и как преобразовать каждую строку.
// Порядок важен: сначала то, на что ссылаются (статьи → комментарии).
const TABLES = [
  ["Category", "category", (r) => ({ ...r, visible: toBool(r.visible) })],
  ["Role", "role", (r) => ({ ...r, system: toBool(r.system) })],
  ["Company", "company", (r) => ({ ...r, active: toBool(r.active), verified: toBool(r.verified), premium: toBool(r.premium), featured: toBool(r.featured), createdAt: toDate(r.createdAt) })],
  ["Author", "author", (r) => ({ ...r, createdAt: toDate(r.createdAt) })],
  ["AppUser", "appUser", (r) => ({ ...r, emailVerified: toBool(r.emailVerified), twoFactor: toBool(r.twoFactor), consentAt: toDate(r.consentAt), createdAt: toDate(r.createdAt) })],
  ["Article", "article", (r) => ({ ...r, premium: toBool(r.premium), pinned: toBool(r.pinned), createdAt: toDate(r.createdAt), translations: r.translations ?? "{}" })],
  ["Comment", "comment", (r) => ({ ...r, pinned: toBool(r.pinned), edited: toBool(r.edited), createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt), moderatedAt: toDate(r.moderatedAt) })],
  ["CommentReaction", "commentReaction", (r) => r],
  ["Story", "story", (r) => ({ ...r, createdAt: toDate(r.createdAt) })],
  ["BusinessAccount", "businessAccount", (r) => ({ ...r, verified: toBool(r.verified) })],
  ["AccreditationRequest", "accreditationRequest", (r) => r],
  ["CompanyRequest", "companyRequest", (r) => ({ ...r, createdAt: toDate(r.createdAt) })],
  ["AdBanner", "adBanner", (r) => ({ ...r, active: toBool(r.active) })],
  ["Notification", "notification", (r) => ({ ...r, read: toBool(r.read), createdAt: toDate(r.createdAt) })],
  ["Follow", "follow", (r) => ({ ...r, createdAt: toDate(r.createdAt) })],
  ["AuditLog", "auditLog", (r) => ({ ...r, createdAt: toDate(r.createdAt) })],
  // Session НЕ переносим: сессии привязаны к cookie в браузерах и всё равно
  // недействительны после переезда — пользователи просто войдут заново.
];

console.log(DRY ? "РЕЖИМ ПРОВЕРКИ — ничего не записывается\n" : "Перенос данных\n");
let totalNew = 0, totalSkip = 0;

for (const [table, model, map] of TABLES) {
  const rows = tableRows(table);
  if (rows === null) { console.log(`  ${table.padEnd(22)} нет в старой базе — пропуск`); continue; }
  if (rows.length === 0) { console.log(`  ${table.padEnd(22)} пусто`); continue; }

  let created = 0, skipped = 0, failed = 0;
  for (const raw of rows) {
    const data = map({ ...raw });
    try {
      const exists = await prisma[model].findUnique({ where: { id: data.id } }).catch(() => null);
      if (exists) { skipped++; continue; }
      if (!DRY) await prisma[model].create({ data });
      created++;
    } catch (e) {
      failed++;
      if (failed <= 3) console.log(`     ! ${table} id=${data.id}: ${String(e.message).split("\n")[0].slice(0, 110)}`);
    }
  }
  totalNew += created; totalSkip += skipped;
  const note = failed ? `, ошибок ${failed}` : "";
  console.log(`  ${table.padEnd(22)} перенесено ${created}, уже было ${skipped}${note}`);
}

console.log(`\nИтого: перенесено ${totalNew}, пропущено как существующие ${totalSkip}`);
if (DRY) console.log("Это была проверка. Запустите без --dry-run, чтобы записать.");

sqlite?.close();
await prisma.$disconnect();
