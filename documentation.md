# Flight Price Tracker UI — Technical Documentation

## Overview

React dashboard for the Flight Price Tracker. Displays flight search criteria,
price history charts, and price trend alerts. Communicates with the backend
exclusively via REST (no C3 type imports, no `c3Action` RPC).

Deployed as an independent C3 AI package (`flightPriceTrackerUi`) with a
runtime dependency on the backend package (`flightPriceTrackerApi`).

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  React Frontend (this repo)                              │
│  Vite + Tailwind CSS v4                                  │
│  SearchForm · PriceChart · AlertFlow · Toast             │
│  HashRouter · api.ts REST client (axios)                 │
├──────────────────────────────────────────────────────────┤
│  Cross-App HTTP Boundary                                 │
│  config.ts resolves backend URL via c3AppUrlPrefix cookie │
│  c3auth cookie shared across packages (same domain)      │
├──────────────────────────────────────────────────────────┤
│  flight-tracker-api (separate repo/package)              │
│  FlightSearchApi @restful endpoint                       │
│  OpenAPI 3.1 spec = source of truth                      │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18, TypeScript |
| Build | Vite, Tailwind CSS v4 |
| HTTP client | Axios (typed via generated interfaces) |
| Charts | Recharts (SVG line chart) |
| UI components | KendoReact |
| Type generation | openapi-typescript (from OpenAPI 3.1 spec) |
| Routing | HashRouter (required for C3 subpath serving) |
| Deployment | `postBuild.js` → `ui/content/` (committed to git) |

## Cross-App URL Resolution

Since the UI and API are separate C3 packages, the frontend resolves the
backend URL at runtime. This is handled by `src/config.ts`.

### How it works

The C3 platform sets a `c3AppUrlPrefix` cookie that contains the URL path
prefix for the current app. The resolver swaps the app name segment:

```
c3AppUrlPrefix = "dev/flightpricetrackerui"
                        ↓ swap last segment
resolved base  = "/dev/flightpricetrackerapi/flights"
```

| AppUrl Mode | Cookie Value | Resolved API Base |
|-------------|-------------|-------------------|
| Cluster URL | `dev/flightpricetrackerui` | `/dev/flightpricetrackerapi/flights` |
| Env URL | `flightpricetrackerui` | `/flightpricetrackerapi/flights` |
| Vanity URL | `` (empty) | `/flightpricetrackerapi/flights` |

Authentication is automatic — the `c3auth` cookie is scoped to the domain
and shared across all apps in the environment.

## Type Generation Pipeline

```
openapi/flights-api.yaml              ← mirrored from API repo
  │
  └─ npm run generate:api             ← runs openapi-typescript
       │
       └─ src/api.generated.ts        ← auto-generated (do not edit)
            │
            └─ src/Interfaces.tsx      ← re-exports + frontend-only types
                 │
                 └─ src/api.ts         ← typed HTTP client
```

The `Interfaces.tsx` file re-exports types from the generated file and adds
one frontend-only type (`Airport`) used by the airport combobox. This keeps
the boundary clear: API types come from the spec, display types are local.

### API Client Usage

```typescript
import { api } from '@/api';

api.searches.list()                                   // GET  /searches
api.searches.create(data)                             // POST /searches
api.searches.get(id)                                  // GET  /searches/:id
api.searches.update(id, { searchStatus: 'active' })   // PATCH /searches/:id
api.searches.delete(id)                               // DELETE /searches/:id
api.alerts.get(searchId)                              // GET  /searches/:id/alert
api.prices.history(searchId, 'economy')               // GET  /searches/:id/prices?seatClass=economy
api.prices.latest(searchId)                           // GET  /searches/:id/latest-price
api.prices.fetch(searchId)                            // POST /searches/:id/fetch
```

## Page Layout

```
┌──────────────────────────────────────────────────────┐
│ ☰ SideNav │ Flight Price Tracker                      │
│           ├───────────────┬──────────────────────────┤
│ Dashboard │ New Search    │  Price History (SVG chart) │
│           │ [form...]     │  Economy ── Business ──    │
│           │ [Start]       │                            │
│           ├───────────────┴──────────────────────────┤
│           │ VIEWING [ LAX → NRT · one-way · Apr 4 ▾]  │
│           ├──────────────────────────────────────────┤
│           │ [Search Info] → [Alert Status] → [Actions] │
│           └──────────────────────────────────────────┘
└──────────────────────────────────────────────────────┘
```

## Components

### SideNav
C3-style collapsible side navigation. Pinned to dark theme regardless of
light/dark mode toggle.

