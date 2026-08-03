# Frontend Source Guide

A file-level reference for `frontend/src`. It describes the composition rules, the routing
and access model, the API layer, and the two design systems that coexist in the app.

Companion documents: [Backend Source Guide](backend-source-guide.md),
[API Endpoint Reference](api-endpoints.md).

---

## 1. Layout

```text
frontend/
├── index.html
├── vite.config.ts            plugins, dev proxy, manual chunks, Vitest config
├── vercel.json               SPA rewrite for the Vercel deployment
├── tsconfig*.json
└── src/
    ├── main.tsx              createRoot + StrictMode
    ├── App.tsx               BrowserRouter > AppErrorBoundary > AppRouter
    ├── styles.css            Tailwind v4 entry and all design tokens (620 lines)
    ├── api/                  one module per backend area, over a shared Axios client
    ├── assets/               images and SVG icons
    ├── components/           cross-page components, grouped by surface
    ├── hooks/                shared React hooks
    ├── layouts/              workspace shells
    ├── pages/                route-level pages, grouped by audience
    ├── routes/               route table and access guards
    ├── test/                 Vitest setup
    ├── types/                shared API/domain types
    └── utils/                session, access, money, validation helpers
```

### Composition rule

```text
routes  ->  layouts  ->  pages  ->  components / hooks  ->  api  ->  backend
```

- `routes/` decides *who may enter*.
- `layouts/` provides the shell (navigation, header, workspace chrome).
- `pages/` own workflow state and data fetching.
- `components/` are presentational and reusable; page-local components live beside their
  page (`pages/<area>/components/`) rather than in the global folder.
- `api/` is the only place that talks HTTP.

---

## 2. Routing and access control

`routes/AppRouter.tsx` is the single route table. Everything renders inside `AppLayout`,
with a `Suspense` boundary and a spinner fallback.

### Code splitting

Public and auth pages are imported eagerly — they are the first-paint surfaces, so splitting
them would only add a Suspense flash on the most common entry points. Every authenticated or
role-gated workspace is `lazy()`-loaded, so a public visitor never downloads the admin,
organizer, owner, jockey or referee bundles, nor heavy dependencies such as
`lightweight-charts` (pulled in only by the lazy wallet chunk).

`vite.config.ts` additionally splits stable vendors into their own cacheable chunks:
`react-vendor`, `motion`, `charts`.

### Guards

| Guard | Checks |
| --- | --- |
| `RequireAuthRoute` | a session exists |
| `RequireAdminRoute` | the session holds `ADMIN` |
| `RequireRoleRoute` | the session holds the named role; takes a `workspaceName` used in the denial message |
| `RequireAccountAccessRoute` | the account status permits business actions (mirror of the backend `AccountStatusEnforcementFilter`) |

`AppRouter` composes these into five helpers — `authRoute`, `adminRoute`, `ownerRoute`,
`jockeyRoute`, `refereeRoute`, `organizerRoute` — so every protected route reads as one call.

Two routes intentionally sit **outside** `RequireAccountAccessRoute`: `/wallet` and
`/account-restricted`. A restricted user must still be able to see their money and file an
appeal.

`utils/routeAccess.ts` holds the same prefix-to-role map in data form. It exists to vet a
post-login `returnTo` value, and it is segment-aware so `/ownerships` does not match the
`/owner` workspace. It also whitelists `/organizer/register`, which sits under a workspace
prefix but only requires a login — a spectator applying to become an organizer does not have
the `ORGANIZER` role yet.

**When you add a workspace, update three places:** the `SecurityConfig` prefix rule on the
backend, the guard wrapper in `AppRouter`, and the map in `routeAccess.ts`.

### Route table

