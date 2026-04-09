# flight-tracker-ui

React frontend for the Flight Price Tracker. Deployed as an independent C3 AI
package (`flightPriceTrackerUi`) that consumes the REST API from
[flight-tracker-api](../flightTrackerApi).

<img width="1459" height="910" alt="image" src="https://github.com/user-attachments/assets/b67e43d3-6b25-4d8e-a938-3a67bff06c62" />


## Architecture

```
Browser                          UI App (C3 server)           API App (C3 server)
  │                                 │                              │
  │── GET /flights/searches ───────▶│                              │
  │   (c3auth cookie auto-sent)     │── GET /flights/searches ────▶│
  │                                 │   (Bearer token)             │
  │                                 │◀── JSON response ───────────│
  │◀── JSON response ──────────────│                              │
```

The React frontend calls the **BFF proxy** (`FlightApiProxy`) in its own
app — never the API app directly. The proxy handles authentication
server-side using an OAuth `client_credentials` token. The browser's `c3auth`
cookie authenticates the browser-to-proxy hop automatically (same cookie
scope).

```
openapi/flights-api.yaml              ← API contract (mirrored from API repo)
  │
  └─ npm run generate:api
       │
       └─ react/src/api.generated.ts  ← auto-generated types (do not edit)
            │
            └─ react/src/Interfaces.tsx ← re-exports + frontend-only types
                 │
                 └─ react/src/api.ts   ← typed HTTP client (no auth code)
                      │
                      └─ react/src/config.ts ← resolves own app's /flights URL

src/FlightApiProxy.c3typ + .js        ← server-side BFF proxy
src/FlightApiProxyConfig.c3typ        ← OAuth credentials (Config + secret)
src/App.js                            ← afterStart hook (verify proxy readiness)
```

The frontend never imports C3 types or uses C3-specific APIs. It speaks
HTTP + JSON only, using types generated from the OpenAPI spec.

## URL Resolution

The frontend resolves its own app's `/flights` endpoint at runtime:

| Mode | Cookie Value | Resolved API Base |
|------|-------------|-------------------|
| Cluster URL | `tenant/flightpricetrackerui` | `/tenant/flightpricetrackerui/flights` |
| Env URL | — (`c3env`=`dev`) | `/dev/flightpricetrackerui/flights` |
| Fallback | — | `./flights` |

This is handled by `config.ts`. The proxy transparently forwards requests
to `flightpricetrackerapi/flights/` with a server-side Bearer token.

## Project Structure

```
flightPriceTrackerUi/
├── flightPriceTrackerUi.c3pkg.json   # C3 package manifest
├── src/
│   ├── FlightApiProxy.c3typ          # BFF proxy type definition
│   ├── FlightApiProxy.js             # BFF proxy implementation (OAuth + HTTP forwarding)
│   ├── FlightApiProxyConfig.c3typ    # Config type for OAuth creds + API base URL
│   └── App.js                        # afterStart hook (logs proxy readiness via verify())
├── react/
│   ├── src/
│   │   ├── config.ts                 # URL resolver (own app's /flights endpoint)
│   │   ├── api.ts                    # Typed HTTP client (axios, no auth code)
│   │   ├── api.generated.ts          # Auto-generated from OpenAPI spec
│   │   ├── Interfaces.tsx            # Type re-exports + Airport type
│   │   ├── App.tsx                   # Root component (HashRouter)
│   │   ├── main.tsx                  # Entry point
│   │   ├── components/               # UI components
│   │   │   ├── ExportImportDialog/  # Export/import modal (CSV, XLSX, JSON)
│   │   │   └── ...                  # Other components
│   │   ├── pages/                    # Page components
│   │   ├── utils/
│   │   │   ├── download.ts          # Blob download helper
│   │   │   └── csvParser.ts         # Two-section CSV parser for import
│   │   └── data/
│   │       └── airports.json         # Static IATA airport dataset
│   ├── scripts/
│   │   ├── postBuild.js              # Copies dist/ → ui/content/
│   │   └── generate-client.sh        # Fetches spec + runs openapi-typescript
│   ├── package.json
│   ├── vite.config.mts
│   └── tsconfig.json
├── .husky/
│   └── pre-commit                    # Auto-rebuilds UI on commit (see below)
├── ui/
│   └── content/                      # Build output (C3 serves from here)
└── openapi/
    └── flights-api.yaml              # Mirrored from API repo (for codegen)
```

## Export / Import

The Dashboard header contains an "Export / Import" button that opens a modal
dialog supporting:

**Export:** Download non-seed data in CSV, XLSX, or JSON format. Scope
can be all searches or the currently selected search. XLSX is generated
client-side using SheetJS; CSV/JSON are fetched from the backend.

**Import:** Upload a `.json` or `.csv` export file. Conflict strategies:
skip existing records (default) or overwrite. The import report shows
created/skipped/overwritten counts and any errors.

## Development

### Prerequisites

- Node.js 18+
- Access to a C3 environment with the `flightPriceTrackerApi` backend provisioned

### Setup

```bash
cd flightPriceTrackerUi/react
npm install
```

This also runs the `prepare` script, which installs **husky** git hooks.
After `npm install`, a pre-commit hook is active that automatically rebuilds
the UI when you commit changes to `react/src/`. No extra commands needed.

### One-time OAuth setup (after first provision)

The BFF proxy needs OAuth credentials to call the API app. These are
provisioned via console commands — not stored in code. See
[`../secret-config.md`](../secret-config.md) for the full steps. Summary:

1. **API app console** — register an OAuth client with `FlightApi.Client` role
2. **UI app console** — store `clientId`, `clientSecret`, and `apiBaseUrl`
   in `FlightApiProxyConfig`
3. **UI app console** — run `FlightApiProxy.verify()` to confirm readiness

### Local development

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

### Git hooks (husky)

A pre-commit hook is installed automatically via `npm install`. When you
commit changes under `react/src/`, the hook:

1. Runs `npm run build` (TypeScript check + Vite build)
2. Copies the output to `ui/content/`
3. Stages `ui/content/` into the commit

If the build fails, the commit is aborted. This ensures `ui/content/` is
never stale in version control.

The hook lives in `.husky/pre-commit` (committed to the repo). Husky is
configured via the `prepare` script in `package.json`.

## Updating API Types

When the backend API changes, run the sync script from the UI repo root:

```bash
bash flightPriceTrackerUi/react/scripts/generate-client.sh
```

This single command:

1. **Mirrors** `flights-api.yaml` from the API repo (if it detects changes)
2. **Regenerates** `api.generated.ts` via `openapi-typescript`
3. **Type-checks** with `tsc --noEmit` and fails early on breaking changes

Then build and commit:

```bash
cd flightPriceTrackerUi/react
npm run build
git add -A && git commit -m "update types from API spec"
```

> **Manual alternative** — if the repos aren't siblings on disk, copy the spec
> yourself (`cp /path/to/flightTrackerApi/openapi/flights-api.yaml openapi/`)
> and run `npm run generate:api` from `flightPriceTrackerUi/react`.

## Package Independence

The UI and API are fully decoupled C3 packages with no compile-time
dependency. The UI package contains one server-side type (`FlightApiProxy`)
that acts as a BFF proxy — the React frontend itself has no C3 dependencies.
The two packages connect only at runtime via HTTP. The proxy handles
cross-app authentication server-side so the browser never needs to know
about the API app.

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
- [OAuth setup](../secret-config.md) — One-time credential provisioning
- [Integration guide](../flightTrackerApi/integration-guide.md) — Auth flow and C3 quirks
