import axios from 'axios';
import type { AlertResult, ExportData, FlightSearch, ImportPayload, ImportReport, PriceSnapshot, SearchCreateInput } from '@/Interfaces';
import { getApiBase } from '@/config';

const BASE = getApiBase();

// --- temporary debug logging (remove after proxy is stable) ---
console.log('[api] BASE url resolved to:', BASE);
console.log('[api] cookies:', document.cookie);

axios.interceptors.request.use((cfg) => {
  console.log(`[api] → ${cfg.method?.toUpperCase()} ${cfg.url}`);
  return cfg;
});

axios.interceptors.response.use(
  (res) => {
    console.log(`[api] ← ${res.status} ${res.config.url}`, res.data);
    return res;
  },
  (err) => {
    const r = err.response;
    if (r) {
      console.error(`[api] ← ${r.status} ${r.config?.url}`, r.data);
    } else {
      console.error('[api] ← network error', err.message);
    }
    return Promise.reject(err);
  },
);
// --- end debug logging ---

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'objs' in data && Array.isArray((data as Record<string, unknown>).objs))
    return (data as Record<string, unknown>).objs as T[];
  if (data && typeof data === 'object' && 'value' in data && Array.isArray((data as Record<string, unknown>).value))
    return (data as Record<string, unknown>).value as T[];
  console.warn('[api] unexpected list response shape:', data);
  return [];
}

function unwrapOne<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'value' in data)
    return (data as Record<string, unknown>).value as T;
  return data as T;
}

export const api = {
  searches: {
    list: (): Promise<FlightSearch[]> =>
      axios.get(`${BASE}/searches`).then((r) => unwrapList<FlightSearch>(r.data)),

    get: (id: string): Promise<FlightSearch> =>
      axios.get(`${BASE}/searches/${id}`).then((r) => unwrapOne<FlightSearch>(r.data)),

    create: (data: SearchCreateInput): Promise<FlightSearch> =>
      axios.post(`${BASE}/searches`, data).then((r) => unwrapOne<FlightSearch>(r.data)),

    update: (id: string, data: { searchStatus: string }): Promise<FlightSearch> =>
      axios.patch(`${BASE}/searches/${id}`, data).then((r) => unwrapOne<FlightSearch>(r.data)),

    delete: (id: string): Promise<void> =>
      axios.delete(`${BASE}/searches/${id}`).then(() => undefined),
  },

  prices: {
    history: (searchId: string, seatClass?: string): Promise<PriceSnapshot[]> =>
      axios
        .get(`${BASE}/searches/${searchId}/prices`, {
          params: seatClass ? { seatClass } : {},
        })
        .then((r) => unwrapList<PriceSnapshot>(r.data)),

    latest: (searchId: string): Promise<PriceSnapshot | null> =>
      axios.get(`${BASE}/searches/${searchId}/latest-price`).then((r) => unwrapOne<PriceSnapshot | null>(r.data)),

    fetch: (searchId: string): Promise<PriceSnapshot[]> =>
      axios.post(`${BASE}/searches/${searchId}/fetch`).then((r) => unwrapList<PriceSnapshot>(r.data)),
  },

  alerts: {
    get: (searchId: string): Promise<AlertResult> =>
      axios.get(`${BASE}/searches/${searchId}/alert`).then((r) => unwrapOne<AlertResult>(r.data)),
  },

  data: {
    exportAll: (format: 'csv' | 'json'): Promise<string | ExportData> => {
      if (format === 'json') {
        return axios.get(`${BASE}/export`, { params: { format } })
          .then((r) => r.data as ExportData);
      }
      return axios.get(`${BASE}/export`, {
        params: { format },
        responseType: 'text',
        transformResponse: [(data: string) => data],
      }).then((r) => r.data as string);
    },

    exportSearch: (searchId: string, format: 'csv' | 'json'): Promise<string | ExportData> => {
      if (format === 'json') {
        return axios.get(`${BASE}/export/snapshots`, { params: { format, searchId } })
          .then((r) => r.data as ExportData);
      }
      return axios.get(`${BASE}/export/snapshots`, {
        params: { format, searchId },
        responseType: 'text',
        transformResponse: [(data: string) => data],
      }).then((r) => r.data as string);
    },

    importData: (data: ImportPayload): Promise<ImportReport> =>
      axios.put(`${BASE}/import`, data).then((r) => unwrapOne<ImportReport>(r.data)),
  },
};
