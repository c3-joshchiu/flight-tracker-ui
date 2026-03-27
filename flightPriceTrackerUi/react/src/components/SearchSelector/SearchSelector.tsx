import ThemedSelect from '@/components/ThemedSelect/ThemedSelect';
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

  const formatLabel = (s: FlightSearch) => {
    const dateStr = s.outboundDate ? s.outboundDate.substring(0, 10) : '';
    const suffix = s.searchStatus === 'disabled' ? ' (paused)' : '';
    return `${s.fromAirport} → ${s.toAirport} · ${s.tripType} · ${dateStr}${suffix}`;
  };

  return (
    <div className="c3-card flex items-center gap-3">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-secondary">
        Viewing
      </span>
      <ThemedSelect
        id="search-selector"
        className="min-w-0 flex-1"
        placeholder="Select a search..."
        value={selectedId || ''}
        onChange={onSelect}
        options={searches.map((s) => ({ value: s.id, label: formatLabel(s) }))}
      />
      <span className="shrink-0 text-xs text-secondary">
        {searches.length} search{searches.length !== 1 ? 'es' : ''}
      </span>
    </div>
  );
}
