# Развёртывание — Asosiy Aktiv

Настройка сервера с нуля. Ежедневное обновление сайта — в [docs/UPDATE.md](docs/UPDATE.md).

## Схема

На одном VPS живут **два независимых окружения**:

| | Боевой сайт | Стейджинг |
|---|---|---|
| Домен | `asosiy.net` | `staging.asosiy.net` |
| Ветка git | `main` | `staging` |
| Порт (внутренний) | 3000 | 3100 |
| Проект Docker | `aktiv-prod` | `aktiv-staging` |
| Env-файл | `.env.production` | `.env.staging` |
| База | `aktiv_prod` | `aktiv_staging` |
| Доступ | открыт | закрыт паролем |
| Индексация | да | запрещена |

У каждого окружения **свой контейнер базы, свой том с загрузками и свои секреты** —
пересечься они не могут. Тесты на стейджинге не способны испортить боевые данные.

> **Про `NEXT_PUBLIC_*`.** Эти переменные вшиваются в клиентский бандл **на этапе
> сборки**, а не читаются в рантайме. Поменяли — нужна пересборка (`deploy.sh` её делает).

---

## 1. Подготовка сервера

Ubuntu 22.04+, 2 ГБ RAM минимум (лучше 4 — на сервере крутятся два приложения и две базы).

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# nginx + certbot
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx apache2-utils git

# код — ОТДЕЛЬНЫЙ каталог на каждое окружение
sudo mkdir -p /var/www/aktiv-production /var/www/aktiv-staging
sudo chown $USER:$USER /var/www/aktiv-production /var/www/aktiv-staging
git clone <ваш-репозиторий> /var/www/aktiv-production
git clone <ваш-репозиторий> /var/www/aktiv-staging
```

> **Почему два каталога, а не один.** Деплой переключает ветку (`git checkout`).
> В общем каталоге после выката стейджинга дерево остаётся на ветке `staging`, и
> следующий откат продакшена применил бы **staging-версию** compose-файла: другие
> порты, другие переменные, другие тома. `deploy.sh` предупредит, если запущен не
> из своего каталога.

## 2. DNS

Две A-записи на IP сервера:

```
asosiy.net          A   <IP>
www.asosiy.net      A   <IP>
staging.asosiy.net  A   <IP>
```

## 3. Переменные окружения

```bash
cp .env.production.example .env.production
cp .env.staging.example    .env.staging
openssl rand -hex 32        # AUTH_SECRET для прода
openssl rand -hex 32        # AUTH_SECRET для стейджинга — ДРУГОЙ
openssl rand -hex 24        # POSTGRES_PASSWORD (свой для каждого окружения)
nano .env.production
nano .env.staging
```

Обязательно заполнить в `.env.production`: `SITE_URL`, `AUTH_SECRET`,
`POSTGRES_PASSWORD`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`, боевые ключи reCAPTCHA.
Приложение **не стартует**, если `AUTH_SECRET` / `DATABASE_URL` / `SITE_URL` не заданы
(проверка в [src/instrumentation.ts](src/instrumentation.ts)).

> Оба файла в `.gitignore` — секреты в репозиторий не попадают.

## 4. nginx и TLS

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/aktiv
sudo nano /etc/nginx/sites-available/aktiv          # подставьте свои домены
sudo ln -s /etc/nginx/sites-available/aktiv /etc/nginx/sites-enabled/aktiv
sudo rm -f /etc/nginx/sites-enabled/default

# пароль на стейджинг
sudo htpasswd -c /etc/nginx/.htpasswd-staging redaktsiya

sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d asosiy.net -d www.asosiy.net -d staging.asosiy.net
```

## 5. Первый запуск

```bash
git checkout staging && npm run deploy:staging
git checkout main    && npm run deploy:prod
```

Скрипт соберёт образ, поднимет базу и приложение, применит миграции и проверит здоровье.

Проверка:

```bash
curl https://asosiy.net/api/health          # {"status":"ok","db":"up"}
curl -u redaktsiya:пароль https://staging.asosiy.net/api/health
```

Первый супер-админ создаётся автоматически из `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`
на пустой базе. Войдите в `/admin` и сразу смените пароль.

---

## 6. Бэкапы

`deploy.sh` делает дамп базы **перед каждым выкатом** в `./backups`
(хранятся последние 20 на окружение). Дополнительно — ночной бэкап по cron:

```bash
crontab -e
```
```cron
0 3 * * * cd /var/www/aktiv-production && ./scripts/backup-db.sh production >> /var/log/aktiv-backup.log 2>&1
```

Загруженные медиа лежат в Docker-томе — их тоже нужно архивировать:

```cron
30 3 * * * docker run --rm -v aktiv-prod_uploads:/u -v /var/backups:/b alpine \
  tar czf /b/uploads-$(date +\%F).tar.gz -C /u .
```

> Дампы и архивы держите **не только на этом сервере** — иначе при отказе диска
> пропадут вместе с ним. Настройте выгрузку в S3/облако или на второй хост.

Восстановление: `./scripts/restore-db.sh production backups/production-….sql.gz`

---

## 7. Что делать, если сайт упал

```bash
docker compose --env-file .env.production -p aktiv-prod ps          # что живо
docker compose --env-file .env.production -p aktiv-prod logs --tail=100 web
./scripts/rollback.sh production                                    # вернуть прошлую версию
```

---

## 8. Чек-лист перед публичным запуском

- [ ] `AUTH_SECRET` — случайный, ≥ 32 символа, **разный** у прода и стейджинга
- [ ] `POSTGRES_PASSWORD` — случайный, разный у окружений
- [ ] `SUPERADMIN_PASSWORD` — не из README и не из примеров
- [ ] Боевые ключи reCAPTCHA для домена прода (не тестовые)
- [ ] `RESEND_API_KEY` + верифицированный домен отправителя
- [ ] TLS выпущен, http → https редирект работает
- [ ] Стейджинг закрыт basic-auth и отдаёт `Disallow: /` в robots.txt
- [ ] `curl /api/health` отвечает `ok` на обоих окружениях
- [ ] Ночной бэкап в cron, копии уезжают за пределы сервера
- [ ] Заполнены `NEXT_PUBLIC_ORG_*` (реквизиты, редактор, возрастная маркировка)

---

## Приложение: хранилище медиа

Файлы пишутся на диск в `public/uploads` (том `uploads`). Для serverless-хостинга
(Vercel и т.п.) файловая система эфемерна — там нужно подключить S3/R2 в
[src/app/api/upload/route.ts](src/app/api/upload/route.ts); интерфейс тот же
(принимает data-URL, возвращает публичный URL).
