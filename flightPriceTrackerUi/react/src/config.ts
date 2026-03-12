const BACKEND_APP = 'flightpricetrackerapi';
const API_ENDPOINT = 'flights';
const AUTH_ENDPOINT = 'auth';

export function getCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find(c => c.startsWith(`${name}=`))
    ?.split('=')[1];
}

function getAppBase(): string {
  const prefix = getCookie('c3AppUrlPrefix');
  if (prefix) return `/${prefix}`;

  const env = getCookie('c3env');
  const app = getCookie('c3app') ?? 'flightpricetrackerui';
  if (env) return `/${env}/${app}`;

  return '.';
}

export function getApiBase(): string {
  const prefix = getCookie('c3AppUrlPrefix');
  if (prefix) {
    const parts = prefix.split('/');
    parts[parts.length - 1] = BACKEND_APP;
    return `/${parts.join('/')}/${API_ENDPOINT}`;
  }

  const env = getCookie('c3env');
  if (env) return `/${env}/${BACKEND_APP}/${API_ENDPOINT}`;

  return `./${API_ENDPOINT}`;
}

export function getAuthTokenUrl(): string {
  return `${getAppBase()}/${AUTH_ENDPOINT}/token`;
}
