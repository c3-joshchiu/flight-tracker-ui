const API_ENDPOINT = 'flights';

export function getCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find(c => c.startsWith(`${name}=`))
    ?.split('=')[1];
}

export function getApiBase(): string {
  const prefix = getCookie('c3AppUrlPrefix');
  if (prefix) return `/${prefix}/${API_ENDPOINT}`;

  const env = getCookie('c3env');
  const app = getCookie('c3app') ?? 'flightpricetrackerui';
  if (env) return `/${env}/${app}/${API_ENDPOINT}`;

  return `./${API_ENDPOINT}`;
}
