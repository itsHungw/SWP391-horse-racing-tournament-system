# Paddock Club v2 Client UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.
> Steps use checkbox (`- [ ]`) syntax for tracking. The repo owner commits
> manually — never run `git commit`.

**Goal:** Close the spectator journey: championship/race detail pages, real-data
race calendar, 3-step prediction wizard, Cinematic+ motion polish.

**Architecture:** Frontend-only. New pages compose existing client primitives
(`MotionReveal`, `MotionStagger`, `Eyebrow`, `GoldRule`, `FoilStat`) plus three
new primitives (CountUp, Countdown, MotionPage). Data comes from already-public
endpoints via `racingApi` additions and the existing
`spectatorPredictionApi`/`leaderboardApi`.

**Tech Stack:** React 19, React Router 7, framer-motion 12 (`ease` tuples must
be `as const`), Tailwind 4 tokens from `styles.css`, Vitest + Testing Library.

Spec: `docs/superpowers/specs/2026-06-11-paddock-club-v2-client-ux-design.md`.

---

### Task 1: Motion/UI foundation

**Files:**
- Create: `frontend/src/components/client/CountUp.tsx` — props `{ value: number; duration?: number; className?: string; format?: (n: number) => string }`; uses `useReducedMotion` + rAF loop in `useEffect` triggered by `whileInView`-style IntersectionObserver via framer-motion `useInView`; renders final value immediately when reduced.
- Create: `frontend/src/components/client/Countdown.tsx` — props `{ target: string; doneLabel?: string; className?: string }`; 1s interval, segments d/h/m/s in `font-data`, clears interval on unmount; shows `doneLabel` when past.
- Create: `frontend/src/components/client/MotionPage.tsx` — wraps children in `motion.div` mount transition (opacity 0→1, y 14→0, 0.55s EASE), reduced-motion → opacity only.
- Create: `frontend/src/pages/public/components/StatusPill.tsx` — move the `StatusPill` currently inlined in `ChampionshipsPage.tsx:38-47`; import `toneClasses`/`StatusTone` from `../publicRacingData`.
- Modify: `frontend/src/pages/public/publicRacingData.ts` — add `raceStatus(status: string | undefined): { label: string; tone: StatusTone }` mapping: SCHEDULED→soon/Scheduled, CHECKING→live/Paddock Check, READY→live/At the Gate, ONGOING→live/Running, FINISHED|RESULT_SUBMITTED|RESULT_CONFIRMED→done/Finished, PUBLISHED→done/Results In, CANCELLED→neutral/Cancelled; plus `formatPostTime(value?: string)` returning `"h:mm a · Mon d"` and `formatDistance(m?: number)` returning `"1,600 m"`.
- Modify: `frontend/src/pages/public/ChampionshipsPage.tsx` — replace inline StatusPill with the shared import.

- [ ] Implement files, then `npx tsc --noEmit -p tsconfig.app.json` → 0 errors.

### Task 2: Public race API functions

**Files:**
- Modify: `frontend/src/api/racingApi.ts`

```ts
export async function getPublicTournament(id: number): Promise<Tournament> {
  const response = await httpClient.get<Tournament>(`/tournaments/${id}`);
  return response.data;
}
export async function getPublicRaces(tournamentId?: number): Promise<Race[]> {
  const response = await httpClient.get<Race[]>("/races", {
    params: tournamentId ? { tournamentId } : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
}
export async function getPublicRace(id: number): Promise<Race> {
  const response = await httpClient.get<Race>(`/races/${id}`);
  return response.data;
}
```
(`Race` imported from `../types/racing`.)

- [ ] Implement + typecheck.

### Task 3: ChampionshipDetailPage

**Files:**
- Create: `frontend/src/pages/public/ChampionshipDetailPage.tsx`
- Route (Task 5): `/championships/:id`

Content: `useParams` id → parallel load `getPublicTournament`, `getPublicRaces(id)`,
`getChampionshipStandings(id,"HORSE")` (standings failures degrade silently to
empty). Sections per spec: hero (StatusPill, name, code, location,
`formatDateRange`, reg window) on parallax `slide.jpg`; phase timeline derived
from `championshipStatus().tone` (soon/open→phase 0, live→1, done→2); stats band
(`CountUp` races scheduled / finished); race schedule grouped by calendar day
(`Link` per card to `/races/{race.id}`, `raceStatus` pill, `formatPostTime`,
`formatDistance`); standings block with HORSE/JOCKEY toggle → podium top-3
(staggered rise) + table rows 4-10; CTA band → `/spectator/predictions`.
States: skeleton grid while loading; `role="alert"` error; not-found panel with
link back to `/championships`.

- [ ] Implement + typecheck.

### Task 4: RaceDetailPage

**Files:**
- Create: `frontend/src/pages/public/RaceDetailPage.tsx`
- Route (Task 5): `/races/:id`

