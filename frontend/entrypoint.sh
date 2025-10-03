#!/bin/sh
set -eu

# Prefer API_URL, fall back to VITE_API_URL, then dev default
API_URL_ENV="${API_URL:-}"
if [ -z "$API_URL_ENV" ]; then
  API_URL_ENV="${VITE_API_URL:-}"
fi
if [ -z "$API_URL_ENV" ]; then
  API_URL_ENV="http://localhost:6124/api"
fi

# Write runtime config consumed by index.html (served from dist/)
cat > /app/dist/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL_ENV}"
};
EOF

PORT="${PORT:-5244}"
exec node server/entry.fastify.js
