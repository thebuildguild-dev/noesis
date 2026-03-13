#!/bin/sh
set -e

cat > /app/public/config.js << EOF
window.__APP_CONFIG__ = {
  APP_NAME: "${APP_NAME:-Noesis}",
  BACKEND_URL: "${BACKEND_URL:-http://localhost:5000}"
}
EOF

echo "[entrypoint] Generated public/config.js"
echo "[entrypoint]   APP_NAME=${APP_NAME:-Noesis}"
echo "[entrypoint]   BACKEND_URL=${BACKEND_URL:-http://localhost:5000}"

exec "$@"
