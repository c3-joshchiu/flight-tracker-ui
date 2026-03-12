# flight-tracker-ui

React frontend for the Flight Price Tracker. Deployed as an independent C3 AI
package (`flightPriceTrackerUi`) that consumes the REST API from
[flight-tracker-api](../flightTrackerApi).

## Architecture

```
openapi/flights-api.yaml              ← API contract (mirrored from API repo)
  │
  └─ npm run generate:api
       │
       └─ src/api.generated.ts        ← auto-generated types (do not edit)
            │
            └─ src/Interfaces.tsx      ← re-exports + frontend-only types (Airport)
                 │
                 └─ src/api.ts         ← typed HTTP client
                      │
                      └─ src/config.ts ← resolves backend URL at runtime
```

The frontend never imports C3 types or uses C3-specific APIs. It speaks
HTTP + JSON only, using types generated from the OpenAPI spec.

## Cross-App URL Resolution

Since the UI and API are separate C3 packages, the frontend resolves the
backend URL at runtime using the `c3AppUrlPrefix` cookie:

| AppUrl Mode | Cookie Value | Resolved API Base |
|-------------|-------------|-------------------|
| Cluster URL | `dev/flightpricetrackerui` | `/dev/flightpricetracker/flights` |
| Env URL | `flightpricetrackerui` | `/flightpricetracker/flights` |
| Vanity URL | `` (empty) | `/flightpricetracker/flights` |

This is handled by `src/config.ts` — no code changes needed when deploying
to different environments. Authentication is automatic via the shared `c3auth`
cookie.

## Project Structure

```
flightPriceTrackerUi/
├── flightPriceTrackerUi.c3pkg.json   # C3 package manifest (depends on backend)
├── react/
│   ├── src/
│   │   ├── config.ts                 # Cross-app URL resolver
│   │   ├── api.ts                    # Typed HTTP client (axios)
│   │   ├── api.generated.ts          # Auto-generated from OpenAPI spec
│   │   ├── Interfaces.tsx            # Type re-exports + Airport type
│   │   ├── App.tsx                   # Root component (HashRouter)
│   │   ├── main.tsx                  # Entry point
│   │   ├── components/
│   │   │   ├── AirportCombobox/      # IATA airport picker
│   │   │   ├── AlertFlow/            # Price trend alert (red/green/grey)
│   │   │   ├── PriceChart/           # Price history chart
│   │   │   ├── SearchForm/           # New search form
│   │   │   ├── SearchSelector/       # Search list sidebar
│   │   │   ├── SideNav/              # Navigation sidebar
│   │   │   ├── ErrorBoundary/        # React error boundary
│   │   │   └── Toast/                # Notification toasts
│   │   ├── pages/
│   │   │   └── Dashboard/            # Main dashboard page
│   │   └── data/
│   │       └── airports.json         # Static IATA airport dataset
│   ├── scripts/
│   │   ├── postBuild.js              # Copies dist/ → ui/content/
│   │   └── generate-client.sh        # Fetches spec + runs openapi-typescript
│   ├── package.json
│   ├── vite.config.mts
│   └── tsconfig.json
├── ui/
│   └── content/                      # Build output (C3 serves from here)
└── openapi/
    └── flights-api.yaml              # Mirrored from API repo (for codegen)
```

## Development

### Prerequisites

- Node.js 18+
- Access to a C3 environment with the `flightPriceTracker` backend provisioned

### Setup

```bash
cd flightPriceTrackerUi/react
npm install
```

Create a `.env` file:

```
VITE_C3_URL=https://your-cluster-url
VITE_C3_ENV=your-env
VITE_C3_APP=flightpricetrackerui
```

### Run locally

```bash
npm run dev
```

Opens at `http://localhost:8000`. The Vite dev server proxies API calls to
your C3 environment.

### Build for deployment

```bash
npm run build
```

This runs `tsc` + `vite build` + `postBuild.js`, which copies the built
assets into `../ui/content/`. Commit `ui/content/` — it's the C3 deployment
artifact.

## Updating API Types

When the backend API changes:

1. Copy the updated spec from the API repo:

```bash
cp ../flightTrackerApi/openapi/flights-api.yaml openapi/
```

2. Regenerate TypeScript types:

```bash
cd flightPriceTrackerUi/react
npm run generate:api
```

3. Fix any type errors:

```bash
npx tsc --noEmit
```

4. Build and commit:

```bash
npm run build
git add -A && git commit -m "update types from API spec"
```

Or use the helper script:

```bash
bash flightPriceTrackerUi/react/scripts/generate-client.sh
```

## Package Dependency

The C3 package manifest declares a dependency on the backend:

```json
{
  "name": "flightPriceTrackerUi",
  "dependencies": {
    "flightPriceTracker": "1.0.0"
  }
}
```

This ensures the backend is provisioned before the UI is deployed. Both
packages share the same C3 environment and domain, so the `c3auth` cookie
works across both.

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool + dev server |
| Tailwind CSS | Styling |
| Axios | HTTP client |
| Recharts | Price history charts |
| KendoReact | UI component library |
| openapi-typescript | Generates TS types from OpenAPI spec |
| HashRouter | Required for C3 subpath deployment |

## Related

- [flight-tracker-api](../flightTrackerApi) — Backend API repo
- [OpenAPI spec](openapi/flights-api.yaml) — API contract
- [C3 API Integration Patterns](../c3-api-integration-patterns.md) — Architecture reference
