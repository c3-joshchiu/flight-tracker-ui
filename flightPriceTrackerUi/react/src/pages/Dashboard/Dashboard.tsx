import { useCallback, useEffect, useState } from 'react';
import AlertFlow from '@/components/AlertFlow/AlertFlow';
import AlertFlowSkeleton from '@/components/AlertFlow/AlertFlowSkeleton';
import PriceChart from '@/components/PriceChart/PriceChart';
import SearchForm from '@/components/SearchForm/SearchForm';
import SearchSelector from '@/components/SearchSelector/SearchSelector';
import { ToastContainer, useToast } from '@/components/Toast/Toast';
import axios from 'axios';
import { api } from '@/api';
import type { AlertResult, FlightSearch, PriceSnapshot, SearchCreateInput } from '@/Interfaces';

function extractMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const r = err.response;
    const url = r?.config?.url ?? err.config?.url ?? '?';
    const status = r?.status ?? 'no response';
    const body = r?.data ? JSON.stringify(r.data) : '';
    return `${err.message} | ${status} ${url} ${body}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export default function Dashboard() {
  const [searches, setSearches] = useState<FlightSearch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertResult | null>(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const [latestPrice, setLatestPrice] = useState<PriceSnapshot | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [chartRefresh, setChartRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toasts, show: showToast } = useToast();

  const selected = searches.find((s) => s.id === selectedId) || null;

  const loadSearches = useCallback(async () => {
    try {
      const data: FlightSearch[] = (await api.searches.list()) || [];
      setSearches(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError(extractMessage(err));
    }
  }, [selectedId]);

  const loadAlert = useCallback(async (searchId: string) => {
    setAlertLoading(true);
    try {
      const data: AlertResult = await api.alerts.get(searchId);
      setAlert(data);
    } catch {
      setAlert(null);
    } finally {
      setAlertLoading(false);
    }
  }, []);

  const loadLatestPrice = useCallback(
    async (searchId: string) => {
      try {
        const price: PriceSnapshot | null = await api.prices.latest(searchId);
        setLatestPrice(price);
      } catch {
        setLatestPrice(null);
      }
    },
    []
  );

  useEffect(() => {
    loadSearches();
  }, [loadSearches]);

  useEffect(() => {
    if (selectedId) {
      setAlert(null);
      setLatestPrice(null);
      loadAlert(selectedId);
      loadLatestPrice(selectedId);
    } else {
      setAlert(null);
      setLatestPrice(null);
      setAlertLoading(false);
    }
  }, [selectedId, loadAlert, loadLatestPrice]);

  const handleCreate = async (data: SearchCreateInput) => {
    setCreating(true);
    setError(null);
    try {
      const newSearch: FlightSearch = await api.searches.create(data);
      setSearches((prev) => [newSearch, ...prev]);
      setSelectedId(newSearch.id);
      showToast(`Search created: ${newSearch.fromAirport} \u2192 ${newSearch.toAirport}`);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleContinue = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      if (selected.searchStatus === 'disabled') {
        const updated: FlightSearch = await api.searches.update(
          selected.id,
          { searchStatus: 'active' },
        );
        setSearches((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showToast('Search resumed');
      } else {
        showToast('Still monitoring');
      }
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const newStatus = selected.searchStatus === 'active' ? 'disabled' : 'active';
      const updated: FlightSearch = await api.searches.update(
        selected.id,
        { searchStatus: newStatus },
      );
      setSearches((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      showToast(newStatus === 'active' ? 'Search resumed' : 'Search paused');
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFetchNow = async () => {
    if (!selected) return;
    setFetching(true);
    setError(null);
    try {
      const snapshots: PriceSnapshot[] = await api.prices.fetch(selected.id);
      await Promise.all([loadAlert(selected.id), loadLatestPrice(selected.id)]);
      setChartRefresh((n) => n + 1);
      showToast(`Fetched ${snapshots.length} price${snapshots.length !== 1 ? 's' : ''}`);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const route = `${selected.fromAirport} \u2192 ${selected.toAirport}`;
    setActionLoading(true);
    try {
      await api.searches.delete(selected.id);
      const remaining = searches.filter((s) => s.id !== selected.id);
      setSearches(remaining);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      showToast(`Deleted ${route}`);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-bold text-card-foreground">Flight Price Tracker</h1>
            <p className="text-xs text-muted-foreground">Monitor prices and get alerts on trends</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-red-50 px-4 py-2.5 text-sm text-destructive">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-medium underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Top row: Search form (left) + Price chart (right) */}
        <div className="mb-4 grid min-h-[340px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <SearchForm onSubmit={handleCreate} loading={creating} />
          {selected ? (
            <PriceChart
              searchId={selected.id}
              route={`${selected.fromAirport} \u2192 ${selected.toAirport}`}
              refreshKey={chartRefresh}
            />
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Select a search to see price history</p>
            </div>
          )}
        </div>

        {/* Active search selector */}
        <div className="mb-4">
          <SearchSelector searches={searches} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {/* Alert flow */}
        {selected ? (
          alertLoading && !alert ? (
            <AlertFlowSkeleton />
          ) : (
            <AlertFlow
              search={selected}
              alert={alert}
              latestPrice={latestPrice}
              onContinue={handleContinue}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onFetchNow={handleFetchNow}
              loading={actionLoading}
              fetching={fetching}
            />
          )
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16">
            <p className="text-sm text-muted-foreground">
              Create a search or select one from the dropdown to see price alerts.
            </p>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