### SearchForm
Trip type selector, region-aware airport filters, date pickers, stops,
passengers, currency. Submits to `api.searches.create()`.

### AirportCombobox
Typeahead searching 622 airports by IATA code, city, state, and country.
Ranked scoring algorithm. Region-aware filtering (10 regions). Full keyboard
navigation support.

### PriceChart
Pure SVG line chart showing economy (blue) and business (purple) price
history. Built with Recharts.

### SearchSelector
Full-width banner dropdown showing the active search route, trip type, and
date. Includes search count.

### AlertFlow
Three-card horizontal sequence:

1. **Search Info** — route, dates, passengers
2. **Alert Status** — color-coded card (red/green/grey) with trend message
3. **Actions** — Fetch Now, toggle status, delete, Google Flights link

Includes a skeleton loader (`AlertFlowSkeleton`) for loading state.

### Toast
Bottom-right notification system. Auto-dismisses after 3 seconds. Used for
success/error feedback on API operations.

### ErrorBoundary
React error boundary wrapper. Catches render errors and displays a fallback.

## Alert Display

The alert card in AlertFlow is color-coded based on the API response:

| Alert | Card Style | Badge Text |
|-------|-----------|------------|
| Grey | Slate-tinted | "Monitoring" |
| Red | Red-tinted | "Price Rising" |
| Green | Green-tinted | "Price Drop!" |

Each alert also displays: weekly averages, percent change, cheapest airline,
and a link to Google Flights.

## Styling

CSS architecture uses three layers:

### 1. C3 Design System
`c3FoundationTokens.css` + `c3SemanticTokensLight.css` / `c3SemanticTokensDark.css`
+ `c3TailwindTheme.css` provide the standard C3 color palette so `bg-blue-500`,
`text-gray-700` etc. match other C3 apps.

### 2. App Tokens
`globals.css` defines ~30 semantic tokens (`--app-card`, `--app-accent`, etc.)
with explicit hex values and light/dark variants via `:root` / `.dark` selectors.

### 3. Tailwind v4 @theme
Bridges app tokens to Tailwind utility classes (`bg-card`, `text-muted-foreground`,
etc.).

### Key Rules

- App tokens always use explicit hex values (not C3 variable chains) to avoid
  transparent-background bugs
- SVG inline `fill`/`stroke` must use `var(--color-*)` prefix (Tailwind v4
  namespaces all colors under `--color-*`)
- Sidebar tokens are pinned to fixed dark values (not theme-reactive) so the
  nav stays dark in both modes
- Dark mode toggles `.dark` class on `<html>` via `useTheme` hook (persists
  to `localStorage`)

## Airport Dataset

`src/data/airports.json` contains 622 airports:

```json
{
  "iata": "NRT",
  "city": "Tokyo Narita",
  "state": "",
  "country": "Japan",
  "regions": ["East Asia"]
}
```

10 regions: USA, North America, Europe, South America, MENA, Africa, East Asia,
South Asia, Asia-Pacific, Oceania.

## Development Workflow

```
Edit src/ → npm run build → commit ui/content/ → push → sync to SNE
```

1. **Edit** files in `flightPriceTrackerUi/react/src/`
2. **Regenerate types** (if API spec changed): `npm run generate:api`
3. **Build**: `npm run build` (runs tsc + vite build + postBuild.js)
4. **Lint** (optional): `npm run lint`
5. **Commit** both source changes and `ui/content/`
6. **Push** to your branch
7. **Sync** your SNE to pick up changes
8. **Access** at `https://<cluster>/<env>/flightpricetrackerui/index.html`

### What to Commit

| Path | Commit? | Why |
|------|---------|-----|
| `react/src/` | Yes | Source code |
| `react/src/api.generated.ts` | Yes | Generated types (reproducible, but committed for CI) |
| `openapi/flights-api.yaml` | Yes | Local copy of API contract |
| `ui/content/` | Yes | Built app — this IS the C3 deployment artifact |
| `react/dist/` | No | Intermediate build output (gitignored) |
| `react/node_modules/` | No | Dependencies (gitignored) |

## C3 Platform Requirements

| Requirement | Why |
|-------------|-----|
| `HashRouter` (not `BrowserRouter`) | App is served from a subpath on C3 |
| `base: './'` in `vite.config.mts` | Asset paths must be relative for C3 deployment |
| `postBuild.js` copies `dist/` → `ui/content/` | C3 serves static files from `ui/content/` |
| `ui/content/` committed to git | This is the deployment artifact (C3 convention) |
| `c3pkg.json` with empty dependencies | UI has no C3 types — decoupled from API at build time |
