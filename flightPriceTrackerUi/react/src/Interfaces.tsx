/**
 * API types — generated from openapi/flights-api.yaml
 *
 * Re-run generation: npm run generate:api
 * Source spec: ../../openapi/flights-api.yaml
 */
import type { components } from './api.generated';

export type FlightSearch = components['schemas']['FlightSearch'];
export type PriceSnapshot = components['schemas']['PriceSnapshot'];
export type AlertResult = components['schemas']['AlertResult'];
export type SearchCreateInput = components['schemas']['SearchCreateInput'];
export type Meta = components['schemas']['Meta'];
export type ApiError = components['schemas']['ApiError'];

/**
 * Frontend-only type — not part of the API contract.
 * Represents an airport from the static dataset (react/src/data/airports.json).
 */
export interface Airport {
  iata: string;
  city: string;
  state: string;
  country: string;
  regions: string[];
}

// ── Export / Import types ────────────────────────────────────

export interface ExportData {
  exportedAt: string;
  version: string;
  searches: ExportedSearch[];
  snapshots: ExportedSnapshot[];
}

export interface ExportedSearch {
  id: string;
  fromAirport: string;
  toAirport: string;
  tripType: string;
  outboundDate: string;
  returnDate: string | null;
  maxStops: number | null;
  passengersAdults: number;
  currency: string;
  searchStatus: string;
  snapshotCount: number;
}

export interface ExportedSnapshot {
  id: string;
  flightSearchId: string;
  seatClass: string;
  price: number;
  airlineCodes: string[];
  airlineNames: string[];
  flightType: string | null;
  durationMinutes: number | null;
  fetchedAt: string;
}

export interface ImportPayload {
  searches?: ExportedSearch[];
  snapshots?: ExportedSnapshot[];
  conflictStrategy?: 'skip' | 'overwrite' | 'error';
}

export interface ImportReport {
  status: string;
  searches: ImportEntityReport;
  snapshots: ImportEntityReport;
}

export interface ImportEntityReport {
  created: number;
  skipped: number;
  overwritten: number;
  errors: ImportError[];
}

export interface ImportError {
  id: string;
  error: string;
}
