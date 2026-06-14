# Paddock Club v2 — Client UX Redesign Design

## Purpose

Complete the spectator journey on the public client. The existing "Night at the
Races" design system (turf greens, gold leaf, ivory; Fraunces/Hanken
Grotesk/Geist Mono; framer-motion primitives) stays — this phase fixes the
information architecture and deepens the experience so a first-time visitor can
understand and navigate the product without guidance.

Approved direction (user):

1. Add public detail pages `/championships/:id` and `/races/:id` so list pages
   stop dead-ending.
2. Restructure the Prediction Arena into an explicit 3-step flow.
3. Animation level "Cinematic+": tasteful upgrades (count-up numerals, live
   countdowns, page-mount transitions, podium reveals) — all honoring
   `prefers-reduced-motion`.

## Scope

Public + spectator pages only. No backend changes — every page is powered by
endpoints that already exist and are publicly readable:

- `GET /api/v1/tournaments`, `GET /api/v1/tournaments/{id}`
- `GET /api/v1/races?tournamentId=`, `GET /api/v1/races/{id}`
- `GET /api/v1/races/{raceId}/prediction-options` (lineup + costs + open flag)
- `GET /api/v1/championships/{id}/standings?type=HORSE|JOCKEY`
- Existing spectator prediction endpoints (unchanged).

Out of scope: admin/owner/jockey/referee workspaces, auth pages, backend,
global lazy-loading.

## Information Architecture

Closed loop: Home → Championships → **Championship detail** → **Race detail** →
Prediction Arena → Leaderboard, with cross-links at every hop and breadcrumbs
back. List cards become fully clickable.

`/races` switches from deriving a calendar out of tournaments to listing real
race entities (`GET /races`), grouped by month, each linking to its race card.

## Page Designs

### `/championships/:id` — "The Meet Programme"

- Hero: parallax image, status pill, name, code, location, date range,
  registration window.
- Phase timeline: Registration → Racing → Concluded, with the current phase
  highlighted — instant orientation for newcomers.
- Stats band with count-up numerals (races scheduled, races finished).
- Race schedule: chronological cards grouped by day → each links `/races/:id`;
  status pill per race.
- Standings: Horses/Jockeys toggle, top-3 podium reveal + compact table from the
  championship standings API; link to the full Leaderboard.
- CTA band to the Prediction Arena.
- Dedicated skeleton, error, and not-found states in theme.

### `/races/:id` — "The Race Card"

- Hero: race name, championship breadcrumb link, live countdown to post time
  (or Finished/Underway state), distance, status pill.
- "The Field": lineup grid from prediction-options — start-number silk badge,
  horse name (display serif), jockey, lane. Empty state when the field is not
  drawn yet.
- If prediction is open: sticky CTA "Make your pick" → `/spectator/predictions?raceId={id}`.
- If finished: notice that results feed the standings + link back to the
  championship programme.

### Prediction Arena — 3-step wizard

Replaces the side-by-side list+form with a stepper (state preserved, same hook
`useSpectatorPredictions`, same API calls):

1. **Pick a race** — open-race cards with countdown and "Submitted" badges.
2. **Pick your horses** — Winner/Top 3 toggle showing live cost/reward; tactile
   horse cards (tap to fill the next open slot; tap a slot to clear). Replaces
   `<select>` dropdowns.
3. **Review the ticket** — selections, entry cost, balance after; confirm →
   stamped-ticket success animation; then jump to My Predictions.

Step rail shows progress; back navigation never loses choices. Editing an
existing prediction enters at step 2 prefilled. Balance chip always visible.
`?raceId=` deep link preselects the race and (if open) starts at step 2.

### List pages

- ChampionshipsPage: whole card wraps in `Link` to the programme; arrow
  affordance; hover lift kept.
- RacesPage: rebuilt on real races grouped by month (day badge, post time,
  distance, status pill, championship name), linking to race cards. Hero and
  prediction CTA kept.

## New Shared Pieces

- `components/client/CountUp.tsx` — animates 0→value on first view; static when
  reduced motion.
- `components/client/Countdown.tsx` — d/h/m/s segments to a target date with
  finished label; interval cleanup.
- `components/client/MotionPage.tsx` — standard page-mount fade-rise wrapper.
- `pages/public/components/StatusPill.tsx` — extracted from ChampionshipsPage so
  every page shares one status language.
- `publicRacingData.ts` gains `raceStatus()` mapping `RaceStatus` →
  tone/label (Scheduled / Paddock Check / At the Gate / Running / Results In /
  Finished / Cancelled).

## Accessibility & UX Guardrails

- All motion honors `useReducedMotion`; countdown/count-up render final values
  statically.
- Status pills always pair color with a text label.
- Focus-visible rings on all interactive cards (`focus-visible:outline`).
- Skeletons (not spinners) for loading; friendly empty states; error banners
  with role="alert".

## Testing

- New vitest files: ChampionshipDetailPage (hero + race links + standings),
  RaceDetailPage (field + CTA states), prediction wizard (step flow + ticket
  confirm callback).
- Existing suites must stay green (`App.test.tsx` nav unchanged).
- `tsc -p tsconfig.app.json`, full vitest, `npm run build`, preview screenshots.
