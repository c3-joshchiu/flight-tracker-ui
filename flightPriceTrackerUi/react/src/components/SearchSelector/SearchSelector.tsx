import type { FlightSearch } from '@/Interfaces';

interface Props {
  searches: FlightSearch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function SearchSelector({ searches, selectedId, onSelect }: Props) {
  if (searches.length === 0) {
    return (
      <div className="border border-dashed border-weak px-4 py-3 text-center text-sm text-secondary">
        No searches yet &mdash; create one above.
      </div>
    );
  }

  return (
    <div className="c3-card flex items-center gap-3">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-secondary">
        Viewing
      </span>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="min-w-0 flex-1 text-sm font-medium text-primary"
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
      <span className="shrink-0 text-xs text-secondary">
        {searches.length} search{searches.length !== 1 ? 'es' : ''}
      </span>
    </div>
  );
}
