// Configuration: prefer runtime-injected window.__APP_CONFIG__ (for production Docker),
// fall back to Vite build-time env (VITE_*), then safe defaults for dev.
// Runtime injection is done by entrypoint.sh in Docker (writes /dist/config.js).

declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_URL?: string;
    };
  }
}

const DEFAULTS = {
  API_URL: 'http://localhost:6124/api',
};

// Prefer runtime config, then Vite env, then default
const API_URL =
  (typeof window !== 'undefined' && window.__APP_CONFIG__?.API_URL) ||
  ((import.meta as any).env?.VITE_API_URL ?? DEFAULTS.API_URL);

export const config = {
  API_URL,
};

export type AppConfig = typeof config;