| Group | Paths |
| --- | --- |
| Public | `/`, `/join-us`, `/championships`, `/championships/:id`, `/races`, `/races/:id`, `/leaderboard`, `/blogs`, `/blogs/:slug` |
| Auth | `/login`, `/register`, `/verify-email`, `/forgot-password` |
| Any signed-in user | `/profile`, `/wallet`, `/my-role-requests`, `/account-restricted`, `/organizer/register` |
| Spectator | `/spectator/predictions`, `/spectator/disputes` |
| Owner | `/owner/dashboard`, `/owner/horses`, `/owner/horses/:horseId`, `/owner/profile`, `/owner/registrations`, `/owner/invitations` |
| Jockey | `/jockey/dashboard`, `/jockey/championships`, `/jockey/contracts`, `/jockey/schedule`, `/jockey/profile` |
| Referee | `/referee/dashboard`, `/referee/assigned-races`, `/referee/race-control`, `/referee/result-history`, `/referee/contracts`, `/referee/profile`, `/referee/races/:id/{check,results,report,officiate}` |
| Organizer | `/organizer` and nested `tournaments`, `tournaments/new`, `tournaments/:id`, `registrations`, `schedule`, `officials`, `results`, `profile`, `organization` |
| Admin | `/admin`, `/admin/role-requests`, `/admin/organizations`, `/admin/users`, `/admin/users/:id`, `/admin/horses`, `/admin/tournament-registrations`, `/admin/tournaments`, `/admin/tournaments/:id`, `/admin/blog`, `/admin/blog/new`, `/admin/blog/edit/:id`, `/admin/predictions`, `/admin/predictions/races/:raceId`, `/admin/withdrawals`, `/admin/disputes`, `/admin/finance`, `/admin/finance/transactions`, `/admin/finance/topups` |

Several legacy paths are kept as redirects (`/owner`, `/jockey`, `/jockey/invitations`,
`/jockey/races`, `/spectator`, `/spectator/dashboard`) so old links do not 404.

---

## 3. Session handling

### `utils/authSession.ts`

**The access token is held in memory only.** `setClientSession` writes it to a module-level
`memorySession` and actively calls `localStorage.removeItem("accessToken")`; only the display
fields (`fullName`, `email`, `accountStatus`) are persisted, so a reload restores the visible
identity but not the credential. The refresh token is an HttpOnly cookie the JavaScript never
sees, so after a reload the first `401` triggers a silent refresh that mints a new access
token. The cost is one extra round trip on reload; the benefit is that no long-lived
credential sits in a storage an XSS payload can read.

The module exposes `getClientSession`, `setClientSession`, `clearClientSession`,
`decodeAccessTokenPayload`, `isAccessTokenExpired`, and dispatches
`AUTH_SESSION_CHANGED_EVENT` on every mutation.

### `hooks/useClientSession.ts`

Subscribes to that event so every mounted component re-renders on login, logout, refresh or
an account-status change — without a global state library.

### `api/httpClient.ts`

The single Axios instance, `withCredentials: true`, base URL from `VITE_API_BASE_URL`
(default `/api/v1`).

**Request interceptor**
- attaches `Authorization: Bearer` only if a token exists and is not already expired;
- deletes the `Content-Type` header when the body is `FormData`, so the browser can set the
  multipart boundary itself.

**Response interceptor**
- on `403` with body `code` of `ACCOUNT_SUSPENDED` or `ACCOUNT_BANNED`, updates the stored
  account status and rejects — this is what drives the redirect to `/account-restricted`;
- on `401`, attempts a single silent refresh (`_retry` flag prevents loops), replays the
  original request with the new token, and clears the session if the refresh fails;
- never attempts a refresh for the auth endpoints themselves (`shouldSkipRefresh`), because a
  failed login must surface as a failed login rather than as a refresh attempt.

---

## 4. API layer

`src/api/` holds one module per backend area. Two shapes coexist:

- **Named functions** — `racingApi.ts` (the largest, covering public racing, owner horses,
  registrations, organizer onboarding, tournaments, referee contracts, jockey pool and result
  ratification), `refereeApi.ts`, `authApi.ts`, `adminUserApi.ts`, `raceMediaApi.ts`,
  `adminPredictionApi.ts`, `adminTournamentApi.ts`, `adminRaceApi.ts`,
  `adminRoleRequestApi.ts`, `profileApi.ts`, `ownerProfileApi.ts`, `roleRequestApi.ts`,
  `notificationApi.ts`, `leaderboardApi.ts`, `accountAppealApi.ts`,
  `accountRestrictionApi.ts`, `adminDashboardApi.ts`.
