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
