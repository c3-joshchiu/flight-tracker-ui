import React, { useState } from 'react';
import AirportCombobox from '@/components/AirportCombobox/AirportCombobox';
import { REGIONS, type Region } from '@/data/airports';
import type { SearchCreateInput } from '@/Interfaces';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

interface Props {
  onSubmit: (data: SearchCreateInput) => Promise<void>;
  loading?: boolean;
}

export default function SearchForm({ onSubmit, loading }: Props) {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [regionFilters, setRegionFilters] = useState<Region[]>([]);
  const [form, setForm] = useState({
    fromAirport: '',
    toAirport: '',
    outboundDate: '',
    returnDate: '',
    maxStops: '',
    passengersAdults: '1',
    currency: 'USD',
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      fromAirport: form.fromAirport.toUpperCase(),
      toAirport: form.toAirport.toUpperCase(),
      tripType,
      outboundDate: form.outboundDate,
      returnDate: tripType === 'round-trip' ? form.returnDate || null : null,
      maxStops: form.maxStops ? parseInt(form.maxStops) : null,
      passengersAdults: parseInt(form.passengersAdults) || 1,
      currency: form.currency,
    });
    setForm({
      fromAirport: '',
      toAirport: '',
      outboundDate: '',
      returnDate: '',
      maxStops: '',
      passengersAdults: '1',
      currency: 'USD',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-card-foreground">New Price Search</h2>

      {/* Trip type toggle + region filters */}
      <div className="mb-4 flex gap-4">
        <div className="flex shrink-0 flex-col gap-2">
          {(['one-way', 'round-trip'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTripType(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tripType === t
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              {t === 'one-way' ? 'One Way' : 'Round Trip'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 content-center gap-x-4 gap-y-1.5 border-l border-border pl-4">
          {REGIONS.map((r) => (
            <label
              key={r.id}
              className="flex select-none items-center gap-1.5 text-xs text-muted-foreground"
            >
              <input
                type="checkbox"
                checked={regionFilters.includes(r.id)}
                onChange={(e) => {
                  setRegionFilters((prev) =>
                    e.target.checked ? [...prev, r.id] : prev.filter((f) => f !== r.id)
                  );
                }}
                className="size-3.5 rounded border-border accent-accent"
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AirportCombobox
          label="From"
          placeholder="LAX"
          value={form.fromAirport}
          onChange={(iata) => set('fromAirport', iata)}
          regionFilters={regionFilters}
        />

        <AirportCombobox
          label="To"
          placeholder="NRT"
          value={form.toAirport}
          onChange={(iata) => set('toAirport', iata)}
          regionFilters={regionFilters}
        />

        <div>
          <label htmlFor="outbound-date" className="mb-1 block text-sm font-medium text-muted-foreground">
            Outbound Date
          </label>
          <input
            id="outbound-date"
            required
            type="date"
            value={form.outboundDate}
            onChange={(e) => set('outboundDate', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {tripType === 'round-trip' && (
          <div>
            <label htmlFor="return-date" className="mb-1 block text-sm font-medium text-muted-foreground">
              Return Date
            </label>
            <input
              id="return-date"
              required
              type="date"
              value={form.returnDate}
              onChange={(e) => set('returnDate', e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}

        <div>
          <label htmlFor="max-stops" className="mb-1 block text-sm font-medium text-muted-foreground">Max Stops</label>
          <select
            id="max-stops"
            value={form.maxStops}
            onChange={(e) => set('maxStops', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Any</option>
            <option value="0">Non-stop</option>
            <option value="1">1 stop</option>
            <option value="2">2 stops</option>
          </select>
        </div>

        <div>
          <label htmlFor="passengers-adults" className="mb-1 block text-sm font-medium text-muted-foreground">Passengers</label>
          <input
            id="passengers-adults"
            type="number"
            min={1}
            max={9}
            value={form.passengersAdults}
            onChange={(e) => set('passengersAdults', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium text-muted-foreground">Currency</label>
          <select
            id="currency"
            value={form.currency}
            onChange={(e) => set('currency', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Start Tracking'}
      </button>
    </form>
  );
}
