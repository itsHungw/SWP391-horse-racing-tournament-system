---
target: frontend/src/pages/public (codex UI pass)
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-07-29T18-32-40Z
slug: frontend-src-pages-public
---
# Critique — public client pages (codex UI pass)

Scope: HomePage, RacesPage, ChampionshipsPage, RaceDetailPage, new `components/SegmentedControl.tsx` + `components/SilkChip.tsx`, `racingDiscovery.ts`, `publicRacingData.ts`.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | HomePage featured block stays in skeleton across a 3-stage request waterfall; no cache, so every return to `/` replays it |
| 2 | Match System / Real World | 3 | "Final time 1.000s" on a 1,900 m race — raw seconds, not racing time format |
| 3 | User Control and Freedom | 3 | RacesPage now has 4 filter controls and no "clear filters" affordance |
| 4 | Consistency and Standards | 2 | HomePage leads with the past replay, `/races` leads with the next race — opposite editorial priority for the same season. Border-radius vocabulary now mixes `rounded-xl` / `rounded-lg` / `rounded-sm` / square |
| 5 | Error Prevention | 3 | n/a |
| 6 | Recognition Rather Than Recall | 3 | Status filters promoted from a `<select>` to a visible segmented control — real gain |
| 7 | Flexibility and Efficiency | 2 | SegmentedControl has no arrow-key navigation or roving tabindex; `role="group"` + `aria-pressed` doesn't announce "1 of 5" |
| 8 | Aesthetic and Minimalist Design | 3 | Killing the auto-rotating BannerCarousel is the single best change; RacesPage hero now stacks eyebrow-on-eyebrow-on-eyebrow |
| 9 | Error Recovery | 3 | Highlight fetch failures swallowed by bare `catch {}` on HomePage |
| 10 | Help and Documentation | 2 | Unchanged; no contextual help |
| **Total** | | **27/40** | **Acceptable — solid direction, needs a perf + consistency pass** |

## Anti-Patterns Verdict

**LLM assessment**: Does not read as AI-generated. The racing vocabulary is committed and specific (Next to post, Draw, Silks, Programme, Replay, Under review), the layout is asymmetric rather than a card grid, and the new two-up "next race + latest replay" composition is a real editorial decision rather than template filler. The extraction of `SilkChip` out of `RaceDetailPage` into a shared component is correct systems thinking.

**Deterministic scan**: `detect.mjs` returned 2 findings, both `side-tab` (`border-l-4`) at `HomePage.tsx:560` and `:564` — the blog error and empty states. Verified via `git diff`: **pre-existing, not introduced by this pass.** No new anti-pattern hits across the 5 changed/new files.

**Visual overlays**: not injected — screenshot/overlay tooling wedges on these pages (infinite CSS animations never idle). Evidence gathered via DOM queries and the network panel instead.

## Overall Impression

The information design is genuinely better than what it replaced. Two auto-rotating carousels are gone, replaced by one committed choice per page, and the stale-race bug (a scheduled race in the past still labelled "Next to post") is properly fixed at both the API boundary (`from` param) and the ranking function (`timestamp >= now`) with a test covering it.

The cost is on the wire. The homepage went from 4 API calls to 10, five of which are a per-race probe loop where four return `204 No Content`. That is the biggest opportunity: the payoff is one highlight video, and the price is a 3-deep request waterfall on the site's front door.

## What's Working

1. **BannerCarousel removal.** Auto-rotating hero content is hostile — it moves under the pointer, hides items behind a timer, and forces a mental model of "what did I just miss". Replacing it with `focusChampionship` (one card) and a `NextToPost` + `LatestReplayCard` two-up is strictly better.
2. **The stale-race fix is done properly.** `rankRacesToPost(upcoming, results, now)` takes an injectable `now`, filters scheduled races to the future, and is covered by a new test. The matching `from: formatDateInput()` at the API boundary means the client isn't just papering over server data. This is the kind of fix that stays fixed.
3. **`SegmentedControl` is a real primitive, not a one-off.** Generic over `Value extends string`, `useId()` scopes the `layoutId` so two instances on one page don't fight, `useReducedMotion()` collapses the spring to `duration: 0`, 44px min target, visible focus ring. Contrast measured 12.38:1 inactive, ~9:1 active.

## Priority Issues

### [P1] The homepage fires 10 API calls, 4 of them guaranteed-empty

`HomePage.tsx` `loadFeaturedRace` fetches 5 results, then probes `getPublicRaceHighlight(race.id)` for **each** in a `Promise.all`, then fetches `getPublicRaceResults`. Measured on a real load:

```
races/search?scope=UPCOMING  →  200
races/search?scope=RESULTS   →  200
racing-summary               →  200
races/15/highlight           →  200
races/9/highlight            →  204   ← wasted
races/7/highlight            →  204   ← wasted
races/5/highlight            →  204   ← wasted
races/3/highlight            →  204   ← wasted
races/15/results             →  200
```

Three problems compound:
- **It is a waterfall, not a fan-out.** Stage 1 (search) must finish before stage 2 (5 probes) before stage 3 (results). The featured block holds its skeleton for all three round trips.
- **No cache.** This is a raw `useEffect`, not `usePublicQuery`. Every navigation back to `/` replays all 10. React `StrictMode` doubles it to 20 in dev — which is what is flooding the query log.
- **A batch path already exists and is unused.** `RaceMediaService.getPublicHighlightsForRaces(List<Long>)` and `RaceMediaRepository.findPublishedByRaceIds` are already written; no controller exposes them. `GET /races/highlights?tournamentId=` exists but is the wrong axis.

