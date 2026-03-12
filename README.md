# Flight Price Tracker — UI

React frontend for the Flight Price Tracker. Deployed as an independent C3 AI package
(`flightPriceTrackerUi`) that consumes the backend API from the
[`flightTrackerApi`](../flightTrackerApi) package.

## Architecture

```
openapi/flights-api.yaml          ← API contract (mirrored from API repo)
  └─ npm run generate:api         ← generates TypeScript types
       └─ src/api.generated.ts    ← auto-generated (do not edit)
            └─ src/Interfaces.tsx  ← re-exports + frontend-only types
                 └─ src/api.ts    ← typed HTTP client using cross-app URL resolution
```

The frontend resolves the backend URL at runtime via the `c3AppUrlPrefix` cookie,
so it works in cluster, env, and vanity URL modes without code changes.

## Development

```bash
cd flightPriceTrackerUi/react
npm install
npm run dev
```

Requires a `.env` file:

```
VITE_C3_URL=https://your-cluster-url
VITE_C3_ENV=your-env
VITE_C3_APP=flightpricetrackerui
```

## Regenerate API Types

When the backend API changes, update the OpenAPI spec and regenerate:

```bash
# Copy updated spec from API repo
cp ../flightTrackerApi/openapi/flights-api.yaml openapi/

# Regenerate TypeScript types
cd flightPriceTrackerUi/react
npm run generate:api
```

## Build & Deploy

```bash
cd flightPriceTrackerUi/react
npm run build          # tsc + vite build + postBuild copies to ui/content/
```

The built assets in `flightPriceTrackerUi/ui/content/` are the C3 deployment artifact.
Commit them to git after building.

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

This ensures the backend is provisioned before the frontend is deployed.
