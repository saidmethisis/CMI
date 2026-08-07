// Asosiy Aktiv — service worker (офлайн-оболочка + кэш чтения)
//
// Версия v2. Прошлая (v1) кэшировала подряд ВСЁ, что уходило GET-запросом с этого
// домена, включая /account, /admin, /author-panel и ответы /api/*. Cache Storage
// общий на весь домен и не очищается при выходе из аккаунта — на общем компьютере
// следующий человек мог получить из кэша чужой кабинет и чужие уведомления.
// Смена имени кэша заставляет старых клиентов удалить засорённый v1 при активации.
const CACHE = "aktiv-v2";
const SHELL = ["/offline", "/manifest.webmanifest"];

// Приватные разделы: не кэшируем и вообще не перехватываем.
const PRIVATE = /^\/(account|admin|author-panel|company|notifications|login|register|forgot)(\/|$)|^\/api\//;

// Сколько страниц держим в кэше, чтобы он не рос бесконечно.
const MAX_PAGES = 60;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Подрезаем кэш до MAX_PAGES по принципу «самые старые уходят первыми».
async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_PAGES) return;
  for (const k of keys.slice(0, keys.length - MAX_PAGES)) await cache.delete(k);
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Приватное — мимо кэша, всегда из сети.
  if (PRIVATE.test(url.pathname)) return;

  // Статика Next имеет хеш в имени и не меняется — берём из кэша сразу.
  // Раньше она каждый раз шла в сеть, из-за чего повторные заходы были
  // медленнее, чем вообще без service worker.
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(request).then((hit) =>
        hit || fetch(request).then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
          return res;
        })
      )
    );
    return;
  }

  // Страницы: сначала сеть, при отказе — кэш, затем офлайн-заглушка.
  e.respondWith(
    fetch(request)
      .then((res) => {
        // Кладём в кэш только успешные обычные ответы: раньше туда попадали
        // и 404, и 500, и потом отдавались как валидные.
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy).then(() => trim(c)));
        }
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match("/offline")))
  );
});
