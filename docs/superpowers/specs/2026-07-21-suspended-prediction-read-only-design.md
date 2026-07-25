# Suspended Prediction Arena Read-only Design

## Goal

Keep the Prediction Arena useful and truthful for suspended users while preventing every action that creates or changes a prediction. A suspended user can inspect races, odds, existing positions, streak history, results, and settlement information without encountering mutation controls that the backend will reject.

## Account-state behavior

- `ACTIVE`: retain the current Prediction Arena behavior.
- `SUSPENDED`: render the arena in an explicit read-only mode.
- `BANNED`: retain the existing redirect to `/account-restricted`.

The frontend derives this mode from the authenticated client session through `accountCapabilities`. Backend authorization remains authoritative; the frontend restrictions exist to provide honest UX and avoid avoidable rejected requests.

## Suspended-state notice

Render one compact operational notice directly below the client header and above the arena content.

- Eyebrow: `ACCOUNT UNDER REVIEW`
- Heading: `Predictions are temporarily paused`
- Body: explain that race data, odds, existing predictions, and settlements remain available, but new predictions are paused during review.
- Secondary action: `Review account status`, linking to `/account-restricted`.

The notice uses the existing racing-control visual language: dark burgundy surface, restrained amber rule, compact typography, and a single lock/shield symbol. It must not use a full-page overlay, decorative illustration, oversized empty space, or unrelated gradients.

## Read-only interaction matrix

The following remain interactive because they only navigate or reveal existing information:

- Race timeline and race selection
- Prediction mode tabs
- Odds and participant information
- Bet Slip / My Positions tabs
- Existing prediction and streak-history dialogs
- Rules and informational dialogs

The following become disabled or unavailable:

- Runner, exact-position, and head-to-head selection
- Adding, replacing, or removing streak legs
- Wager presets, custom wager entry, increment, and decrement controls
- Clear-selection actions
- Prediction and streak confirmation actions

Disabled controls must not retain misleading hover treatments. The confirmation area shows a lock state with the label `Unavailable while suspended` and a short explanation instead of relying only on reduced opacity.

## Network behavior and safeguards

When the arena is read-only:

- Do not call the prediction quote endpoint.
- Do not call prediction or streak submission endpoints.
- Keep all existing read endpoints enabled.
- Add handler-level guards in the page in addition to disabled component props, preventing future component regressions from issuing mutation requests.
- If the backend still rejects a request because account state changed after initial rendering, preserve the existing global enforcement/session synchronization behavior.

## Component boundaries

- `SpectatorPredictionsPage` owns the account capability decision and the suspended notice.
- Selection components receive a shared disabled/read-only value rather than independently reading authentication state.
- `PredictionSlip` receives a read-only reason and owns the explicit locked confirmation state.
- `StreakSlip` receives the same read-only contract for leg and submission controls.
- Quote suppression belongs in `PredictionSlip`, where quote requests currently originate.

This keeps account policy in one page-level decision while components remain reusable and testable.

## Accessibility

- Announce the suspended notice as a labelled status region without repeatedly interrupting screen readers.
- Disabled native controls use the `disabled` attribute where possible.
- The account-status link and all remaining actions retain visible focus indicators and minimum touch targets.
- The lock explanation is textual; state is not conveyed by color or icon alone.

## Focused verification

Frontend tests cover:

1. A suspended user sees the notice and account-status link.
2. Existing positions and history remain available.
3. Suspended interaction does not call quote, prediction submission, or streak submission APIs.
4. Active users retain the current prediction flow.

Run only the focused Prediction Arena test file followed by the frontend production build.
