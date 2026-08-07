#!/usr/bin/env bash
# Восстановление базы окружения из дампа.
#
#   ./scripts/restore-db.sh production backups/production-20260729-1240.sql.gz
#
# Операция разрушающая: текущее содержимое базы заменяется дампом.
# Поэтому перед восстановлением скрипт делает ещё один дамп «как было»
# и требует ввести имя окружения для подтверждения.

set -euo pipefail

ENV_NAME="${1:-}"
DUMP="${2:-}"
case "$ENV_NAME" in
  staging)    PROJECT="aktiv-staging"; ENV_FILE=".env.staging" ;;
  production) PROJECT="aktiv-prod";    ENV_FILE=".env.production" ;;
  *) echo "Использование: $0 {staging|production} <файл-дампа.sql.gz>" >&2; exit 2 ;;
esac
[ -f "$DUMP" ] || { echo "Файл дампа не найден: $DUMP" >&2; exit 1; }

cd "$(dirname "$0")/.."
# shellcheck disable=SC1090
set -a; . "./$ENV_FILE"; set +a

echo "Восстановление БЕЗВОЗВРАТНО заменит базу окружения '$ENV_NAME' содержимым:"
echo "  $DUMP"
printf "Введите '%s' для подтверждения: " "$ENV_NAME"
read -r CONFIRM
[ "$CONFIRM" = "$ENV_NAME" ] || { echo "Отменено."; exit 1; }

echo "▶ Сначала сохраняю текущее состояние"
./scripts/backup-db.sh "$ENV_NAME"

# Приложение нужно остановить на время заливки. Дамп начинается с DROP TABLE,
# а живые соединения Prisma держат блокировки — восстановление оборвалось бы
# на полпути и оставило базу наполовину старой, наполовину новой.
echo "▶ Останавливаю приложение (чтобы не мешало заливке)"
docker compose --env-file "$ENV_FILE" -p "$PROJECT" stop web

echo "▶ Заливаю дамп"
if gzip -dc "$DUMP" | docker compose --env-file "$ENV_FILE" -p "$PROJECT" exec -T db \
     psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1; then
  echo "▶ Запускаю приложение"
  docker compose --env-file "$ENV_FILE" -p "$PROJECT" start web
  echo "✔ Готово."
else
  echo "✖ Восстановление прервалось. Приложение оставлено остановленным," >&2
  echo "  чтобы оно не работало с повреждённой базой. Разберитесь и запустите:" >&2
  echo "    docker compose --env-file $ENV_FILE -p $PROJECT start web" >&2
  exit 1
fi