- **Namespace objects** — `walletApi`, `adminWalletApi`, `adminFinanceApi`, `blogApi`,
  `disputeApi`.

`racingApi.ts` is sectioned by business rule with inline comment banners (organizer
onboarding gate, organizer tournaments gate, referee contracts, registration gate, race card
and result ratification, jockey pool lock) so the file maps onto the three-gate model rather
than onto URL shape.

`disputeApi.ts` also re-declares the dispute enums as TypeScript union types; those unions
must stay in step with `dispute/enums/` on the backend.

Colocated tests (`*.test.ts`) cover request shape and error handling for the clients that
carry money or authorization logic: `httpClient`, `adminFinanceApi`, `adminWalletApi`,
`adminUserApi`, `adminRoleRequestApi`, `adminRaceApi`, `racingApi`, `refereeApi`, `blogApi`.

---

## 5. Hooks and utilities

| Module | Purpose |
| --- | --- |
| `hooks/useClientSession` | reactive session state |
| `hooks/useWalletBalance` | wallet balance for the header pill |
| `hooks/usePublicQuery` | small stale-while-revalidate cache for public reads; keeps previous data across key changes so pagination and filter changes never collapse the page back into a skeleton |
| `hooks/useSelectedTournamentId` | persists the tournament selection across workspace pages |
| `hooks/useDocumentTitle` | per-page `<title>` |
| `utils/authSession` | token storage and change events |
| `utils/routeAccess` | prefix-to-role map, `returnTo` vetting |
| `utils/authRoles` | role constants and helpers |
| `utils/accountCapabilities` | what a `SUSPENDED` / `BANNED` account may still do |
| `utils/dashboardRoute` | which dashboard a multi-role user lands on |
| `utils/money` | VND formatting and parsing |
| `utils/financeDate` | date range handling for finance filters |
| `utils/apiError` | pulls a displayable message out of an Axios error |
| `utils/validation` | shared form rules |
| `utils/tournamentDateValidation` | tournament window rules mirrored from the backend |
| `utils/fileUrl` | resolves stored-file references to download URLs |

`types/` mirrors backend DTOs for the areas with the most surface: `auth`, `profile`,
`racing`, `wallet`, `blog`, `adminUser`, `adminFinance`, `adminRoleRequest`, `roleRequest`,
`ownerProfile`.

---

## 6. Components and design systems

`styles.css` is the single Tailwind v4 entry and defines every token in one `@theme` block.
Three token families coexist deliberately:

| Family | Prefix | Used by |
| --- | --- | --- |
| Legacy brand | `--color-nyra*` | older admin surfaces |
| "Night at the Races" (cinematic client theme) | `--color-turf-*`, `--color-gold-*`, `--color-ivory*`, `--color-emerald-*`, `--font-display`, `--font-grotesk`, `--font-mono-data` | public and spectator pages |
| "Race Office" (organizer workspace) | `--color-office-*` | organizer pages |

The two named systems are intentionally distinct: the client surface is a marketing-grade
cinematic theme, the organizer surface is a calm operational console. Comments in
`styles.css` record the accessibility constraints per token — for example
`--color-office-muted` is AA at ~5.3:1, `--color-office-muted-soft` is large-text only, and
`--color-office-faint` is for non-essential metadata.

> Contrast gotcha: Tailwind v4 `/opacity` colours compute to `oklab()`. Contrast math that
> parses `rgb()` strings silently returns wrong numbers against these — measure via canvas
> instead.

### Component groups

| Directory | Contents |
| --- | --- |
| `components/` (root) | `AuthenticatedImage`, `AuthenticatedFileLink` (fetch private files with the bearer token), `NotificationBell`, `StatusBadge`, `RoleRequestStatusBadge`, `RejectModal` |
| `components/client/` | `ClientHeader` (the workspace switcher), `ClientFooter`, `BannerCarousel`, `Countdown`, `CountUp`, `ClientToast`, `MotionPage`, and `primitives.tsx` (`MotionReveal`, `MotionStagger`, `MotionStaggerItem`, `Eyebrow`, `GoldRule`, `FoilStat`) |
| `components/office/` | organizer primitives: `Drawer`, `StatusPill`, `EmptyState` |
| `components/organizer/` | `ConfirmDialog` and the detail drawers for races, referees and registrations |
| `components/race-media/` | `YouTubeEmbed`, `RaceHighlightPlayer`, `RaceLivePlayer`, `RaceMediaPanel`, `ChampionshipHighlightsRail` |
| `components/common/` | `PaginationControls`, `SkeletonLoader` |
| `components/errors/` | `AppErrorBoundary` |

