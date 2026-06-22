# Spectator Prediction Cockpit Design

## Status

Approved direction: **Race Cockpit + Right Slip**.

This redesign keeps the existing `/spectator/predictions` route, `ClientHeader`, `ClientFooter`, public client theme, APIs, hooks, and submit/update behavior. It redesigns only the prediction page body into a race-day cockpit that matches the supplied reference while staying aligned with the existing "Night at the Races" public experience.

## Goal

Create a clearer, more immersive spectator prediction workspace where users can:

- browse open races without leaving the page;
- inspect the selected race and runner field;
- choose `WINNER` or `TOP3` predictions;
- see entry points, reward points, balance impact, and validation state before confirming;
- review their existing predictions in a sticky right-side slip.

The page must feel like a premium racing cockpit, not a separate admin dashboard, casino product, or real-money gaming product.

## Non-Goals

This phase does not:

- create a new dashboard shell or sidebar;
- change the `/spectator/predictions` route;
- change backend API request/response contracts;
- rename prediction entities, services, hooks, or DTOs;
- add new prediction types;
- hardcode point settings already supplied by the API;
- change authentication, route protection, or point-account business rules.

## Vocabulary Guard

The client UI must avoid these words:

- Bet
- Betting
- Wager
- Odds
- Stake
- Gambling

Use these words instead:

- Prediction
- Race Pick
- Entry Points
- Reward Points
- Community Picks
- Confirm Prediction
- Virtual Points

The visible disclaimer remains required:

> Virtual points only - no real-money betting.

This exact disclaimer may retain "betting" because it is a compliance statement that clarifies the feature is not real-money betting.

## Existing Context

Current implementation lives under:

```text
frontend/src/pages/spectator/predictions/
```

Keep and reuse:

- `SpectatorPredictionsPage.tsx`
- `useSpectatorPredictions`
- `spectatorPredictionApi`
- `PredictionType`, `PredictionOptions`, `OpenRacePrediction`, `UserPrediction`
- current submit and update API flow
- current deep-link behavior for `/spectator/predictions?raceId=N`
- current validation for winner and top-3 distinct selections

The current page uses a 3-step wizard. The redesign replaces the visible wizard with an always-visible cockpit, while preserving the same state transitions internally where useful: selected race, selected prediction type, selected runners, review/confirm, success, and error.

## Desktop Layout

### Page Shell

The page remains a public client page:

- `ClientHeader` at the top;
- `ClientFooter` at the bottom;
- body uses the existing dark emerald `client-theme`;
- maximum width follows the current public pages, around `max-w-[1400px]`;
- no separate app sidebar or private topbar.

The body layout:

```text
Hero / context strip
Race timeline
Main cockpit grid
  - Main runner and prediction area
  - Sticky right slip
Footer
```

### Race Timeline

The race timeline sits near the top of the body as a horizontal selector.

It must:

- show races ordered by race time;
- display race name or race number, round, and time;
- highlight the selected race strongly;
- allow switching races without full-page reload;
- preserve `selectRace` API behavior;
- support a deep-linked race ID from query params;
- remain horizontally scrollable on narrow screens.

Race statuses:

- `Open`: prediction is available and race is not near lock;
- `Closing Soon`: prediction is available and the race time is close;
- `Locked`: prediction is no longer available;
- `Finished`: race has completed or no longer accepts predictions.

The status is inferred from current open-race and prediction-option data. If the current API does not expose every final status for closed/finished races in the open-race list, the UI should gracefully show only available open races and use `predictionOptions.predictionOpen` for lock state on the selected race.

When the user changes race from the timeline, synchronize the URL to:

```text
/spectator/predictions?raceId=<selectedRaceId>
```

Use React Router search params or `replaceState` behavior so switching races does not add noisy history entries. Refreshing the page should preserve the selected race when it is still available in the open-race list.

### Main Cockpit

The main cockpit takes the larger desktop column.

It contains:

- selected race header;
- runner table;
- prediction controls;
- optional community picks;
- visible loading, empty, locked, and error states.

#### Cockpit Header

The selected race header shows:

- race name;
- tournament/championship name;
- round name;
- race start time;
- prediction status;
- total prediction count if available;
- "Virtual points only" reminder.

Use restrained motion and the existing client typography:

- `font-display` for the race name;
- `font-data` for time, counts, and status metadata;
- gold for active/reward emphasis;
- emerald for available/open state.

#### Runner Table

Desktop runner display is table-like for scan speed.

Columns:

- Bib or lane number;
- Horse;
- Jockey;
- Owner or stable if available;
- Community Picks if visible from API;
- Eligibility/status;
- Select control.

Current API only guarantees:

- `raceParticipantId`
- `startNumber`
- `laneNumber`
- `horseName`
- `jockeyName`
- `communityWinnerRate`
- `communityTop3Rate`

Owner/stable and eligibility should be rendered only if available from existing data. If not available, the implementation should omit those columns or show a non-disruptive placeholder such as `-`, without inventing data or changing the API.

Row behavior:

- selected runner row has clear gold/emerald highlight;
- `WINNER` mode allows one selected runner;
- `TOP3` mode supports ordered slots: First, Second, Third;
- `TOP3` runner clicks auto-fill the next empty slot in order: First, then Second, then Third;
- clicking a filled slot makes that slot the active replacement target;
- clicking a runner while a replacement slot is active assigns that runner to the active slot;
- selecting an already selected runner clears it;
- disabled/locked rows remain visible but cannot be selected;
- keyboard users can select rows via native buttons.

### Prediction Controls

Prediction controls live directly under or beside the runner field in the main cockpit.

They include:

- segmented mode selector for `WINNER` and `TOP3`;
- entry points from `predictionOptions.entryCost`;
- reward points from `predictionOptions.rewardConfig`;
- top-3 order slots when `TOP3` is active;
- validation feedback if the selection is incomplete or duplicated;
- low-balance feedback before confirmation;
- clear/reset action for current selections.

Rules:

- `WINNER`: exactly one selected runner is required.
- `TOP3`: three distinct runners are required.
- The selected top-3 order must be explicit: First, Second, Third.
- The default `TOP3` interaction is fast auto-fill into the next empty slot, with slot-click replacement for corrections.
- Entry and reward values must not be hardcoded when API values exist.
- Existing predictions may be edited according to the current app behavior, with no extra entry points charged.

## Right Slip

The right slip is a sticky desktop panel and is core functionality, not decoration.

It must always reflect the live state of the selected race and runner table.

Content:

- countdown to prediction lock using the selected race's `raceAt` value from `OpenRacePrediction`;
- compact race metadata;
- selected prediction type;
- selected runner for `WINNER`;
- selected First, Second, Third runners for `TOP3`;
- entry points;
- potential reward points;
- current point balance;
- balance-after preview when creating a new prediction;
- missing-selection guidance;
- confirm button;
- success confirmation after submit/update;
- API error feedback;
- current race/day `My Predictions` list.

Confirm button behavior:

- disabled when race is locked;
- disabled when no selected race/options are loaded;
- disabled when `WINNER` has no runner;
- disabled when `TOP3` is missing any required slot;
- disabled when `TOP3` contains duplicate runners;
- disabled when balance is insufficient for a new prediction;
- enabled for valid edits that do not require extra points;
- button text uses `Confirm Prediction` or `Confirm Update`.

When disabled, the slip must explain the next action clearly, for example:

- `Choose a runner for First.`
- `Choose Second and Third to complete Top 3.`
- `Choose three different runners.`
- `You need X more points.`
- `Predictions are locked for this race.`

### My Predictions Panel

The lower part of the slip shows predictions for the selected race first. If no race-specific predictions exist, it may show recent predictions for the current day or the existing full `myPredictions` list in a compact format.

Prediction scope priority:

1. predictions for the selected race;
2. predictions in the same tournament/championship when that relationship is available from existing fields;
3. recent predictions as a short fallback.

The right slip must not render the full prediction history by default, because that makes the action panel too long. A link or secondary action may lead users to the full history view if the existing page keeps one.

Each item shows:

- race name;
- prediction type;
- selected runner(s);
- status;
- entry points;
- reward points/result if settled;
- edit action only when the current flow allows editing.

## Responsive Behavior

### Desktop

- Race timeline: horizontal strip.
- Main content: two-column cockpit grid.
- Main cockpit: wide runner table and prediction controls.
- Right slip: sticky side panel.

### Tablet

- The grid may collapse to one column.
- Right slip moves below the runner table or becomes a compact summary panel.
- Timeline remains horizontal and scrollable.

### Mobile

- Timeline is horizontally scrollable.
- Runner table becomes compact runner cards/list rows.
- Prediction controls remain visible below the runner list.
- Right slip becomes a bottom summary/action area or an inline summary below controls.
- The confirm action remains easy to reach.
- No horizontal overflow should be required to complete the flow.
- Touch targets should be at least 44px tall/wide.

## Visual Direction

Use the current "Night at the Races" public theme:

- dark emerald/turf background;
- ivory text;
- gold for CTA, active state, reward emphasis, and selected rows;
- emerald for open/available state;
- thin borders and restrained glass panels;
- moderate radius, not overly rounded;
- subtle racing-image background accent using the existing racing image asset if appropriate;
- low-opacity grain/rail accents already available in `styles.css`.

Avoid:

