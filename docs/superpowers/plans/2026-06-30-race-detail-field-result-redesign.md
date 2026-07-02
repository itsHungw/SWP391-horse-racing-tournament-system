# Race Detail Field and Result Redesign

Date: 2026-06-30

## Scope

Improve the public race detail page UX for:

- Runner field display.
- Official result display after a race is official.
- Mobile scalability when runner count, gate numbers, or result rows grow.

## Decisions

- Replaced the runner card grid with a compact post-position board.
- Sorted runners by start number, then lane number, then horse name.
- Added field summary metrics for declared runners and field cap.
- Changed official result from a plain information list into a race story:
  - Winner feature panel.
  - Podium summary.
  - Full result ledger.
- Mobile result ledger hides secondary columns and keeps the key reading path: position, runner, time.
- Long horse names wrap instead of being aggressively truncated on mobile.

## Implementation

- Updated `frontend/src/pages/public/RaceDetailPage.tsx`.
- Added result formatting helpers for time and winner gap.
- Reused existing palette, typography, borders, and spacing patterns from the public racing UI.
- Kept the change scoped to the public race detail page.

## Verification

- `npm test -- --run src/pages/public/RaceDetailPage.test.tsx`
- `npm run build`
- `git diff --check`
- Playwright visual check on:
  - Desktop viewport: `1440x1000`
  - Mobile viewport: `390x844`

## Notes

- Vite still reports the existing large chunk warning after production build.
- Browser console still shows unauthenticated `/api/v1/auth/refresh` 401 and missing favicon 404 when testing as a guest; these are not caused by this redesign.
