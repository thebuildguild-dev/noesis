#!/bin/sh
set -e

# Detect production (dist/ built by multi-stage) vs development
if [ -d /app/dist ]; then
  CONFIG_TARGET=/app/dist/config.js
  ENV_LABEL="production"
else
  CONFIG_TARGET=/app/public/config.js
  ENV_LABEL="development"
fi

cat > "$CONFIG_TARGET" << EOF
window.__APP_CONFIG__ = {
  APP_NAME: "${APP_NAME:-Noesis}",
  BACKEND_URL: "${BACKEND_URL:-http://localhost:5000}"
}
EOF

echo "[entrypoint] Generated $CONFIG_TARGET ($ENV_LABEL)"
echo "[entrypoint]   APP_NAME=${APP_NAME:-Noesis}"
echo "[entrypoint]   BACKEND_URL=${BACKEND_URL:-http://localhost:5000}"

exec "$@"
