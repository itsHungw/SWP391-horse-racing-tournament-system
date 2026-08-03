# Frontend

React 19 single-page app on Vite 6 and TypeScript, styled with Tailwind CSS 4. It serves the
public racing site and six role-gated workspaces (spectator, owner, jockey, referee,
organizer, admin) from one bundle graph.

For the directory-by-directory walkthrough see
[docs/reference/frontend-source-guide.md](../docs/reference/frontend-source-guide.md).

## Requirements

- Node.js 20 or newer
- A running backend on `http://localhost:8080` (see [../backend/README.md](../backend/README.md))

## Running

```bash
npm install
npm run dev
```

Vite serves `http://localhost:5173` and proxies `/api` and `/uploads` to the backend, so no
CORS configuration is needed locally.

| Script | Effect |
| --- | --- |
| `npm run dev` | dev server with HMR |
| `npm run build` | `tsc -b` then a production build into `dist/` |
| `npm run preview` | serve the production build locally |
| `npm test` | Vitest in watch mode |
| `npm test -- --run` | Vitest, single pass |

Before committing, run at minimum:

```bash
npm test -- --run && npm run build
```

## Configuration

| Variable | Default | Effect |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | base URL for the Axios client. Leave unset locally so the dev proxy handles it |
| `VITE_BACKEND_ORIGIN` | `http://localhost:8080` | proxy target for `/api` and `/uploads` |

Put them in `frontend/.env.local` and restart the dev server.

## Structure

```text
src/
├── main.tsx        createRoot + StrictMode
├── App.tsx         BrowserRouter > AppErrorBoundary > AppRouter
├── styles.css      Tailwind entry and every design token
├── api/            one module per backend area, over a shared Axios client
├── assets/         images and icons
├── components/     cross-page components (client/, office/, organizer/, race-media/, common/, errors/)
├── hooks/          session, wallet balance, public-query cache, document title
├── layouts/        workspace shells per role
├── pages/          route-level pages grouped by audience
├── routes/         route table and access guards
├── test/           Vitest setup
├── types/          shared API/domain types
└── utils/          session, route access, money, validation helpers
```

Composition runs `routes → layouts → pages → components/hooks → api → backend`. Page-local
components live beside their page in `pages/<area>/components/`; only genuinely cross-page
components go in the top-level `components/`.

## Routing and access

`routes/AppRouter.tsx` is the single route table. Public and auth pages are imported eagerly
because they are the first-paint surfaces; every role workspace is `lazy()`-loaded, so an
anonymous visitor never downloads the admin, organizer, owner, jockey or referee bundles.

Four guards compose into the route wrappers:

| Guard | Checks |
| --- | --- |
| `RequireAuthRoute` | a session exists |
| `RequireAdminRoute` | the session holds `ADMIN` |
| `RequireRoleRoute` | the session holds the named role |
| `RequireAccountAccessRoute` | the account status permits business actions |

`/wallet` and `/account-restricted` sit outside `RequireAccountAccessRoute` on purpose: a
suspended user must still be able to see their money and file an appeal.

**Adding a workspace touches three places** — the prefix rule in the backend's
`SecurityConfig`, the guard wrapper in `AppRouter`, and the prefix map in
`utils/routeAccess.ts`, which exists to vet a post-login `returnTo`.

## Session handling

The access token is held **in memory only**; `localStorage` keeps just the display fields
(name, email, account status). The refresh token is an HttpOnly cookie. On reload the first
`401` triggers a silent refresh, and `api/httpClient.ts` replays the original request with the
new token. A `403` carrying `ACCOUNT_SUSPENDED` or `ACCOUNT_BANNED` updates the stored status,
which is what drives the redirect to `/account-restricted`.

## Styling

`styles.css` defines every token in one `@theme` block. Three families coexist deliberately:

| Family | Prefix | Used by |
| --- | --- | --- |
| Legacy brand | `--color-nyra*` | older admin surfaces |
| "Night at the Races" | `--color-turf-*`, `--color-gold-*`, `--color-ivory*`, `--font-display` | public and spectator pages |
| "Race Office" | `--color-office-*` | organizer workspace |

Use the tokens rather than raw hex — the accessibility budget per token is recorded in the
comments beside it. See [../DESIGN.md](../DESIGN.md).

> Contrast gotcha: Tailwind v4 `/opacity` colours compute to `oklab()`. Contrast checks that
> parse `rgb()` strings return wrong numbers against them without failing — measure via canvas.

## Tests

96 test files sit beside the code they cover: route guards, layout switching, API clients,
money formatting, session handling, tournament date rules and page rendering.

`vite.config.ts` pins `maxWorkers: 2` and `testTimeout: 20000`. Both are deliberate: at the
default worker count, heavy page-render tests intermittently exceeded the timeout or made
jsdom throw `AggregateError` on XHR, so results depended on the machine and on how many files
were in the run.