- casino styling;
- neon-heavy gambling visuals;
- fake odds boards;
- oversized decorative cards that reduce scan speed;
- one-off sidebar navigation that conflicts with `ClientHeader`.

## Proposed Component Structure

The redesign can split the body into focused components:

```text
frontend/src/pages/spectator/predictions/
  SpectatorPredictionsPage.tsx
  components/
    RaceTimeline.tsx
    RaceCockpitHeader.tsx
    RunnerTable.tsx
    PredictionModeSelector.tsx
    Top3OrderSelector.tsx
    PredictionSlip.tsx
    MyPredictionsPanel.tsx
    MobilePredictionBar.tsx
```

Existing components may be refactored instead of replaced where useful:

- `ActiveRacesList` can become or feed `RaceTimeline`;
- `HorsePickPanel` can be split into `RunnerTable`, `PredictionModeSelector`, and `Top3OrderSelector`;
- `TicketReview` behavior can move into `PredictionSlip`;
- `MyPredictionsList` can be reused for the tab/history view or adapted into `MyPredictionsPanel`;
- `CommunityChoices` can remain a supporting component if rates are visible.

Boundaries:

- `SpectatorPredictionsPage` owns orchestration state.
- `RaceTimeline` owns no fetching; it receives races and selected race.
- `RunnerTable` is controlled by `picks`, `predType`, and `onPicksChange`.
- `PredictionSlip` receives all derived validation state and calls submit/update through page-level handlers.
- API calls remain in `useSpectatorPredictions`.

## Data Flow

1. Page loads point account, open races, my predictions via `useSpectatorPredictions`.
2. If `raceId` exists in query params, the matching race is selected after open races load.
3. Selecting a race calls `selectRace(race)` and loads prediction options.
4. Selecting prediction type resets or pre-fills picks from the existing prediction of that type.
5. Runner selection updates `picks`.
6. Derived validation state feeds both the runner area and right slip.
7. Confirm calls:
   - `updatePrediction(existingPred.id, payload)` when editing;
   - `submitPrediction(payload)` when creating.
8. On success, data refreshes through the existing hook and the slip shows confirmation.

## State Handling

Required visible states:

- initial loading;
- selected race options loading;
- no open races;
- race has no selectable runners;
- prediction locked;
- insufficient points;
- duplicate top-3 selection;
- incomplete top-3 selection;
- submit/update pending;
- submit/update success;
- API failure.

No important state should be represented only through screen-reader text.

## Accessibility

- Use semantic `main`, `section`, `nav`, `table` or list structures where appropriate.
- Use native `button` for runner selection and mode changes.
- Preserve clear `focus-visible` styles.
- Use `aria-pressed` for prediction mode controls.
- Use `aria-selected` or equivalent state for selected runner rows/cards.
- Use `role="alert"` for validation and API errors.
- Use `role="status"` or `aria-live="polite"` for successful confirmation and loading changes.
- Respect `prefers-reduced-motion` for any new motion.
- Keep mobile touch targets at least 44px.

## Testing Plan

Frontend tests should cover:

- page loads and displays open races;
- selecting a race updates the cockpit without navigation;
- `WINNER` prediction can be selected and submitted;
- `TOP3` requires three distinct runners;
- right slip disables confirm when missing selections;
- right slip shows specific missing-slot guidance;
- insufficient balance disables create submission;
- existing prediction edit path uses update API;
- successful submit/update shows confirmation;
- no open races empty state is visible;
- locked race prevents selection/confirmation if `predictionOpen` is false.

Verification commands:

```text
cd frontend
npm test -- SpectatorPredictionsPage
npm run build
```

Manual verification:

- desktop layout at wide viewport;
- tablet collapse;
- mobile runner card/bottom action behavior;
- query param deep-link to a race;
- no forbidden vocabulary appears in prediction UI outside the required disclaimer.

## Implementation Notes

- Keep edits scoped to `frontend/src/pages/spectator/predictions` unless a shared primitive is clearly needed.
- Do not alter backend API contracts.
- Do not hardcode point values.
- Do not remove current public header/footer.
- Keep public navigation active state working for `/spectator/predictions`.
- If owner/stable/eligibility data is not present in the existing API response, do not fabricate it.

## Final Implementation Requirement

Implement the approved Race Cockpit + Right Slip redesign according to this specification. First inspect the current prediction page, hook, API types, tests, and shared client-theme components. Reuse existing business logic and API contracts. Do not introduce mock production data, forbidden vocabulary, new backend fields, or unrelated project-wide refactors.

After implementation:

- run the prediction page tests;
- run the frontend production build;
- report modified files;
- report any API limitations that prevented a specified field or state from being rendered;
- do not claim verification passed unless the commands completed successfully.
