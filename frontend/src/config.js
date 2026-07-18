// Single source of truth for the backend base URL.
// Set VITE_API_URL in frontend/.env (see .env.example) to point at a different
// backend, e.g. for staging/production deploys. Falls back to local dev default.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:6001/api';
