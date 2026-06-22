# Championship Leaderboard Feature Design

## Status

Approved direction. **Frontend and backend both implemented.**

- Frontend: ready-to-wire data layer + premium empty-state (`LeaderboardPage.tsx`, `leaderboardApi.ts`, `leaderboardTypes.ts`).
- Backend (implemented, compiles): `leaderboard/controller/LeaderboardController.java`, `leaderboard/service/LeaderboardService.java`, `leaderboard/dto/response/*`, repo methods `RaceResultRepository.findByStatusIn` + `RacePredictionRepository.findByStatusIn`, and public GET whitelist in `SecurityConfig`. Standings are aggregated in Java from existing entities (`RaceResult.points`/`position` for Horse/Jockey; `UserPointAccount` + settled `RacePrediction` for Spectator) inside a read-only transaction — no native SQL, no schema change. Not yet integration-tested against a live SQL Server DB.

## Goal

Add a public `/leaderboard` page to the client portal that ranks the championship's top performers across three boards — **Horses**, **Jockeys**, and **Spectators** — with a single scope control to switch between **Overall (all championships)** and a **specific season (per championship)**.

The page must match the "Night at the Races" cinematic client design system, degrade gracefully to a premium empty-state until backend data exists, and wire straight through to the proposed endpoints with no UI changes once they ship.

## Scope Decision: Overall vs Per-Season

Both, via one selector (no separate pages):

