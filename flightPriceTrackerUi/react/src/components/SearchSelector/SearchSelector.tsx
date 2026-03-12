import type { FlightSearch } from '@/Interfaces';

interface Props {
  searches: FlightSearch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function SearchSelector({ searches, selectedId, onSelect }: Props) {
  if (searches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
        No searches yet &mdash; create one above.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Viewing
      </span>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-card-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="" disabled>
          Select a search...
        </option>
        {searches.map((s) => {
          const dateStr = s.outboundDate ? s.outboundDate.substring(0, 10) : '';
          return (
            <option key={s.id} value={s.id}>
              {s.fromAirport} &rarr; {s.toAirport} &middot; {s.tripType} &middot; {dateStr}
              {s.searchStatus === 'disabled' ? ' (paused)' : ''}
            </option>
          );
        })}
      </select>
      <span className="shrink-0 text-xs text-muted-foreground">
        {searches.length} search{searches.length !== 1 ? 'es' : ''}
      </span>
    </div>
  );
}
