# Переезд боевого сайта на новую версию

Разовая операция: сайт переезжает со SQLite на PostgreSQL и получает стейджинг.
Дальше обновления будут обычными — см. [UPDATE.md](UPDATE.md).

> **Сайт сейчас лежит?** Сначала выполните «Шаг 0» — поднимите то, что есть.
> Переезд делается на спокойную голову, а не поверх аварии.

---

## Шаг 0. Сначала поднять текущий сайт

```bash
ssh <ваш-сервер>

# Где лежит проект и как он запущен — одно из двух:
systemctl status aktiv          # если через systemd
docker ps                       # если через Docker

# Логи последнего падения:
journalctl -u aktiv -n 100 --no-pager     # systemd
docker logs --tail=100 <имя-контейнера>   # docker

# Перезапуск:
sudo systemctl restart aktiv
# или
docker restart <имя-контейнера>
```

Проверка: `curl -s https://asosiy.net/api/health` → должно быть `{"status":"ok","db":"up"}`.

Если в браузере «Application error: a client-side exception» — **пришлите мне текст
ошибки из консоли браузера** (F12 → Console). Без него причину не определить:
сервер при этом отвечает, падает JS на стороне читателя.

---

## Шаг 1. Сохранить всё, что есть

**Не пропускайте.** На сервере лежит рабочий контент.

```bash
cd <каталог-проекта>            # например /var/www/aktiv
mkdir -p ~/aktiv-backup-$(date +%F)
BK=~/aktiv-backup-$(date +%F)

cp prisma/dev.db "$BK/"                    # база (если Docker — см. ниже)
cp .env "$BK/"                             # переменные окружения
tar czf "$BK/uploads.tar.gz" public/uploads   # загруженные картинки

ls -la "$BK"                               # убедитесь, что файлы на месте
```

Если проект в Docker и база в томе:

```bash
docker cp <имя-контейнера>:/data/dev.db "$BK/dev.db"
docker run --rm -v <имя-тома-uploads>:/u -v "$BK":/b alpine tar czf /b/uploads.tar.gz -C /u .
```

---

## Шаг 2. Забрать новый код

```bash
# на своей машине — отправить ветку в GitHub
git push origin staging
```

```bash
# на сервере — новые каталоги, отдельно на каждое окружение
sudo mkdir -p /var/www/aktiv-production /var/www/aktiv-staging
sudo chown $USER:$USER /var/www/aktiv-production /var/www/aktiv-staging
git clone https://github.com/saidmethisis/CMI.git /var/www/aktiv-production
git clone https://github.com/saidmethisis/CMI.git /var/www/aktiv-staging
```

Старый каталог **пока не трогайте** — он ваш запасной вариант.

---

## Шаг 3. Docker и переменные окружения

```bash
# Docker, если ещё нет
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

cd /var/www/aktiv-production
cp .env.production.example .env.production

openssl rand -hex 32     # → AUTH_SECRET
openssl rand -hex 24     # → POSTGRES_PASSWORD
nano .env.production
```

Заполнить обязательно:

```env
SITE_URL=https://asosiy.net
AUTH_SECRET=<сгенерированный>
POSTGRES_PASSWORD=<сгенерированный>
SUPERADMIN_EMAIL=admin@asosiy.net
SUPERADMIN_PASSWORD=<новый надёжный пароль>
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<из старого .env>
RECAPTCHA_SECRET_KEY=<из старого .env>
RESEND_API_KEY=<из старого .env>
```

> Значения с пробелами или скобками — **в кавычках**. Файл читается и как shell.

---

## Шаг 4. Поднять новую версию (сайт ещё на старой)

```bash
cd /var/www/aktiv-production
git checkout main && git merge origin/staging && git push origin main
npm run deploy:prod
```

Скрипт соберёт образ, поднимет Postgres, применит миграции и дождётся `/api/health`.
Слушать он будет `127.0.0.1:3000` — наружу пока ничего не изменилось.

Если что-то пошло не так — скрипт откатится сам, а старый сайт всё это время работает.

---

## Шаг 5. Перенести данные из старой базы

```bash
cd /var/www/aktiv-production

# сначала «на сухую» — ничего не пишет, только показывает, что перенесётся
docker compose --env-file .env.production -p aktiv-prod cp \
  ~/aktiv-backup-*/dev.db web:/tmp/old.db
docker compose --env-file .env.production -p aktiv-prod exec web \
  node scripts/migrate-sqlite-to-postgres.mjs /tmp/old.db --dry-run

# если картина верная — переносим
docker compose --env-file .env.production -p aktiv-prod exec web \
  node scripts/migrate-sqlite-to-postgres.mjs /tmp/old.db
```

Скрипт ничего не удаляет и пропускает уже существующие записи — его можно
запускать повторно, если что-то прервалось.

Картинки:

```bash
docker run --rm -v aktiv-prod_uploads:/u -v ~/aktiv-backup-$(date +%F):/b \
  alpine sh -c "tar xzf /b/uploads.tar.gz -C /u"
```

Проверка:

```bash
curl -s localhost:3000/api/health
curl -s localhost:3000/feed.xml | grep -c "<item>"    # столько же статей, сколько было
```

---

## Шаг 6. Переключить домен

```bash
sudo cp /var/www/aktiv-production/deploy/nginx.conf.example /etc/nginx/sites-available/aktiv
sudo nano /etc/nginx/sites-available/aktiv        # заменить домены на asosiy.net
sudo ln -sf /etc/nginx/sites-available/aktiv /etc/nginx/sites-enabled/aktiv
sudo nginx -t && sudo systemctl reload nginx
```

Проверьте `https://asosiy.net`. Всё хорошо — остановите старую версию:

```bash
sudo systemctl stop aktiv && sudo systemctl disable aktiv
# или: docker stop <старый-контейнер>
```

**Если что-то не так** — старый сайт поднимается обратно одной командой, а nginx
возвращается на прежний конфиг. Поэтому старый каталог и удаляем в последнюю очередь.

---

## Шаг 7. Стейджинг

```bash
cd /var/www/aktiv-staging
cp .env.staging.example .env.staging
nano .env.staging                # свои AUTH_SECRET и POSTGRES_PASSWORD, порт 3100
git checkout staging
npm run deploy:staging

sudo htpasswd -c /etc/nginx/.htpasswd-staging redaktsiya
sudo certbot --nginx -d staging.asosiy.net       # нужна A-запись в DNS
```

---

## Шаг 8. Бэкапы

```bash
crontab -e
```
```cron
0 3 * * * cd /var/www/aktiv-production && ./scripts/backup-db.sh production >> /var/log/aktiv-backup.log 2>&1
30 3 * * * docker run --rm -v aktiv-prod_uploads:/u -v /var/backups:/b alpine tar czf /b/uploads-$(date +\%F).tar.gz -C /u .
```

Копии должны уезжать за пределы сервера — иначе при отказе диска пропадут вместе с ним.

---

## Что делать, если сломалось на любом шаге

```bash
./scripts/rollback.sh production            # вернуть предыдущий образ
ls -t backups/production-*.sql.gz | head    # дампы
./scripts/restore-db.sh production <дамп>   # вернуть базу
```

Старый сайт остаётся нетронутым до Шага 6 — до этого момента откат бесплатный.
