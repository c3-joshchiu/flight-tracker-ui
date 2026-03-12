import airportsJson from './airports.json';
import type { Airport } from '@/Interfaces';

export type Region =
  | 'USA'
  | 'North America'
  | 'Europe'
  | 'South America'
  | 'MENA'
  | 'Africa'
  | 'East Asia'
  | 'South Asia'
  | 'Asia-Pacific'
  | 'Oceania';

export const REGIONS: { id: Region; label: string }[] = [
  { id: 'USA', label: 'USA' },
  { id: 'North America', label: 'North America' },
  { id: 'Europe', label: 'Europe' },
  { id: 'South America', label: 'South America' },
  { id: 'MENA', label: 'MENA' },
  { id: 'Africa', label: 'Africa' },
  { id: 'East Asia', label: 'East Asia' },
  { id: 'South Asia', label: 'South Asia' },
  { id: 'Asia-Pacific', label: 'Asia-Pacific' },
  { id: 'Oceania', label: 'Oceania' },
];

export const AIRPORTS: Airport[] = airportsJson as Airport[];
