#!/usr/bin/env bash
# Copy local Docker Postgres data to Cloud SQL (metabolic-v1).
set -euo pipefail

LOCAL_HOST="${LOCAL_HOST:-localhost}"
LOCAL_PORT="${LOCAL_PORT:-5433}"
LOCAL_USER="${LOCAL_USER:-metabolic}"
LOCAL_PASSWORD="${LOCAL_PASSWORD:-metabolic_password}"
LOCAL_DB="${LOCAL_DB:-metabolic}"

PROJECT_ID="${PROJECT_ID:-metabolic-v1}"
REGION="${REGION:-us-central1}"
SQL_INSTANCE="${SQL_INSTANCE:-metabolic-db}"
PROXY_PORT="${PROXY_PORT:-5434}"

if [[ -z "${METABOLIC_DB_PASSWORD:-}" ]]; then
  echo "Set METABOLIC_DB_PASSWORD to your Cloud SQL password."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="${ROOT_DIR}/.tmp"
SQL_FILE="${TMP_DIR}/metabolic-local-data.sql"
LINKS_FILE="${TMP_DIR}/mealitem-links.sql"
mkdir -p "$TMP_DIR"

echo "==> Dump local database (${LOCAL_HOST}:${LOCAL_PORT})"
PGPASSWORD="$LOCAL_PASSWORD" pg_dump \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  --data-only \
  --exclude-table-data=_prisma_migrations \
  --no-owner \
  --no-acl \
  -F p \
  -f "$SQL_FILE"

# Cloud SQL may not support settings emitted by newer local Postgres builds.
sed '/^SET transaction_timeout/d' "$SQL_FILE" > "${SQL_FILE}.clean"
mv "${SQL_FILE}.clean" "$SQL_FILE"

echo "==> Prepare MealItem link updates (self-referencing FK)"
PGPASSWORD="$LOCAL_PASSWORD" psql \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -Atq > "$LINKS_FILE" <<'SQL'
SELECT format('UPDATE "MealItem" SET "linkedPlannedItemId" = %L WHERE id = %L;',
              "linkedPlannedItemId", id)
FROM "MealItem"
WHERE "linkedPlannedItemId" IS NOT NULL;
SQL

python3 <<'PY'
from pathlib import Path
path = Path("'"$SQL_FILE"'")
lines = path.read_text().splitlines(True)
out = []
in_mealitem = False
for line in lines:
    if line.startswith('COPY public."MealItem"'):
        in_mealitem = True
        out.append(line)
        continue
    if in_mealitem:
        if line.strip() == '\\.':
            in_mealitem = False
            out.append(line)
            continue
        parts = line.rstrip('\n').split('\t')
        if len(parts) >= 14:
            parts[13] = '\\N'
            out.append('\t'.join(parts) + '\n')
        else:
            out.append(line)
        continue
    out.append(line)
path.write_text(''.join(out))
PY

echo "==> Start Cloud SQL Auth Proxy on port ${PROXY_PORT}"
cloud-sql-proxy "${PROJECT_ID}:${REGION}:${SQL_INSTANCE}" --port "$PROXY_PORT" &
PROXY_PID=$!
trap 'kill $PROXY_PID 2>/dev/null || true' EXIT
sleep 3

echo "==> Clear existing Cloud SQL data (keep migrations)"
PGPASSWORD="$METABOLIC_DB_PASSWORD" psql \
  -h 127.0.0.1 \
  -p "$PROXY_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE TABLE
  "SmsMessage",
  "AiFoodLookup",
  "AiExerciseLookup",
  "ExerciseLog",
  "ScheduledExercise",
  "Exercise",
  "MealItem",
  "Meal",
  "DailyLog",
  "ProgramMetricSnapshotValue",
  "ProgramMetricSnapshot",
  "ProgramMetric",
  "Program",
  "FoodAlias",
  "Food",
  "CoachAssignment",
  "UserOrganization",
  "Organization",
  "User",
  "MealTemplate",
  "ExerciseTemplate",
  "ProgramTemplate"
CASCADE;
SQL

echo "==> Restore local data to Cloud SQL"
PGPASSWORD="$METABOLIC_DB_PASSWORD" psql \
  -h 127.0.0.1 \
  -p "$PROXY_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -v ON_ERROR_STOP=1 \
  -f "$SQL_FILE"

PGPASSWORD="$METABOLIC_DB_PASSWORD" psql \
  -h 127.0.0.1 \
  -p "$PROXY_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -v ON_ERROR_STOP=1 \
  -f "$LINKS_FILE"

echo "==> Verify row counts"
PGPASSWORD="$METABOLIC_DB_PASSWORD" psql \
  -h 127.0.0.1 \
  -p "$PROXY_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -c 'SELECT '"'"'User'"'"' AS table, count(*) FROM "User"
     UNION ALL SELECT '"'"'Program'"'"', count(*) FROM "Program"
     UNION ALL SELECT '"'"'Food'"'"', count(*) FROM "Food";'

echo ""
echo "Done. Data copied to Cloud SQL."
