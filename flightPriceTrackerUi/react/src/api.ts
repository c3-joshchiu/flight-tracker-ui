import axios from 'axios';
import type { AlertResult, FlightSearch, PriceSnapshot, SearchCreateInput } from '@/Interfaces';
import { getApiBase, getAuthTokenUrl } from '@/config';

const BASE = getApiBase();

let bearerToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

function fetchBearerToken(): Promise<string> {
  if (bearerToken) return Promise.resolve(bearerToken);
  if (tokenPromise) return tokenPromise;

  tokenPromise = axios
    .get(getAuthTokenUrl())
    .then((r) => {
      bearerToken = r.data.access_token;
      tokenPromise = null;
      return bearerToken!;
    })
    .catch((err) => {
      tokenPromise = null;
      throw err;
    });

  return tokenPromise;
}

axios.interceptors.request.use(async (config) => {
  if (config.url?.includes('/auth/token')) return config;

  const token = await fetchBearerToken();
  config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(undefined, async (error) => {
  const orig = error.config;
  if (error.response?.status === 401 && !orig._retry) {
    orig._retry = true;
    bearerToken = null;
    const token = await fetchBearerToken();
    orig.headers['Authorization'] = `Bearer ${token}`;
    return axios(orig);
  }
  return Promise.reject(error);
});

export const api = {
  searches: {
    list: (): Promise<FlightSearch[]> =>
      axios.get(`${BASE}/searches`).then((r) => r.data),

    get: (id: string): Promise<FlightSearch> =>
      axios.get(`${BASE}/searches/${id}`).then((r) => r.data),

    create: (data: SearchCreateInput): Promise<FlightSearch> =>
      axios.post(`${BASE}/searches`, data).then((r) => r.data),

    update: (id: string, data: { searchStatus: string }): Promise<FlightSearch> =>
      axios.patch(`${BASE}/searches/${id}`, data).then((r) => r.data),

    delete: (id: string): Promise<void> =>
      axios.delete(`${BASE}/searches/${id}`).then(() => undefined),
  },

  prices: {
    history: (searchId: string, seatClass?: string): Promise<PriceSnapshot[]> =>
      axios
        .get(`${BASE}/searches/${searchId}/prices`, {
          params: seatClass ? { seatClass } : {},
        })
        .then((r) => r.data),

    latest: (searchId: string): Promise<PriceSnapshot | null> =>
      axios.get(`${BASE}/searches/${searchId}/latest-price`).then((r) => r.data),

    fetch: (searchId: string): Promise<PriceSnapshot[]> =>
      axios.post(`${BASE}/searches/${searchId}/fetch`).then((r) => r.data),
  },

  alerts: {
    get: (searchId: string): Promise<AlertResult> =>
      axios.get(`${BASE}/searches/${searchId}/alert`).then((r) => r.data),
  },
};
