const BACKEND_APP = 'flightpricetrackerapi';
const API_ENDPOINT = 'flights';

/**
 * Resolves the backend API base URL at runtime using the c3AppUrlPrefix cookie.
 * Handles all three C3 AppUrl modes:
 *   - Cluster URL: prefix = "dev/flightpricetrackerui" → /dev/flightpricetrackerapi/flights
 *   - Env URL:     prefix = "flightpricetrackerui"     → /flightpricetrackerapi/flights
 *   - Vanity URL:  prefix = ""                          → /flightpricetrackerapi/flights
 */
export function getApiBase(): string {
  const prefix = document.cookie
    .split('; ')
    .find(c => c.startsWith('c3AppUrlPrefix='))
    ?.split('=')[1] ?? '';

  const parts = prefix.split('/');
  parts[parts.length - 1] = BACKEND_APP;
  const backendPrefix = parts.join('/');

  return `/${backendPrefix}/${API_ENDPOINT}`;
}
