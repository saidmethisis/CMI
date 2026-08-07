#!/usr/bin/env bash
# Дамп базы окружения в ./backups. Вызывается сам перед каждым деплоем,
# но можно и руками:  ./scripts/backup-db.sh production
#
# Восстановление из дампа — см. scripts/restore-db.sh

set -euo pipefail

ENV_NAME="${1:-}"
case "$ENV_NAME" in
  staging)    PROJECT="aktiv-staging"; ENV_FILE=".env.staging" ;;
  production) PROJECT="aktiv-prod";    ENV_FILE=".env.production" ;;
  *) echo "Использование: $0 {staging|production}" >&2; exit 2 ;;
esac

cd "$(dirname "$0")/.."
[ -f "$ENV_FILE" ] || { echo "Нет файла $ENV_FILE" >&2; exit 1; }

# shellcheck disable=SC1090
set -a; . "./$ENV_FILE"; set +a

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="backups/${ENV_NAME}-${STAMP}.sql.gz"

docker compose --env-file "$ENV_FILE" -p "$PROJECT" exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  | gzip > "$OUT"

# пустой дамп — это провал, а не успех: лучше остановить деплой
if [ ! -s "$OUT" ] || [ "$(gzip -dc "$OUT" | head -c 100 | wc -c)" -lt 20 ]; then
  rm -f "$OUT"
  echo "Дамп пустой — база недоступна?" >&2
  exit 1
fi

echo "  дамп: $OUT ($(du -h "$OUT" | cut -f1))"

# держим последние 20 дампов на окружение, остальные удаляем
ls -1t "backups/${ENV_NAME}-"*.sql.gz 2>/dev/null | tail -n +21 | xargs -r rm -f