**Fix**: expose the existing batch service as `GET /api/v1/races/highlights?raceIds=15,9,7,5,3`, call it once, and move the whole block onto `usePublicQuery` so it caches like RacesPage already does. 10 calls → 4, waterfall depth 3 → 2.

**Suggested command**: `/impeccable optimize`

### [P1] The homepage and `/races` disagree about what matters

`/races` leads with **Next to post** (the upcoming race) and demotes the replay to a sidebar card. The homepage does the exact opposite: `selectedRace = replay?.race ?? results.content[0] ?? selectNextToPost(...)`, so whenever *any* result exists with a published highlight, the front door leads with a finished race. Verified live — the homepage hero currently reads "Latest Race Replay / Official Result" while `/races` reads "Next to post / Scheduled".

Two consequences:
- `selectNextToPost` is now effectively dead on the homepage — it only fires when there are zero results, ever.
- The `scope=UPCOMING` request is fetched and then discarded in the same dead branch. A wasted query on every load.

A spectator arriving at the front door should be told what to *do* (a race is coming, predict it), not only what already happened. The replay is a great asset — it belongs in the frame, but as the visual, not as the headline.

**Fix**: mirror the `/races` hierarchy on the homepage — next race as headline, replay as the media panel beside it. Both are already loaded.

**Suggested command**: `/impeccable shape`

### [P2] "Final time 1.000s" on a 1,900 m race

`HomePage.tsx:346` renders `${featuredWinnerTime.toFixed(3)}s`. A 1,900 m race takes ~2 minutes; the hero currently states 1.000s. The seed data is bad, but the UI has no sanity guard and no racing-appropriate format, and this is now on the front page rather than buried in a results table.

The logic is also duplicated — `RaceDetailPage.tsx:58` already has `formatResultTime`. `SilkChip` was extracted correctly in this same pass; this one was not.

**Fix**: extract `formatResultTime` into `publicRacingData.ts`, format ≥60s as `m:ss.SSS`, and render "—" rather than an implausible value.

**Suggested command**: `/impeccable harden`

### [P2] "All championships" truncates on mobile

At 375px the status filter grid is `grid-cols-2` with the last button spanning 2. Measured: the active button is 159px and "All championships" clips to "All championsh…". The truncation lands on the *default selected* option, so the first thing a phone user reads is a broken word.

**Fix**: short labels at mobile (`All`), or give the first button the `col-span-2` instead of the last.

**Suggested command**: `/impeccable adapt`

### [P2] SegmentedControl is a radio group wearing button clothes

`role="group"` + `aria-pressed` on 5 mutually-exclusive options announces "All championships, pressed, button" with no sense of position or set. The correct pattern is `role="radiogroup"` / `role="radio"` / `aria-checked`, with roving tabindex so Left/Right move between options and only one enters the tab order. Right now a keyboard user tabs through 5 stops to reach the last filter, on two separate controls per page.

Still a net improvement over the previous unlabelled buttons, but it is a new shared primitive — worth getting right once.

**Suggested command**: `/impeccable audit`

## Persona Red Flags

**Alex (power user)**: Tabs 5 times to reach "Completed", then 2 more for the view toggle — no arrow-key navigation in either segmented control. Sets four filters on `/races` (search, championship, from, to) and finds no way to clear them except editing each one back to empty. Lands on the homepage wanting the next race and gets a replay of one that already ran.

**Casey (distracted mobile)**: On 375px the default filter reads "All championsh…". The `/races` filter bar is correctly non-sticky below `lg` — good call, it would have eaten a third of the viewport. Returns to the homepage after checking a race and pays the full 10-request reload because nothing is cached.

**Riley (stress tester)**: Kills the network mid-load — the highlight probes fail into bare `catch {}` and the page renders as if no replay exists, with no signal that anything was attempted. Watches the query log and sees 20 hits per homepage mount under StrictMode.

## Minor Observations

- Two blank lines and a missing one: `LatestReplayCard` is separated from `NextToPost` by a double blank line and sits flush against `export function RacesPage()` with no separator.
- RacesPage hero stacks "Race-day priority" → "What matters now." → "Next to post" → "Latest replay" — four label layers before any content. One could go.
- Border-radius vocabulary drifted: `rounded-xl` (segmented shell), `rounded-lg` (inputs, segment buttons), `rounded-sm` (CTAs), square (list rows, hero cards). Pick two.
- `formatDateInput()` sends a bare local date with no time or zone. Verify the backend does not read it as UTC midnight, or a morning race in UTC+7 can vanish from "upcoming" at the boundary.
- `detect.mjs` flagged two pre-existing `border-l-4` side-tabs at `HomePage.tsx:560,564` (blog error + empty state). Not from this pass, but worth clearing.
- ChampionshipsPage test emits an unwrapped-`act()` warning. Passing, but noisy.

## Questions to Consider

- If a spectator only sees one thing on the homepage, should it be what already happened or what they can still act on?
- The replay probe costs 5 requests to find 1 video. What if the race search response simply carried a `hasHighlight` boolean?
- Two segmented controls, four filter inputs, and a search box now sit above the race list. Does the programme need six controls, or two?
