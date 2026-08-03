#!/usr/bin/env bash
# Деплой Asosiy Aktiv в одно из окружений.
#
#   ./scripts/deploy.sh staging       — выкатить ветку staging на staging-окружение
#   ./scripts/deploy.sh production    — выкатить ветку main на боевой сайт
#
# Что делает, по шагам:
#   1. проверяет, что рабочее дерево чистое, и подтягивает нужную ветку
#   2. делает дамп базы (для продакшена — всегда, это точка отката)
#   3. собирает новый образ, НЕ трогая работающий контейнер
#   4. поднимает новый контейнер и ждёт, пока /api/health ответит ok
#   5. если здоровье не подтвердилось — откатывает на предыдущий образ и выходит с ошибкой
#
# Смысл: боевой сайт меняется только после того, как новая сборка доказала,
# что она поднимается и отвечает. Иначе всё остаётся как было.

set -euo pipefail

ENV_NAME="${1:-}"
case "$ENV_NAME" in
  staging)    BRANCH="staging"; PROJECT="aktiv-staging"; ENV_FILE=".env.staging" ;;
  production) BRANCH="main";    PROJECT="aktiv-prod";    ENV_FILE=".env.production" ;;
  *) echo "Использование: $0 {staging|production}" >&2; exit 2 ;;
esac

cd "$(dirname "$0")/.."
ROOT="$PWD"

# У каждого окружения — СВОЙ каталог с кодом. Если оба деплоить из одного git-дерева,
# `git checkout` переключает ветку под обоими: откат продакшена после выката стейджинга
# применил бы compose-файл и переменные из ветки staging.
EXPECTED_DIR="/var/www/aktiv-${ENV_NAME}"
if [ -d /var/www ] && [ "$ROOT" != "$EXPECTED_DIR" ]; then
  printf '\033[1;33m⚠ Внимание: деплой %s запущен из %s, а ожидался %s.\033[0m\n' "$ENV_NAME" "$ROOT" "$EXPECTED_DIR"
  printf '  Держите окружения в отдельных каталогах — иначе ветки будут мешать друг другу.\n'
  printf '  Продолжить? [y/N] '
  read -r ANSWER
  [ "$ANSWER" = "y" ] || exit 1
fi

log() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

[ -f "$ENV_FILE" ] || fail "Нет файла $ENV_FILE. Скопируйте из $ENV_FILE.example и заполните."

# порт окружения нужен для health-check снаружи контейнера
WEB_PORT="$(grep -E '^WEB_PORT=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"' ' || true)"
WEB_PORT="${WEB_PORT:-3000}"

DC=(docker compose --env-file "$ENV_FILE" -p "$PROJECT")

# ── 1. код ───────────────────────────────────────────────────────────────────
log "Обновляю код (ветка $BRANCH)"
if [ -n "$(git status --porcelain)" ]; then
  fail "На сервере есть незакоммиченные изменения. Разберитесь с ними: git status"
fi
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
echo "  коммит: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

# ── 2. бэкап базы ────────────────────────────────────────────────────────────
if "${DC[@]}" ps --status running --services 2>/dev/null | grep -qx db; then
  log "Делаю дамп базы (точка отката)"
  "$ROOT/scripts/backup-db.sh" "$ENV_NAME" || fail "Дамп не удался — деплой остановлен"
else
  log "База ещё не запущена — первый деплой, дамп пропускаю"
fi

# ── 3. сборка ────────────────────────────────────────────────────────────────
# Тегируем текущий образ как rollback, чтобы было куда вернуться.
CURRENT_IMAGE="$(docker inspect --format='{{.Image}}' "${PROJECT}-web-1" 2>/dev/null || true)"
if [ -n "$CURRENT_IMAGE" ]; then
  docker tag "$CURRENT_IMAGE" "${PROJECT}-web:rollback"
  echo "  предыдущий образ сохранён как ${PROJECT}-web:rollback"
fi

log "Собираю новый образ (работающий сайт пока не трогаю)"
"${DC[@]}" build web || fail "Сборка упала — на сайте ничего не изменилось"

# ── 4. запуск + проверка здоровья ────────────────────────────────────────────
log "Поднимаю контейнеры"
# Без `|| fail` set -e оборвал бы скрипт молча, не показав логов и не сделав откат.
"${DC[@]}" up -d || {
  printf '\n\033[1;31m✖ Контейнеры не поднялись.\033[0m\n'
  "${DC[@]}" logs --tail=60 web || true
  exit 1
}

log "Жду, пока сайт ответит на /api/health"
HEALTHY=0
for i in $(seq 1 40); do
  if curl -fsS --max-time 5 "http://127.0.0.1:${WEB_PORT}/api/health" 2>/dev/null | grep -q '"status":"ok"'; then
    HEALTHY=1
    echo "  здоров (проверка $i)"
    break
  fi
  sleep 3
done

# ── 5. откат, если не поднялся ───────────────────────────────────────────────
if [ "$HEALTHY" -ne 1 ]; then
  printf '\n\033[1;31m✖ Новая версия не отвечает. Откатываюсь.\033[0m\n'
  LOGS="$("${DC[@]}" logs --tail=80 web 2>&1 || true)"
  echo "$LOGS"

  # Самая частая причина, почему сайт не поднялся, — упавшая миграция: контейнер
  # стартует командой `prisma migrate deploy && next start`, и до Next дело не доходит.
  # Откат образа тут НЕ поможет: старый контейнер запустит ту же миграцию и упрётся
  # в P3009 («found failed migrations»). Такое чинится только восстановлением базы.
  if echo "$LOGS" | grep -qiE "P3009|migrate|migration"; then
    printf '\n\033[1;33m⚠ Похоже, упала миграция базы.\033[0m\n'
    echo "  Откат ОБРАЗА этого не исправит — база осталась в промежуточном состоянии."
    echo "  Восстановите её из дампа, снятого перед этим деплоем:"
    echo "    ls -t backups/${ENV_NAME}-*.sql.gz | head -1"
    echo "    ./scripts/restore-db.sh ${ENV_NAME} <файл-дампа>"
    echo "  И только потом повторяйте деплой."
  fi

  if docker image inspect "${PROJECT}-web:rollback" >/dev/null 2>&1; then
    docker tag "${PROJECT}-web:rollback" "${PROJECT}-web:latest"
    "${DC[@]}" up -d --no-build web || true
    # Проверяем, что откат действительно поднял сайт: раньше здесь безусловно
    # печаталось «откат выполнен», даже если сайт продолжал лежать.
    BACK_OK=0
    for i in $(seq 1 20); do
      if curl -fsS --max-time 5 "http://127.0.0.1:${WEB_PORT}/api/health" 2>/dev/null | grep -q '"status":"ok"'; then
        BACK_OK=1; break
      fi
      sleep 3
    done
    if [ "$BACK_OK" -eq 1 ]; then
      echo "✔ Откат выполнен — работает предыдущая версия."
    else
      printf '\033[1;31m✖ Откат НЕ помог: сайт по-прежнему не отвечает. Нужен ручной разбор.\033[0m\n'
    fi
  else
    echo "Предыдущего образа нет (первый деплой) — откатывать не на что."
  fi
  exit 1
fi

log "Готово: $ENV_NAME обновлён до $(git rev-parse --short HEAD)"
# Чистим только висячие образы ЭТОГО проекта. `docker image prune -f` без фильтра
# затронул бы и посторонние контейнеры, живущие на том же сервере.
docker image prune -f --filter "label=com.docker.compose.project=${PROJECT}" >/dev/null 2>&1 || true
