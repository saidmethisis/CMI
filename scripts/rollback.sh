#!/usr/bin/env bash
# Ручной откат окружения на предыдущий образ.
#
#   ./scripts/rollback.sh production
#
# deploy.sh откатывается сам, если новая версия не прошла health-check.
# Этот скрипт — для случая, когда сайт поднялся, но повёл себя неправильно
# и надо срочно вернуть предыдущую версию.
#
# ВАЖНО: откат возвращает КОД, но не базу. Если новая версия успела применить
# миграцию, меняющую схему, — восстанавливайте базу из дампа:
#   ./scripts/restore-db.sh production backups/production-ГГГГММДД-ЧЧММСС.sql.gz

set -euo pipefail

ENV_NAME="${1:-}"
case "$ENV_NAME" in
  staging)    PROJECT="aktiv-staging"; ENV_FILE=".env.staging" ;;
  production) PROJECT="aktiv-prod";    ENV_FILE=".env.production" ;;
  *) echo "Использование: $0 {staging|production}" >&2; exit 2 ;;
esac

cd "$(dirname "$0")/.."

docker image inspect "${PROJECT}-web:rollback" >/dev/null 2>&1 \
  || { echo "Нет сохранённого образа ${PROJECT}-web:rollback — откатывать не на что." >&2; exit 1; }

echo "▶ Возвращаю предыдущий образ для $ENV_NAME"
docker tag "${PROJECT}-web:rollback" "${PROJECT}-web:latest"
docker compose --env-file "$ENV_FILE" -p "$PROJECT" up -d --no-build web

WEB_PORT="$(grep -E '^WEB_PORT=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"' ' || true)"
WEB_PORT="${WEB_PORT:-3000}"
for i in $(seq 1 30); do
  if curl -fsS --max-time 5 "http://127.0.0.1:${WEB_PORT}/api/health" 2>/dev/null | grep -q '"status":"ok"'; then
    echo "✔ Откат выполнен, сайт отвечает."
    exit 0
  fi
  sleep 2
done
echo "✖ После отката сайт не отвечает — смотрите логи:" >&2
echo "   docker compose --env-file $ENV_FILE -p $PROJECT logs --tail=80 web" >&2
exit 1
