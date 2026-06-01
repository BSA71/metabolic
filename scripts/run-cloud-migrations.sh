#!/usr/bin/env bash
# Apply Prisma migrations to Cloud SQL (production).
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-metabolic-v1}"
REGION="${REGION:-us-central1}"
SQL_INSTANCE="${SQL_INSTANCE:-metabolic-db}"
CONNECTION="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
PROXY_PORT="${PROXY_PORT:-5432}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Run database migrations"

if [[ ! -x "${ROOT_DIR}/node_modules/.bin/prisma" ]]; then
  echo "Installing dependencies for migrations..."
  npm ci
fi

if command -v cloud-sql-proxy >/dev/null 2>&1; then
  PROXY_BIN="cloud-sql-proxy"
elif [[ -x "${ROOT_DIR}/.tmp/cloud-sql-proxy" ]]; then
  PROXY_BIN="${ROOT_DIR}/.tmp/cloud-sql-proxy"
else
  mkdir -p "${ROOT_DIR}/.tmp"
  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64) PROXY_ARCH="darwin.arm64" ;;
    Darwin-x86_64) PROXY_ARCH="darwin.amd64" ;;
    Linux-x86_64) PROXY_ARCH="linux.amd64" ;;
    Linux-aarch64) PROXY_ARCH="linux.arm64" ;;
    *)
      echo "Unsupported platform for cloud-sql-proxy download."
      exit 1
      ;;
  esac
  PROXY_VERSION="v2.14.3"
  PROXY_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${PROXY_VERSION}/cloud-sql-proxy.${PROXY_ARCH}"
  curl -fsSL "$PROXY_URL" -o "${ROOT_DIR}/.tmp/cloud-sql-proxy"
  chmod +x "${ROOT_DIR}/.tmp/cloud-sql-proxy"
  PROXY_BIN="${ROOT_DIR}/.tmp/cloud-sql-proxy"
fi

RAW_URL="$(gcloud secrets versions access latest --secret=DATABASE_URL --project="$PROJECT_ID")"

MIGRATION_URL="$(
  RAW_DATABASE_URL="$RAW_URL" PROXY_PORT="$PROXY_PORT" python3 <<'PY'
import os
import urllib.parse

raw = os.environ["RAW_DATABASE_URL"]
port = os.environ["PROXY_PORT"]
parsed = urllib.parse.urlparse(raw)

if "@" in parsed.netloc:
    auth, _host = parsed.netloc.rsplit("@", 1)
    netloc = f"{auth}@127.0.0.1:{port}"
else:
    netloc = f"127.0.0.1:{port}"

query = urllib.parse.parse_qs(parsed.query)
query.pop("host", None)
new_query = urllib.parse.urlencode(query, doseq=True)

print(
    urllib.parse.urlunparse(
        (parsed.scheme, netloc, parsed.path, parsed.params, new_query, parsed.fragment)
    )
)
PY
)"

echo "==> Start Cloud SQL Auth Proxy on port ${PROXY_PORT}"
"$PROXY_BIN" "$CONNECTION" --port "$PROXY_PORT" &
PROXY_PID=$!
trap 'kill $PROXY_PID 2>/dev/null || true' EXIT

proxy_ready=false
for _ in $(seq 1 30); do
  if python3 -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('127.0.0.1', int('${PROXY_PORT}'))); s.close()" 2>/dev/null; then
    proxy_ready=true
    break
  fi
  sleep 1
done

if [[ "$proxy_ready" != "true" ]]; then
  echo "Cloud SQL proxy did not become ready."
  exit 1
fi

cd "$ROOT_DIR"
export DATABASE_URL="$MIGRATION_URL"
npm run db:deploy --workspace server

echo "==> Migrations complete"
