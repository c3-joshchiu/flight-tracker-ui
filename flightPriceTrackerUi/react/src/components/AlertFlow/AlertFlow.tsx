import { useState } from 'react';
import type { AlertResult, FlightSearch, PriceSnapshot } from '@/Interfaces';

interface Props {
  search: FlightSearch;
  alert: AlertResult | null;
  latestPrice: PriceSnapshot | null;
  onContinue: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onFetchNow: () => void;
  loading?: boolean;
  fetching?: boolean;
}

const statusConfig = {
  red: {
    bg: 'bg-status-red-bg',
    border: 'border-status-red-border',
    badge: 'bg-status-red-badge-bg text-status-red-badge-text',
    statBox: 'bg-status-red-stat-bg border border-status-red-stat-border',
    icon: '\u2191',
    label: 'Price Rising',
  },
  green: {
    bg: 'bg-status-green-bg',
    border: 'border-status-green-border',
    badge: 'bg-status-green-badge-bg text-status-green-badge-text',
    statBox: 'bg-status-green-stat-bg border border-status-green-stat-border',
    icon: '\u2193',
    label: 'Price Drop!',
  },
  grey: {
    bg: 'bg-status-grey-bg',
    border: 'border-status-grey-border',
    badge: 'bg-status-grey-badge-bg text-status-grey-badge-text',
    statBox: 'bg-status-grey-stat-bg border border-status-grey-stat-border',
    icon: '\u2014',
    label: 'Monitoring',
  },
};

function formatPrice(cents: number | null): string {
  if (cents === null) return '\u2014';
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function Connector() {
  return (
    <>
      <div className="hidden shrink-0 items-center self-center px-3 sm:flex">
        <div className="h-0.5 w-10 rounded-full bg-muted-foreground/40" />
        <svg viewBox="0 0 14 20" className="h-5 w-3.5 text-muted-foreground/40" fill="currentColor">
          <path d="M0 0 L14 10 L0 20 Z" />
        </svg>
      </div>
      <div className="flex flex-col items-center py-2 sm:hidden">
        <div className="h-6 w-0.5 rounded-full bg-muted-foreground/40" />
        <svg viewBox="0 0 20 14" className="h-3.5 w-5 text-muted-foreground/40" fill="currentColor">
          <path d="M0 0 L20 0 L10 14 Z" />
        </svg>
      </div>
    </>
  );
}

function ConfirmDeleteModal({
  route,
  onConfirm,
  onCancel,
}: {
  route: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-overlay"
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onCancel();
          }
        }}
      />
      <div
        className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-destructive">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <h3 className="text-base font-semibold text-card-foreground">Delete Search</h3>
        </div>
        <p className="mb-5 mt-2 text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{route}</strong>? All price history for this search
          will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlertFlow({
  search,
  alert,
  latestPrice,
  onContinue,
  onCancel,
  onDelete,
  onFetchNow,
  loading,
  fetching,
}: Props) {
  const status = alert?.status || 'grey';
  const config = statusConfig[status];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        {/* Node 1: Search Info */}
        <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                search.searchStatus === 'active' ? 'bg-accent' : 'bg-muted-foreground'
              }`}
            />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {search.searchStatus === 'active' ? 'Search Active' : 'Paused'}
            </span>
          </div>
          <p className="text-base font-semibold leading-tight text-card-foreground">
            {search.fromAirport} &rarr; {search.toAirport}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search.tripType === 'round-trip' ? 'Round trip' : 'One way'} &middot;{' '}
            {search.outboundDate ? search.outboundDate.substring(0, 10) : ''}
            {search.returnDate ? ` \u2014 ${search.returnDate.substring(0, 10)}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            {search.passengersAdults} pax &middot; {search.currency}
          </p>
          {latestPrice && (
            <div className="mt-2 rounded-lg bg-muted px-2.5 py-1.5">
              <p className="text-sm font-semibold text-card-foreground">
                {formatPrice(latestPrice.price)}
                <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                  {latestPrice.seatClass} &middot;{' '}
                  {new Date(latestPrice.fetchedAt).toLocaleDateString()}
                </span>
              </p>
            </div>
          )}
          <div className="mt-auto pt-3">
            <button
              onClick={onFetchNow}
              disabled={fetching}
              className="w-full rounded-lg border border-accent/30 bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-blue-100 disabled:opacity-50"
            >
              {fetching ? 'Fetching...' : 'Fetch Now'}
            </button>
          </div>
        </div>

        <Connector />

        {/* Node 2: Alert Status */}
        <div
          className={`flex min-w-0 flex-1 flex-col rounded-xl border p-4 shadow-sm ${config.bg} ${config.border}`}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${config.badge}`}
            >
              {config.icon}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badge}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm leading-snug text-card-foreground">
            {alert?.message || 'Loading...'}
          </p>
          {alert?.currentWeekAvg != null && alert?.previousWeekAvg != null && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
              <div className={`rounded-lg p-2 ${config.statBox}`}>
                <p className="text-[11px] text-muted-foreground">This week</p>
                <p className="text-sm font-semibold">{formatPrice(alert.currentWeekAvg)}</p>
              </div>
              <div className={`rounded-lg p-2 ${config.statBox}`}>
                <p className="text-[11px] text-muted-foreground">Last week</p>
                <p className="text-sm font-semibold">{formatPrice(alert.previousWeekAvg)}</p>
              </div>
            </div>
          )}
          {alert?.percentChange != null && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {alert.percentChange > 0 ? '+' : ''}
              {alert.percentChange.toFixed(1)}% change
              {alert.cheapestAirline ? ` \u00B7 Cheapest: ${alert.cheapestAirline}` : ''}
            </p>
          )}
        </div>

        <Connector />

        {/* Node 3: Actions */}
        <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
          <span className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </span>

          <div className="mt-auto flex flex-col gap-1.5">
            <a
              href={alert?.googleFlightsUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-lg bg-success px-3 py-2 text-center text-xs font-semibold text-success-foreground transition-opacity hover:opacity-90 ${
                !alert?.googleFlightsUrl ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Book Flight
            </a>

            <button
              onClick={onContinue}
              disabled={loading}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Continue Monitoring
            </button>

            <button
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {search.searchStatus === 'active' ? 'Pause Search' : 'Resume Search'}
            </button>

            <button
              onClick={handleDeleteClick}
              disabled={loading}
              className="rounded-lg border border-destructive/30 bg-red-50 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              Delete Search
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          route={`${search.fromAirport} \u2192 ${search.toAirport}`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
