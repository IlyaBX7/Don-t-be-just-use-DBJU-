#!/usr/bin/env bash
# Вивантажує локальну базу (Docker-контейнер dbju_mysql) у файл backups/dbju-<дата>.sql —
# щоб перенести речі, користувачів і бронювання на сервер.
# Сесії входу, ліміти спроб і запити верифікації не переносяться (лише структура таблиць).
set -euo pipefail
cd "$(dirname "$0")/.."

CONTAINER="${DB_CONTAINER:-dbju_mysql}"
DB="${DB_NAME:-dbju}"
PASS="${DB_ROOT_PASSWORD:-rootpassword}"
OUT="backups/dbju-$(date +%Y%m%d-%H%M).sql"
SKIP=(Session RateLimitHit VerificationRequest)

mkdir -p backups
ignore=()
for t in "${SKIP[@]}"; do ignore+=("--ignore-table=$DB.$t"); done

dump() { docker exec "$CONTAINER" mariadb-dump -uroot -p"$PASS" --single-transaction --skip-lock-tables --no-tablespaces "$@"; }
{
  dump "${ignore[@]}" "$DB"
  dump --no-data "$DB" "${SKIP[@]}"
} > "$OUT"

echo "Готово: $OUT ($(du -h "$OUT" | cut -f1))"
echo "Імпорт на сервер:  mysql -h HOST -P PORT -u USER -p DBNAME < $OUT"
echo "Потім задайте пароль адміна:  ADMIN_PASSWORD=... npm run db:seed"
