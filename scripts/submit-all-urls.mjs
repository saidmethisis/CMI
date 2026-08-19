// Разовая отправка всех адресов сайта в IndexNow (Яндекс и Bing).
//
// Нужна один раз, после подключения: материалы, опубликованные раньше, ни
// в какое уведомление не попали — о них поисковик узнает только при обходе,
// а обход нового сайта идёт неделями. Дальше каждая публикация уведомляет
// о себе сама.
//
// Запуск: node scripts/submit-all-urls.mjs [--dry]
import { readFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const env = {};
for (const f of [".env.production", ".env"]) {
  try {
    readFileSync(f, "utf8").split(/\r?\n/).forEach((l) => {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    });
  } catch {}
}
const SITE = (env.NEXT_PUBLIC_SITE_URL || env.SITE_URL || "https://asosiy.net").replace(/\/$/, "");
const KEY = (process.env.INDEXNOW_KEY || env.INDEXNOW_KEY || "").trim();

if (!KEY) { console.error("INDEXNOW_KEY не задан — нечего отправлять"); process.exit(1); }

// Адреса берём из карты сайта: она уже содержит всё, что должно быть в поиске,
// включая языковые версии. Дублировать логику обхода базы незачем.
const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
// Языковые версии перечислены отдельными ссылками внутри записи.
const alts = [...xml.matchAll(/<xhtml:link[^>]+href="([^"]+)"/g)].map((m) => m[1]);
const all = [...new Set([...urls, ...alts])].filter((u) => u.startsWith(SITE));

console.log(`Адресов к отправке: ${all.length}`);
if (DRY) { all.slice(0, 10).forEach((u) => console.log("  " + u)); console.log("  … (пробный прогон, ничего не отправлено)"); process.exit(0); }

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE).hostname,
    key: KEY,
    keyLocation: `${SITE}/indexnow-key.txt`,
    urlList: all.slice(0, 10000),
  }),
});
console.log(`Ответ IndexNow: ${res.status} ${res.status === 200 || res.status === 202 ? "— принято" : "— отклонено"}`);
if (res.status !== 200 && res.status !== 202) console.log((await res.text()).slice(0, 300));
