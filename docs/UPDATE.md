# Как обновить сайт

Короткая шпаргалка на каждый день. Полная настройка сервера с нуля — в [DEPLOY.md](../DEPLOY.md).

## Правило

```
работа здесь  →  ветка staging  →  проверили на staging.asosiyaktiv.uz  →  ветка main  →  боевой сайт
```

Прямо в `main` не коммитим. Боевой сайт обновляется только тем кодом, который
уже покрутили на стейджинге.

---

## 1. Сделали изменения (на своей машине)

```bash
git checkout staging
# ... правки ...
npm run build            # сначала убедитесь, что собирается локально
git add -A
git commit -m "Что сделали"
git push origin staging
```

## 2. Выкатили на стейджинг

На сервере:

```bash
cd /var/www/aktiv-staging
npm run deploy:staging
```

Скрипт сам: подтянет ветку `staging` → сделает дамп базы → соберёт образ →
поднимет контейнер → дождётся `/api/health`. Если новая версия не отвечает —
**автоматически вернёт предыдущую** и завершится с ошибкой.

Проверьте `https://staging.asosiyaktiv.uz` (спросит логин/пароль — это нормально,
стейджинг закрыт basic-auth). Пройдитесь по тому, что меняли.

## 3. Всё хорошо — выкатили на боевой

```bash
# на своей машине
git checkout main
git merge staging
git push origin main
```

```bash
# на сервере
cd /var/www/aktiv-production
npm run deploy:prod
```

Проверьте `https://asosiyaktiv.uz` и `curl https://asosiyaktiv.uz/api/health`.

---

## Если после выката что-то сломалось

Сайт поднялся, но ведёт себя неправильно:

```bash
./scripts/rollback.sh production
```

Вернётся предыдущий образ (он сохраняется при каждом деплое как
`aktiv-prod-web:rollback`). Занимает секунды.

Если новая версия успела изменить структуру базы — верните ещё и базу:

```bash
ls backups/                                    # дампы, свежие сверху
./scripts/restore-db.sh production backups/production-20260729-1240.sql.gz
```

---

## Меняли схему базы (prisma/schema.prisma)

Миграцию создавайте **у себя**, а не на сервере:

```bash
npm run db:up                                  # локальная база в Docker
npm run db:migrate -- --name add_something     # создаст prisma/migrations/...
git add prisma/migrations && git commit -m "Миграция: ..."
```

На сервере миграции применяются сами при старте контейнера (`prisma migrate deploy`).

> **Почему именно так.** `migrate deploy` применяет только те миграции, что лежат
> в репозитории, и никогда не удаляет данные. Если схема в базе разошлась с кодом —
> контейнер **не поднимется**, и сработает автооткат. Это лучше, чем `db push`,
> который молча подгонял бы боевую базу под схему и мог потерять колонку с данными.

---

## Полезные команды на сервере

```bash
# логи
docker compose --env-file .env.production -p aktiv-prod logs -f web
docker compose --env-file .env.staging    -p aktiv-staging logs -f web

# что запущено
docker compose --env-file .env.production -p aktiv-prod ps

# ручной бэкап базы
./scripts/backup-db.sh production

# консоль базы
docker compose --env-file .env.production -p aktiv-prod exec db psql -U aktiv -d aktiv_prod

# сбросить пароль админа (если заперлись снаружи)
docker compose --env-file .env.production -p aktiv-prod exec web \
  node scripts/set-admin-password.mjs admin@asosiyaktiv.uz "новый-пароль"
```

---

## Локальная разработка

```bash
npm run db:up        # поднять PostgreSQL в Docker (нужен запущенный Docker Desktop)
npm run db:deploy    # применить миграции
npm run dev
```

Первый супер-админ создаётся автоматически из `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`
в `.env` — но только на **пустой** базе. Если аккаунт уже есть, а пароль забыт:
`npm run admin:password`.

> Если dev-сервер вдруг падает с `Cannot read properties of undefined (reading 'call')` —
> это битый кэш сборки. Лечится: остановить сервер, `rm -rf .next`, запустить снова.
> Чаще всего возникает, если параллельно шла ещё одна сборка.
