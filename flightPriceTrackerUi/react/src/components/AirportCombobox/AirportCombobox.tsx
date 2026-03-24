import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AIRPORTS } from '@/data/airports';
import type { Airport } from '@/Interfaces';
import type { Region } from '@/data/airports';

interface Props {
  value: string;
  onChange: (iata: string) => void;
  placeholder?: string;
  label: string;
  regionFilters?: Region[];
}

const MAX_RESULTS = 40;

function matchScore(airport: Airport, query: string): number {
  const q = query.toLowerCase();
  if (airport.iata.toLowerCase() === q) return 100;
  if (airport.iata.toLowerCase().startsWith(q)) return 90;
  if (airport.city.toLowerCase() === q) return 80;
  if (airport.city.toLowerCase().startsWith(q)) return 70;
  if (airport.state.toLowerCase() === q) return 60;
  if (airport.country.toLowerCase().startsWith(q)) return 50;
  if (airport.city.toLowerCase().includes(q)) return 40;
  if (airport.country.toLowerCase().includes(q)) return 30;
  return 0;
}

export default function AirportCombobox({
  value,
  onChange,
  placeholder = 'LAX',
  label,
  regionFilters = [],
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPool = useMemo(() => {
    if (regionFilters.length === 0) return AIRPORTS;
    return AIRPORTS.filter((a) => a.regions.some((r) => regionFilters.includes(r as Region)));
  }, [regionFilters]);

  const results = useMemo(() => {
    if (!query.trim()) return filteredPool.slice(0, MAX_RESULTS);
    const scored = filteredPool
      .map((a) => ({ airport: a, score: matchScore(a, query.trim()) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, MAX_RESULTS).map((r) => r.airport);
  }, [query, filteredPool]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [results]);

  useEffect(() => {
    if (value) {
      const match = AIRPORTS.find((a) => a.iata === value.toUpperCase());
      if (match && query !== match.iata) setQuery(match.iata);
    } else if (!value && query && !open) {
      setQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const select = useCallback(
    (airport: Airport) => {
      onChange(airport.iata);
      setQuery(airport.iata);
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  const resolveTypedIata = useCallback(() => {
    if (value) return;
    const q = query.trim().toUpperCase();
    if (q.length === 3) {
      const match = filteredPool.find((a) => a.iata === q);
      if (match) {
        onChange(match.iata);
        setQuery(match.iata);
      }
    }
  }, [value, query, filteredPool, onChange]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        resolveTypedIata();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [resolveTypedIata]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.children[highlightIdx] as HTMLElement;
    active?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[highlightIdx]) select(results[highlightIdx]);
        break;
      case 'Escape':
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        resolveTypedIata();
        break;
    }
  };

  const displayLabel = (a: Airport) => {
    const parts = [a.city];
    if (a.state) parts.push(a.state);
    parts.push(a.country);
    return parts.join(', ');
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-secondary">{label}</label>
      <input
        ref={inputRef}
        required
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange('');
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full text-sm text-foreground uppercase placeholder:normal-case placeholder:text-secondary"
        autoComplete="off"
      />
      <input type="hidden" value={value} />
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto border border-weak bg-card shadow-lg"
        >
          {results.map((a, i) => (
            <li
              key={a.iata}
              role="option"
              aria-selected={i === highlightIdx}
              onMouseDown={() => select(a)}
              onMouseEnter={() => setHighlightIdx(i)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                i === highlightIdx ? 'bg-accent text-accent-foreground' : 'text-primary'
              }`}
            >
              <span className="w-10 shrink-0 font-mono font-semibold">{a.iata}</span>
              <span className="truncate">{displayLabel(a)}</span>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full border border-weak bg-card px-3 py-2 text-sm text-secondary shadow-lg">
          No airports found
        </div>
      )}
    </div>
  );
}
