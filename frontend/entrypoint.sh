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

echo "=== Qwik Entrypoint ==="
echo "Injecting runtime config: API_URL=${API_URL_ENV}"

# Export API_URL for the Node.js server process (used by SSR)
export API_URL="${API_URL_ENV}"
export VITE_API_URL="${API_URL_ENV}"

# Write runtime config for client-side (served from dist/)
cat > /app/dist/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL_ENV}"
};
EOF

echo "Config file created at /app/dist/config.js"
cat /app/dist/config.js

PORT="${PORT:-5244}"
echo "Starting Fastify server on port ${PORT}..."
echo "Server will use API_URL=${API_URL} for SSR requests"
exec node server/entry.fastify.js