Content: load `getPublicRace(id)` + `spectatorPredictionApi.getPredictionOptions(id)`
(options failure → field hidden, page still renders). Hero: breadcrumb `Link` to
`/championships/{tournamentId}` (label tournamentName), race name, StatusPill via
`raceStatus`, `Countdown` to `raceDateTime` when scheduled-future else state
label, meta chips (distance, max field, code). "The Field": grid of runner cards
(start-number badge in gold ring, horse name `font-display`, jockey, lane) from
`options.options`; empty state "Field not drawn yet". Footer band: if
`options.predictionOpen` → emerald CTA `Link` to
`/spectator/predictions?raceId={id}`; else if finished tone → gold band "Results
feed the championship standings" linking back to programme. Not-found/error
states as Task 3.

- [ ] Implement + typecheck.

### Task 5: Wire lists + routes

**Files:**
- Modify: `frontend/src/routes/AppRouter.tsx` — import both pages; add
  `<Route path="championships/:id" …/>` and `<Route path="races/:id" …/>`
  next to the existing list routes (public, no guard).
- Modify: `frontend/src/pages/public/ChampionshipsPage.tsx` — wrap each card
  `article` content in `Link to={`/championships/${t.id}`}` (block link, keep
  hover styles, add ArrowRight affordance row "View programme").
- Rewrite: `frontend/src/pages/public/RacesPage.tsx` — same hero/CTA shells, but
  data = `getPublicRaces()`; group by month of `raceDateTime` (reuse group
  pattern), day badge from race date, card shows name/championship/post
  time/distance/`raceStatus` pill, whole card links `/races/{id}`.

- [ ] Implement + typecheck.

### Task 6: Prediction wizard

**Files:**
- Create: `frontend/src/pages/spectator/predictions/components/StepRail.tsx` —
  3 labeled steps, current highlighted, done steps clickable to go back.
- Create: `frontend/src/pages/spectator/predictions/components/HorsePickPanel.tsx`
  — props `{ options: PredictionOptions; predType; onPredType; picks: {winner?, second?, third?}; onPicksChange; pointBalance }`;
  type toggle (cost/reward strip reused from old panel); runner card grid —
  WINNER: tap selects winner; TOP3: tap fills first empty slot (1st→2nd→3rd),
  slot chips above grid clear on tap; validation messages inline.
- Create: `frontend/src/pages/spectator/predictions/components/TicketReview.tsx`
  — ticket summary (type, picks with names, entry cost, balance after, edit
  notice when updating); Confirm button (disabled while submitting); on success
  show stamped overlay (motion scale/rotate gold "SUBMITTED" seal, reduced →
  static) then `onDone()`.
- Rewrite: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`
  — keep hook + tabs (Open/My); within Open tab: `StepRail` + AnimatePresence
  switching step 1 (`ActiveRacesList`, select → step 2), step 2
  (`HorsePickPanel`, Continue validates: winner required; TOP3 needs 3 distinct;
  balance check unless editing), step 3 (`TicketReview` → submit/update via
  existing hook fns; success → reset to step 1 + switch to My tab). Editing from
  MyPredictionsList → selectRace + prefill + step 2. Read
  `useSearchParams().get("raceId")` once after load to preselect.
- Modify: `frontend/src/pages/spectator/predictions/hooks/useSpectatorPredictions.ts`
  — no API changes; expose `selectRaceById(id: number)` helper (finds in
  openRaces, calls selectRace) for the deep link.
- Delete usage (keep file): `PredictionFormPanel.tsx` no longer imported by the
  page (superseded by HorsePickPanel + TicketReview). Remove the file.

- [ ] Implement + typecheck.

### Task 7: Tests

**Files:**
- Create: `frontend/src/pages/public/ChampionshipDetailPage.test.tsx` — mock
  `racingApi` + `leaderboardApi`; assert hero name, a race card link href
  `/races/11`, standings podium name, CTA link.
- Create: `frontend/src/pages/public/RaceDetailPage.test.tsx` — mock
  `racingApi` + `spectatorPredictionApi`; assert field runner names, countdown
  region, prediction CTA href with `?raceId=`; finished variant shows results
  band.
- Create: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`
  — mock service; walk: select race (step2 appears), pick winner, continue,
  ticket shows pick, confirm calls submit with payload.
- Modify if needed: none expected (`App.test.tsx` untouched routes/nav).

- [ ] Implement; run targeted vitest files → pass.

### Task 8: Verification

- [ ] `npx tsc --noEmit -p tsconfig.app.json` → 0 errors.
- [ ] `npx vitest run` (full) → no NEW failures vs the 6 known pre-existing
      (admin/referee files).
- [ ] `npm run build` → success.
- [ ] Preview server: screenshot `/championships`, `/championships/:id`,
      `/races`, `/races/:id`, `/spectator/predictions` (wizard steps), confirm
      console clean.

## Self-Review

- Spec coverage: IA links (T5), championship detail (T3), race detail (T4),
  wizard (T6), Cinematic+ primitives (T1), tests (T7-8). Covered.
- No placeholders; all props/types named concretely.
- Type consistency: `raceStatus` returns same shape as `championshipStatus`;
  wizard reuses `PredictionOptions`/payload types from `prediction.types.ts`.
