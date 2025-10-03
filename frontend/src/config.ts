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
    const url = (
      (typeof process !== 'undefined' && process.env?.API_URL) ||
      (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
      (import.meta as any).env?.VITE_API_URL ||
      DEFAULTS.API_URL
    );
    console.log('[Config SSR] Using API_URL:', url);
    return url;
  }

  // Client-side (browser): MUST use runtime config
  // Runtime config is injected by entrypoint.sh at container start
  const runtimeConfig = window.__APP_CONFIG__?.API_URL;
  const buildTimeConfig = (import.meta as any).env?.VITE_API_URL;
  
  console.log('[Config Client] Runtime config:', runtimeConfig);
  console.log('[Config Client] Build-time config:', buildTimeConfig);
  console.log('[Config Client] Default:', DEFAULTS.API_URL);
  
  // Priority: runtime > build-time > default
  const url = runtimeConfig || buildTimeConfig || DEFAULTS.API_URL;
  console.log('[Config Client] Selected URL:', url);
  
  return url;
}

export const config = {
  get API_URL() {
    return getApiUrl();
  },
};

export type AppConfig = typeof config;
