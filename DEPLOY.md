# Развёртывание на сервере — Asosiy Aktiv

Практическое руководство по запуску в продакшене. Два пути: **VPS** (обычный
сервер, рекомендуется) и **Docker**. Оба рабочие — выберите один.

> **Важно про `NEXT_PUBLIC_*`.** Все переменные с префиксом `NEXT_PUBLIC_`
> (адрес сайта, ключ reCAPTCHA, ID аналитики, реквизиты организации) **вшиваются
> в клиентский бандл на этапе `npm run build`**, а не читаются в рантайме.
> Поэтому их нужно задать **до сборки**. Изменили — пересоберите (`npm run build`).

---

## 0. Предварительно: секреты и переменные

Сгенерируйте секрет подписи сессий (обязателен в проде):

```bash
openssl rand -hex 32
```

Минимальный набор для боевого запуска (`.env` на сервере):

```env
SITE_URL=https://ваш-домен.uz
NEXT_PUBLIC_SITE_URL=https://ваш-домен.uz
DATABASE_URL="file:./prisma/dev.db"        # SQLite (см. §4 про PostgreSQL)
AUTH_SECRET=<вывод openssl rand -hex 32>

# reCAPTCHA v2 — реальные ключи (иначе капча декоративна)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...

# Почта (сброс пароля / подтверждение email) — resend.com
RESEND_API_KEY=...
EMAIL_FROM="Asosiy Aktiv <noreply@ваш-домен.uz>"

# Реквизиты организации для правовых страниц (заполнить реальными данными)
NEXT_PUBLIC_ORG_NAME="..."
NEXT_PUBLIC_ORG_EDITOR="..."
NEXT_PUBLIC_ORG_EMAIL="..."
# ... остальные NEXT_PUBLIC_ORG_* и SEO/аналитика — см. .env.example
```

Полный список с пояснениями — в [.env.example](.env.example). Как получить каждый
ключ — в [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md). Юр. требования РУз —
[docs/COMPLIANCE-UZ.md](docs/COMPLIANCE-UZ.md).

Приложение **не стартует в проде**, если `AUTH_SECRET`/`DATABASE_URL`/`SITE_URL`
не заданы (проверка в `src/instrumentation.ts`), и **предупреждает** в логах, если
reCAPTCHA на тестовых ключах или не задан `RESEND_API_KEY`.

---

## 1. Путь A — VPS (Ubuntu/Debian, рекомендуется)

Требуется Node.js 20+ и обратный прокси (nginx) с TLS.

```bash
# 1) Код и зависимости
git clone <ваш-репозиторий> /var/www/aktiv && cd /var/www/aktiv
npm ci

# 2) Переменные окружения (см. §0) — до сборки!
nano .env

# 3) Схема БД + (опционально) демо-данные
npm run db:push
npm run seed:demo        # необязательно; создаёт демо-аккаунты и контент

# 4) Сборка и запуск
npm run build
npm run start            # слушает :3000
```

### Автозапуск через systemd

`/etc/systemd/system/aktiv.service`:

```ini
[Unit]
Description=Asosiy Aktiv
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/aktiv
EnvironmentFile=/var/www/aktiv/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now aktiv
sudo systemctl status aktiv
```

### nginx + TLS (Let's Encrypt)

```nginx
server {
    server_name ваш-домен.uz;
    client_max_body_size 32M;                 # под загрузку медиа (лимит 30 МБ)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo certbot --nginx -d ваш-домен.uz        # выпустит и подключит сертификат
```

Проверка: `curl https://ваш-домен.uz/api/health` → `{"status":"ok","db":"up"}`.

---

## 2. Путь B — Docker

```bash
# .env рядом с docker-compose.yml (см. §0). Как минимум SITE_URL и AUTH_SECRET.
docker compose up -d --build
docker compose logs -f web
```

- SQLite-файл и загруженные медиа хранятся в именованных volume'ах (`db`, `uploads`)
  — переживают пересоздание контейнера.
- Healthcheck встроен (`/api/health`).
- Меняли `NEXT_PUBLIC_*`? Нужна пересборка: `docker compose up -d --build`.

Проверка: `curl http://localhost:3000/api/health`. Прокси/TLS — так же через nginx (§1).

---

## 3. Хранение загруженных файлов

Медиа пишутся на диск в `public/uploads`.

- **VPS / Docker (постоянный диск/volume)** — работает как есть. Делайте бэкап каталога.
- **Serverless (Vercel и т.п.)** — файловая система эфемерна, файлы пропадут.
  Тогда нужно подключить внешнее хранилище (S3/R2/Blob) в
  [src/app/api/upload/route.ts](src/app/api/upload/route.ts) — интерфейс тот же
  (принимает data-URL, возвращает публичный URL).

---

## 4. База данных: SQLite → PostgreSQL

По умолчанию — **SQLite** (файл, без отдельного сервера). Этого достаточно для
одного инстанса и умеренной нагрузки. Для масштабирования на несколько инстансов
или serverless переходите на **PostgreSQL**:

1. В [prisma/schema.prisma](prisma/schema.prisma) поменяйте
   `provider = "sqlite"` → `provider = "postgresql"`.
2. `DATABASE_URL="postgresql://user:pass@host:5432/db"` в `.env`.
3. `npm run db:push` (создаст таблицы), затем `npm run seed:demo` при желании.

Код приложения менять не нужно — весь доступ идёт через Prisma.

> Rate-limit логина (`src/lib/auth.ts`) держится в памяти процесса — при нескольких
> инстансах он per-instance. Для строгого общего лимита вынесите в Redis (не блокер
> для запуска).

---

## 5. Бэкапы

- **SQLite:** копируйте файл БД (`prisma/dev.db` или volume `db`) по cron.
- **PostgreSQL:** `pg_dump` по расписанию.
- **Медиа:** архивируйте `public/uploads` (или volume `uploads`).

---

## 6. Чек-лист перед публичным запуском

- [ ] `AUTH_SECRET` — случайный, ≥ 32 символа
- [ ] Реальные ключи reCAPTCHA (не тестовые)
- [ ] `RESEND_API_KEY` + верифицированный домен отправителя
- [ ] `SITE_URL` = боевой домен (https)
- [ ] Заполнены `NEXT_PUBLIC_ORG_*` (реквизиты, редактор, возрастная маркировка)
- [ ] TLS-сертификат установлен, http → https редирект
- [ ] `curl /api/health` отвечает `ok`
- [ ] Настроен бэкап БД и `public/uploads`
- [ ] Сменены пароли демо-аккаунтов (или БД пересоздана без демо-данных)

> Правовые страницы (`/privacy`, `/terms`, `/legal`) используют плейсхолдеры до
> заполнения `NEXT_PUBLIC_ORG_*`. Регистрационные номера СМИ/реестра ПД внесите
> реальными и проверьте у юриста перед публикацией (нормы РУз).