`ClientHeader` is the primary navigation concept: the profile pill shows identity and wallet
balance; the dropdown lists the current dashboard first, groups personal dashboards
separately from the organizer dashboard, and shows the organizer entry only for accounts that
hold `ORGANIZER` — everyone else sees the registration route instead.

### Notable page clusters

| Cluster | Files |
| --- | --- |
| Spectator predictions | `pages/spectator/predictions/` — `RaceCockpitHeader`, `RunnerTable`, `PredictionSlip`, `StreakSlip`, `HeadToHeadSelector`, `PredictionModeSelector`, `StepRail`, `PayoutReceipt`, `RulesDialog`, `SuspendedPredictionNotice` |
| Referee race day | `pages/referee/race-day/` — `PreRaceChecklist`, `ReadyLineupPanel`, `LiveRaceWorkspace`, `LiveRaceOrderPanel`, `LiveLeaderboard`, `LiveIncidentLog`, `StewardDeskPanel`, `ObjectionForm`, `RaceSummary`, `MonthRaceCalendar`, `AssignedRaceTimeline` |
| Admin withdrawals | `pages/admin/withdrawals/` — filters, summary cards, operations table, risk panel, decision panel, timeline, wizard stepper, export dialog, and `payment/` (`VietQrCard`, `ReceiptUploader`, `ReceiptOcrResult`, `WithdrawalPaymentStep`) |
| Admin finance | `pages/admin/finance/` — overview, transactions, top-ups, plus `FinanceFilters`, `FinanceMetricCard`, `FinanceRecentTransactions`, `FinanceReconciliationAlerts`, `TransactionDetailPanel` |
| Owner registration wizard | `pages/owner/components/` — `StepSelectTournament`, `StepSelectHorse`, `StepConfirmRegistration`, `RegistrationWizardHeader`, `RegistrationStatusTimeline` |
| Wallet | `pages/wallet/` — `WalletPage`, `TopUpSheet`, `WithdrawSheet`, `SavedAccounts`, `BankSelect`, `BankLogo`, `PerformanceChart`, `TransactionDetailModal`, `PaymentResultDialog` |

Receipt OCR in the withdrawal payment step runs client-side via `tesseract.js`. It assists
the reviewing admin; it is not an authorization control.

---

## 7. Development and testing

```bash
cd frontend
npm install
npm run dev            # Vite dev server on http://localhost:5173
npm run build          # tsc -b && vite build
npm test -- --run      # Vitest, single pass
```

The dev server proxies `/api` and `/uploads` to `VITE_BACKEND_ORIGIN`
(default `http://localhost:8080`), so no CORS configuration is needed locally.

### Vitest configuration

`jsdom` environment, globals on, setup file `src/test/setup.ts`, and two deliberate
deviations from the defaults recorded in `vite.config.ts`:

- `maxWorkers: 2` — at the default worker count (one per core), heavy page-render tests began
  exceeding the timeout or making jsdom throw `AggregateError` on XHR, so the same file
  passed or failed depending on the machine and on how many files were in the run.
- `testTimeout: 20000` — 5s is too tight for the heaviest page renders; a timeout there is a
  measurement artefact, not a defect.

96 test files sit beside the code they cover: route guards, layout switching, API clients,
money formatting, session handling, tournament date rules, and page rendering.

---

## 8. Environment variables

| Variable | Default | Effect |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | base URL used by `httpClient`. Leave unset locally so the dev proxy handles it |
| `VITE_BACKEND_ORIGIN` | `http://localhost:8080` | proxy target for `/api` and `/uploads` in dev |

Set them in `frontend/.env.local`; restart the dev server after a change.
