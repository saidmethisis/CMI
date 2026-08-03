# Asosiy Aktiv — деловое медиа (Next-Gen News PWA)

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Prisma + PostgreSQL.
Реальная авторизация, БД, роли и кабинеты.

---

## Как запустить локально

### Требования
- **Node.js 20+**, npm
- **Docker Desktop** — в нём поднимается локальная база

### Первый запуск
```bash
npm install          # зависимости (+ prisma generate)
npm run db:up        # поднять PostgreSQL в Docker (порт 5433)
npm run db:deploy    # применить миграции — создаст таблицы
npm run dev          # http://localhost:3000
```

Демо-данных нет и не будет: сайт наполняется только реальными материалами
редакции и авторов. На пустой базе автоматически создаются 7 рубрик и один
супер-админ из `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` в `.env`.

### Повседневная работа
```bash
npm run db:up        # если база остановлена
npm run dev
```
Другой порт: `npm run dev -- -p 3123`

### Продакшн-режим локально
```bash
npm run build
npm run start        # http://localhost:3000
```

> **Развёртывание на сервере** — **[DEPLOY.md](DEPLOY.md)**
> **Обновление работающего сайта** — **[docs/UPDATE.md](docs/UPDATE.md)**
> **Переезд со старой версии на SQLite** — **[docs/SERVER-MIGRATION.md](docs/SERVER-MIGRATION.md)**

### Если dev-сервер падает с `Cannot read properties of undefined (reading 'call')`
Это битый кэш сборки. Остановите сервер, удалите `.next`, запустите заново.
Возникает, когда параллельно работали две сборки или два dev-сервера — держите один.

---

## Вход

Учётной записи «по умолчанию» нет — супер-админ создаётся из `.env` при первом
запуске на пустой базе:

```env
SUPERADMIN_EMAIL=admin@ваш-домен
SUPERADMIN_PASSWORD=<ваш пароль>
```

Забыли пароль или аккаунт уже существует (сид его не перезапишет):

```bash
npm run admin:password                              # взять из .env
npm run admin:password -- admin@site.uz "Пароль"    # задать явно
```

Остальные учётные записи создаёт администратор:
- **Авторы** — `/admin/authors`: заполните e-mail и пароль, и вместе с профилем
  сразу создастся учётная запись с ролью «Автор» (кабинет `/author-panel`).
- **Сотрудники и компании** — `/admin/staff`.

---

## Скрипты npm

```bash
npm run dev              # режим разработки
npm run build            # сборка (prisma generate + next build)
npm run start            # запуск собранного приложения

npm run db:up            # поднять локальный PostgreSQL в Docker
npm run db:down          # остановить (данные сохраняются)
npm run db:deploy        # применить миграции
npm run db:migrate       # создать новую миграцию после правки schema.prisma
npm run db:studio        # веб-GUI для БД (Prisma Studio)
npm run db:reset         # ПОЛНЫЙ сброс БД (удаляет все данные!)

npm run admin:password   # задать пароль супер-админа
npm run deploy:staging   # выкатить на стейджинг (на сервере)
npm run deploy:prod      # выкатить на боевой (на сервере)
```

---

## Переменные окружения

Локально достаточно `.env` (уже есть). Для сервера — `.env.production.example`
и `.env.staging.example`. Полный гайд по ключам — **`docs/INTEGRATIONS.md`**.

- `DATABASE_URL` — PostgreSQL (`postgresql://…`)
- `SITE_URL`, `AUTH_SECRET` — в проде обязательны, приложение без них не стартует
- `APP_ENV` — `staging` закрывает сайт от индексации и включает плашку
- **reCAPTCHA** — `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`
- **Почта** — `RESEND_API_KEY`, `EMAIL_FROM` (без ключа письма пишутся в лог)
- **SEO/аналитика** — `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_YM_ID` и др.
- **Реквизиты организации** — `NEXT_PUBLIC_ORG_*` (правовые страницы)

> `NEXT_PUBLIC_*` встраиваются **при сборке**. Изменили — нужна пересборка.

> Локальный `.env.local` перекрывает `.env` и не попадает в git — в нём удобно
> держать тестовые ключи reCAPTCHA, которые работают на `localhost`.

---

## Что реализовано

**Публичная часть:** лента с фильтром рубрик, Stories, страница статьи (Focus Mode,
AI-саммари, «Слушать», шеринг, похожие по тегам, комментарии с премодерацией),
поиск, категории, страницы авторов, уведомления, **3 языка (RU/UZ/EN)**, тёмная
тема, **PWA**. Курсы валют ЦБ и **курсы покупки/продажи в 24 банках** (источник — bank.uz).

**Многоязычные статьи:** один материал содержит версии на ru/uz/en (вкладки в
редакторе). Читателю показывается его язык, при отсутствии перевода — язык оригинала.

**Авторизация:** вход/регистрация с reCAPTCHA, серверные сессии, **2FA (TOTP)**,
сброс пароля по email, согласие на обработку ПД. Суперадмин может войти под
другим пользователем («Войти как») и вернуться обратно.

**Кабинеты:**
- **Автор** `/author-panel` — свои статьи (создание, черновик, правка, удаление),
  предпросмотр до публикации, сторис, комментарии, уведомления
- **Компания** `/company` — статистика, пресс-релизы, авторы, заявки, комментарии
- **Админ** `/admin` — дашборд, очередь модерации, рубрики и Stories, роли,
  компании, авторы, пользователи, аккредитация, реклама, финансы

**Правовое (нормы РУз):** `/privacy`, `/terms`, `/legal`, cookie-баннер,
возрастная маркировка. Организационные шаги — `docs/COMPLIANCE-UZ.md`.

---

## Стек и структура

Next.js 15 · React 19 · TypeScript · Tailwind 3 · Prisma 5 + PostgreSQL 16.

```
src/
  app/            маршруты (страницы + /api/*), error.tsx, global-error.tsx
  components/     общие UI-компоненты
  lib/            store (Prisma), auth, i18n, permissions, bank-rates, currency …
prisma/           schema.prisma, migrations/
deploy/           пример конфига nginx на два окружения
docs/             UPDATE.md, SERVER-MIGRATION.md, INTEGRATIONS.md, COMPLIANCE-UZ.md
scripts/          deploy, rollback, backup/restore БД, set-admin-password
public/           manifest, sw.js, /uploads (загруженные медиа)
```

Схему БД меняйте через миграции: правка `prisma/schema.prisma` → `npm run db:migrate`
→ коммит папки `prisma/migrations`. На сервере они применяются сами при старте.
