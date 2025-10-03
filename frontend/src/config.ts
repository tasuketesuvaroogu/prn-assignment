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

// Lazy getter to ensure runtime config is read when accessed (not at module load)
function getApiUrl(): string {
  // Server-side (SSR): read from process.env
  if (typeof window === 'undefined') {
    // In production Docker, API_URL or VITE_API_URL will be set in the container
    // In dev SSR, use Vite env or default
    return (
      (typeof process !== 'undefined' && process.env?.API_URL) ||
      (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
      (import.meta as any).env?.VITE_API_URL ||
      DEFAULTS.API_URL
    );
  }

  // Client-side (browser): prefer runtime config
  if (window.__APP_CONFIG__?.API_URL) {
    return window.__APP_CONFIG__.API_URL;
  }
  
  // Fallback to build-time env
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  
  // Default
  return DEFAULTS.API_URL;
}

export const config = {
  get API_URL() {
    return getApiUrl();
  },
};

export type AppConfig = typeof config;
