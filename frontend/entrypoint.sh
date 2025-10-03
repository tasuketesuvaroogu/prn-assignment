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
echo "Writing config to /app/dist/config.js"
cat > /app/dist/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL_ENV}"
};
console.log('[Entrypoint] Config loaded:', window.__APP_CONFIG__);
EOF

echo "=== Config file contents ==="
cat /app/dist/config.js
echo "==="
echo "=== Checking if config.js is readable ==="
ls -la /app/dist/config.js
echo "==="

PORT="${PORT:-5244}"
echo "Starting Fastify server on port ${PORT}..."
echo "Server will use API_URL=${API_URL} for SSR requests"
exec node server/entry.fastify.js
