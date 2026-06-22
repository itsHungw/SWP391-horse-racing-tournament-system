# Compact Streak History And View-All Design

## Goal

Keep the spectator prediction sidebar compact by showing only the three newest streak predictions while providing a full-history modal consistent with the existing View All Predictions experience.

## Behavior

- Sort streak predictions by `createdAt` descending before rendering.
- Use descending `id` as a deterministic fallback when timestamps are equal or invalid.
- The My Streaks tab shows at most the first three sorted streaks.
- Show a `View All Streaks` button only when more than three streaks exist.
- Clicking the button opens a fixed overlay modal matching the existing View All Predictions modal.
- The modal renders every streak in the same newest-first order inside a scrollable body.
- Users can close the modal with the close button, the backdrop, or the Escape key.
- Empty history keeps the current empty state and does not show the View All button.

## Component Design

Extract the repeated streak ticket markup into a focused history-list component. The compact My Streaks panel and the full modal both use this component so status colors, leg details, wager, and total odds remain identical.

The parent spectator page owns sorting and modal visibility, following the existing View All Predictions pattern. `StreakSlip` receives only the three newest streaks, the total streak count for its badge, a `hasMoreStreaks` flag, and an `onViewAllStreaks` callback. The full modal receives the complete sorted list.

A small pure utility sorts streaks without mutating API state. This keeps ordering deterministic and straightforward to test.

## Accessibility

- The modal uses dialog semantics with an accessible title.
- The close button has an explicit accessible name.
- Escape closes the dialog.
- Opening View All moves focus into the modal; closing it returns focus to the trigger.
- The backdrop remains clickable without replacing the explicit close control.

## Testing

Tests will verify:

1. Newest streaks are ordered first without mutating the source array.
2. The compact panel renders no more than three tickets.
3. View All is absent for three or fewer streaks and present for four or more.
4. View All opens a dialog containing the full ordered history.
5. The dialog closes through its close button and Escape key.
