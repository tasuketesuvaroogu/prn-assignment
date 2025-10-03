
// Configuration loaded from Vite environment variables (VITE_*) with safe defaults.
// Use a .env or .env.local file in the frontend/ directory for development.

const DEFAULTS = {
  API_URL: 'http://localhost:5000/api',
};

// import.meta.env is provided by Vite. Vite requires env vars to be prefixed with VITE_.
const API_URL = ((import.meta as any).env?.VITE_API_URL ?? DEFAULTS.API_URL) as string;

export const config = {
  API_URL,
};

export type AppConfig = typeof config;

