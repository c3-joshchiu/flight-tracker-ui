const BACKEND_APP = 'flightpricetrackerapi';
const API_ENDPOINT = 'flights';

function getCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find(c => c.startsWith(`${name}=`))
    ?.split('=')[1];
}

/**
 * Resolves the backend API base URL at runtime.
 *
 * Strategy:
 *   1. Use c3AppUrlPrefix cookie if available — swap the app segment.
 *   2. Fall back to c3env cookie — build /<env>/<backendApp>/<endpoint>.
 *   3. Last resort: relative path (works when UI and API share a package).
 */
export function getApiBase(): string {
  const prefix = getCookie('c3AppUrlPrefix');

  if (prefix) {
    const parts = prefix.split('/');
    parts[parts.length - 1] = BACKEND_APP;
    return `/${parts.join('/')}/${API_ENDPOINT}`;
  }

  const env = getCookie('c3env');
  if (env) {
    return `/${env}/${BACKEND_APP}/${API_ENDPOINT}`;
  }

  return `./${API_ENDPOINT}`;
}