- Default scope is **Overall** — aggregated across every championship.
- A season dropdown (populated from the existing `getPublicTournaments()`) lets the viewer narrow to a single championship.
- Horse and Jockey boards are championship-scoped points; "Overall" aggregates them across seasons.
- Spectator points are global (earned from predictions + blog rewards), so the Spectator board defaults to Overall but may still be filtered to a championship (points earned from that championship's race predictions).

## Boards

| Board | Ranks | Columns |
|-------|-------|---------|
| Horses | Horses by championship points from confirmed race results | rank · horse · owner · points · wins · podiums · starts · form (last 5) |
| Jockeys | Jockeys by championship points / performance | rank · jockey · subtitle · points · wins · podiums · starts · form |
| Spectators | Members by virtual points (prediction + blog rewards) | rank · member · points · correct predictions · accuracy |

Form markers: `W` = win, `P` = podium (2nd/3rd), `-` = unplaced. Most recent last; up to 5 shown.

## Backend Contract (to implement)

All endpoints are **public** (no auth) and return JSON arrays already sorted by rank ascending.

### Championship standings (Horses / Jockeys)

```
GET /standings?type=HORSE|JOCKEY                    → overall, all championships
GET /championships/{id}/standings?type=HORSE|JOCKEY → single championship
```

Response item:

```jsonc
{
  "rank": 1,
  "name": "Golden Arrow",        // horse name or jockey name
  "subtitle": "Sterling Stable", // owner/stable for horse; nationality/team for jockey; nullable
  "points": 128,
  "wins": 5,
  "podiums": 9,
  "starts": 12,
  "form": ["W", "P", "-", "W", "P"] // optional; most recent last; max 5 recommended
}
```

### Spectator leaderboard

```
GET /leaderboard/spectators?championshipId={id?}&limit={n=50}
```

`championshipId` optional — omit for global/overall. Response item:

```jsonc
{
  "rank": 1,
  "displayName": "Julian S.",   // privacy-safe display name only; never email
  "points": 340,
  "correctPredictions": 22,
  "totalPredictions": 31
}
```

Privacy: expose only a display name for spectators. Never return email, user id, or other PII.

## Performance, Caching & Pagination

- **Caching — deferred to a later phase.** Phase 1 may serve these endpoints directly from the DB (standings are write-rare and early traffic is low, so direct queries are acceptable). When read volume grows, add a cache (e.g. Redis) with a short TTL — **1 min** for a `Running` championship, **5 min** otherwise / for Overall — invalidated when a race result is confirmed or prediction points settle. This is a performance optimization only; it does not change the endpoint contract, so it can be added later with zero frontend impact. The frontend keeps only in-memory state for the current view.
- **Sorting is server-side only.** Backend returns the array already sorted by `rank`. The frontend never re-sorts (avoids divergence with the authoritative ranking and tie-break rules).
- **Pagination / size bounds:**
  - Spectator board: `limit` (default 50, recommend max 100). For deep lists, accept an optional `offset` and return more; the page currently requests a single capped page and shows the top N.
  - Horse / Jockey per-season boards are naturally bounded by the field size, so a full sorted list is acceptable. For **Overall** (which can grow across many seasons), the backend should accept the same `limit`/`offset` and the frontend should add load-more / pagination when results exceed a reasonable page (follow-up; not in phase 1).

## Data Refresh Strategy

- **Refetch triggers (phase 1):** on tab change and on season-scope change. Each `(tab, scope)` combination is fetched fresh.
- **No live polling / WebSocket in phase 1.** Standings only move when a race result is **confirmed** (a batched, infrequent event), so continuous live updates add cost without real value. Rely on the backend cache TTL for freshness.
- **Future options (out of phase 1):** a manual "Refresh" affordance; short-interval polling (e.g. 30–60s) enabled *only* while the selected championship status is `Running`; or refetch on window focus. These are additive and require no contract change.

## Integrity & Anti-Abuse (Spectator board)

Because the Spectator board ranks virtual points earned from predictions **and** blog rewards, "leaderboard climbing" can incentivise abuse (farming blog-read rewards, collusion, or bulk low-effort predictions). The **backend owns enforcement**; the frontend simply renders the filtered, authoritative list.

Backend requirements:

- **Exclude non-eligible accounts** from the board: banned / suspended / disabled accounts, and admin / staff / system / test accounts. A simple `WHERE account.status = ACTIVE AND account.role = SPECTATOR AND NOT account.excludedFromLeaderboard` is sufficient; expose an `excludedFromLeaderboard` flag so accounts can be removed without deleting their points.
- **Cap reward farming at the source.** The point engine already has `DAILY_BLOG_REWARD_LIMIT` and blog reward gating (min reading time + scroll depth); keep these authoritative and server-validated (never trust client-reported `readingSeconds`/`scrollPercent` blindly — sanity-check them).
- **Reduce blog-farming dominance (recommended):** consider ranking primarily by **prediction points** (skill-based) and surfacing blog points separately, or weighting them, so the board rewards genuine engagement over grind. This is a product/tuning decision; the contract shape does not change.
- **Collusion / anomaly detection** (e.g. coordinated identical predictions, sudden point spikes) is a later anti-fraud task and is out of scope here, but the `excludedFromLeaderboard` flag gives operators a manual lever in the meantime.

Frontend implication: none beyond rendering. The page must not attempt client-side filtering of accounts — it trusts the backend-filtered list.

## Frontend Architecture (implemented)

- `frontend/src/api/leaderboardApi.ts` — `getChampionshipStandings(championshipId | null, type)`, `getSpectatorLeaderboard(championshipId | null, limit)`. Both tolerate non-array responses; throwing endpoints (404 while unimplemented) are caught by the page and surface the empty-state.
- `frontend/src/pages/public/leaderboard/leaderboardTypes.ts` — `StandingType`, `BoardTab`, `FormResult`, `ChampionshipStanding`, `SpectatorStanding`.
- `frontend/src/pages/public/LeaderboardPage.tsx` — page: tabs, scope selector, podium, table, states. Both board shapes are mapped to one internal `DisplayRow` view-model so podium/table rendering is shared.
- Route `/leaderboard` already registered in `AppRouter.tsx`; linked from `ClientHeader` and `ClientFooter`.

## Page Design

- **Hero**: cinematic dark hero with parallax image, gold eyebrow "The Standings", Fraunces title "Leaderboard.".
- **Controls**: pill tabs (Horses/Jockeys/Spectators) + season `<select>` (Overall + each championship).
- **Podium**: top 3 as gold/silver/bronze cards (1st centered + raised, foil numerals) — shown only when ≥3 ranked entries exist.
- **Ranked table**: rank · name (+subtitle/form) · per-board stat columns · points (gold mono). Responsive: stat columns hide on small screens; form pips drop under the name on mobile.
- **Form pips (implemented colour mapping)**: `W` → gold chip on `turf-950` (win); `P` → emerald (`emerald-soft` on `emerald-glow/30`) for a podium finish; `-` → neutral (`ivory-faint` on `white/8`) for unplaced. Emerald (not silver) is used for `P` to stay within the cinematic green/gold palette; each pip has a `title` tooltip ("Win" / "Podium" / "Unplaced"). The mapping is themeable in one place (`FormPips`).
- **Reduced motion** respected via shared primitives.

## UX States (all visible, never sr-only)

- **Loading**: skeleton rows.
- **Empty / not-yet-available**: premium panel — "Standings open with the first confirmed results." with CTAs to Race Calendar and Prediction Arena. This is the expected state until the backend endpoints ship (a 404 is treated as not-ready, not a hard error).
- **Data**: podium + table.

## Accessibility

- Tabs and selector are keyboard reachable with clear focus-visible rings.
- Use real `<button>` for tabs (actions) and `<Link>` for navigation CTAs.
- Decorative hero image uses empty alt text.
- Numeric columns use tabular mono; small uppercase labels keep adequate contrast.

## Testing / Verification

- Frontend: type-check passes; `/leaderboard` renders the three tabs, the season selector, and the empty-state while endpoints are absent (verified).
- Once endpoints ship: verify podium + table populate per tab and per scope, and that switching scope/tab refetches.
- No client test currently asserts leaderboard data (no fabricated fixtures); add tests when the backend contract is live.

## Scope Exclusions

- Does not implement the backend endpoints (separate backend task per the contract above).
- Does not fabricate/mock standings data on the client — empty-state until real data exists.
- Does not change auth, the points/prediction engines, or the championship/race domains.
- Does not add a per-spectator profile or detailed match history page in this phase.

## Approved Direction

Three-board leaderboard (Horses / Jockeys / Spectators) with a single Overall↔season selector, cinematic podium + ranked table, ready-to-wire data layer against the proposed public endpoints, and a premium empty-state until the backend delivers them.
