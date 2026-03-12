import axios from 'axios';
import type { AlertResult, FlightSearch, PriceSnapshot, SearchCreateInput } from '@/Interfaces';
import { getApiBase, getCookie } from '@/config';

const BASE = getApiBase();

// The c3auth cookie is path-scoped to the UI app, so the browser won't
// send it on cross-app requests to the API. Read it from document.cookie
// and attach it as an Authorization header instead.
axios.interceptors.request.use((config) => {
  const token = getCookie('c3auth');
  if (token) {
    config.headers['Authorization'] = token;
  }
  return config;
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
