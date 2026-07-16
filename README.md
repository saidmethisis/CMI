# Asosiy Aktiv — деловое медиа (Next-Gen News PWA)

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Prisma + SQLite.
Реальная авторизация, БД, роли и кабинеты. Запускается локально без внешних сервисов
(ключи Google/Resend и т.п. подключаются позже — см. `docs/INTEGRATIONS.md`).

---

## Как запустить

### Требования
- **Node.js 18+** (рекомендуется 20+), npm.

### Первый запуск
```bash
npm install          # зависимости (+ prisma generate)
npm run db:push      # создать таблицы в SQLite (prisma/dev.db)
npm run seed:demo    # залить демо-данные (аккаунты, статьи, компании, комментарии)
npm run dev          # http://localhost:3000
```
Остановить dev-сервер — `Ctrl+C`.

### Повседневная работа
```bash
npm run dev          # достаточно одной команды; горячая перезагрузка
```
Другой порт: `npm run dev -- -p 3123`

### Продакшн-режим (как реально работает сайт)
```bash
npm run build        # prisma generate + next build
npm run start        # http://localhost:3000
```

### ⚠️ Windows: если сборка падает с EPERM
Файл БД может держать запущенный процесс Node. Перед сборкой:
```bash
taskkill //F //IM node.exe     # (Git Bash)   или в cmd: taskkill /F /IM node.exe
npm run build
```

---

## Демо-аккаунты

Реальный вход через `/login`. Пароль у всех — **`aktiv12345`**.

| Роль | Логин | Кабинет |
|------|-------|---------|
| Супер-админ | `super@aktiv.uz` | `/admin` |
| Писатель (автор) | `aziz@aktiv.uz` | `/author-panel` |
| Компания | `owner@neobank.uz` | `/company` |
| Читатель | `reader@aktiv.uz` | `/account` |

Кабинет открывается по роли из меню пользователя в шапке (справа).

---

## Скрипты npm

```bash
npm run dev          # режим разработки
npm run build        # сборка (prisma generate + next build)
npm run start        # запуск собранного приложения
npm run seed:demo    # пересоздать чистые демо-данные
npm run db:push      # применить схему Prisma к БД
npm run db:studio    # веб-GUI для БД (Prisma Studio)
npm run db:reset     # ПОЛНЫЙ сброс БД (удаляет все данные!)
```

---

## Переменные окружения

Всё работает и без них (в dev). Для продакшна скопируйте `.env.example` в `.env` и заполните.
Полный гайд «как получить каждый ключ» — **`docs/INTEGRATIONS.md`**.

Кратко, что подключается через env:
- `DATABASE_URL` — БД (SQLite по умолчанию; для прода — PostgreSQL).
- `SITE_URL`, `AUTH_SECRET` — базовое (в проде `AUTH_SECRET` обязателен).
- **reCAPTCHA** — `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` (по умолчанию тестовые ключи Google).
- **Почта** (сброс пароля/verify) — `RESEND_API_KEY`, `EMAIL_FROM` (без ключа пишет в лог).
- **SEO/аналитика** — `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_YANDEX_VERIFICATION`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_YM_ID`, `ADS_TXT`.
- **Реквизиты организации** (правовые страницы) — `NEXT_PUBLIC_ORG_*`.

> `NEXT_PUBLIC_*` встраиваются при сборке — после их изменения нужен `npm run build` (или перезапуск dev).

---

## Что реализовано

**Публичная часть:** лента с фильтром рубрик и «Смотреть ещё», Stories, страница статьи (Focus Mode, AI-саммари, «Слушать», шеринг, похожие по тегам, комментарии с премодерацией), поиск с сортировкой, категории, страницы авторов, уведомления, 3 языка (RU/UZ/EN), тёмная тема, **PWA** (offline-оболочка).

**Авторизация:** вход/регистрация с Google reCAPTCHA, серверные сессии, **2FA (TOTP)** для authenticator-приложений, сброс пароля по email, согласие на обработку ПД.

**Кабинеты:**
- **Писатель** `/author-panel` — Notion-подобный дашборд, свои статьи (создание/черновик/правка/удаление), сторис, модерация комментариев к своим статьям, уведомления.
- **Компания** `/company` — статистика/аналитика/пресс-релизы/авторы из реальных данных, заявки (в БД), комментарии, сторис.
- **Админ** `/admin` — тёмный дашборд с реальной статистикой и графиками, очередь модерации, категории/Stories, роли, компании, авторы, пользователи, аккредитация, реклама, финансы.

**Правовое (нормы РУз):** `/privacy`, `/terms`, `/legal` (выходные данные), cookie-баннер, возрастная маркировка. Организационные шаги — `docs/COMPLIANCE-UZ.md`.

**SEO/интеграции:** JSON-LD, OpenGraph/Twitter, `sitemap.xml`, `robots.txt`, `ads.txt`, verification-мета, GA4/GTM/Яндекс.Метрика — всё через env.

---

## Стек и структура

Next.js 15 · React 19 · TypeScript · Tailwind 3 · Prisma 5 + SQLite.

```
src/
  app/            маршруты (страницы + /api/*)
  components/     общие UI-компоненты
  lib/            store (Prisma), auth, totp, email, upload, i18n, permissions …
prisma/           schema.prisma, dev.db (SQLite)
public/           manifest, sw.js, /uploads (загруженные медиа)
docs/             INTEGRATIONS.md, COMPLIANCE-UZ.md
scripts/          seed-demo.mjs
```

**Переход на PostgreSQL:** в `prisma/schema.prisma` смените `provider = "postgresql"`,
в `.env` — `DATABASE_URL=postgresql://…`, затем `npm run db:push`. Код доступа к данным не меняется.

---

## Осталось для прода (нужны внешние аккаунты/ключи)
Код-обвязка готова, активируется через env: боевые ключи reCAPTCHA, `RESEND_API_KEY` (почта),
OAuth (Google/Apple), хранилище медиа (S3/Blob вместо диска), биллинг (Payme/Click/Stripe),
хостинг данных граждан РУз на серверах в Узбекистане. Подробно — `docs/INTEGRATIONS.md`.
