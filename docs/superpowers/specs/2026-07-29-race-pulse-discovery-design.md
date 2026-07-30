# Race Pulse Discovery Design

Date: 2026-07-29
Status: Proposed — direction approved, written-spec review pending
Scope: public `/races` discovery experience on desktop and mobile

## 1. Problem

The public race page should feel like a sports programme, not a betting lobby. A visitor entering `/races` is primarily trying to understand what happened, what is happening, or what is next. Prediction is a contextual conversion that should appear after the race earns attention.

The current surface gives the hero, two segmented controls, search, championship selection, and date inputs similar visual weight. This increases decision load before the user reaches the race list. On desktop, the visible horizontal selector scroll affordance also reads as unfinished layout rather than intentional navigation.

## 2. Behavioral model

Primary intent order:

1. Watch a live race when one exists.
2. Understand the latest official race result and replay.
3. Find the next race on the programme.
4. Make a prediction after showing interest in a specific race.

This is a content-led funnel:

`race context → attention → confidence/interest → prediction`

The page must support prediction discovery without making prediction the first visual question.

## 3. Decision: adaptive Race Pulse

The top feature is a compact, state-aware Race Pulse. It selects the most relevant race using this priority:

| State | Feature label | Primary action | Secondary action |
| --- | --- | --- | --- |
| A live race with published live media | `Live now` | Watch live | View race card |
| No live race; latest official result exists | `Latest official result` | Watch highlight when available | View full result |
| No replay but latest official result exists | `Latest result` | View full result | View race card |
| No completed result is available | `Next on the programme` | View race card | Make prediction when open |

The label must always state the state and date context. Never use an ambiguous label such as `Latest race` without a date or result status.

The hero is deliberately compact rather than viewport-filling. The user should reach the programme controls and the first list item without an excessive scroll.

### Hero content

- Left/content side: state label, championship, race name, date/time, distance, field size, and winner when official.
- Media side: highlight thumbnail or live media with a single play action; use a calm fallback panel when media is unavailable.
- Supporting module: next race summary, visible without competing with the featured race.
- Prediction CTA: only when the selected race is upcoming and its prediction market is open; render as a secondary action.

## 4. Information architecture

### Primary scope

Keep only `Upcoming` and `Results` as the main scope switch. It answers what data the user wants and should receive the strongest active treatment.

### View mode

Keep `Agenda` and `Calendar`, but make them a lower-emphasis view toggle aligned with the programme heading. They change representation, not content scope, so they should not visually compete with the primary scope.

### Filters

Use progressive disclosure for search, championship, and date range:

- Desktop: one compact `Filters` control plus an optional visible search field when space allows.
- Mobile: a filter button that opens a sheet; preserve selected values in the URL.
- Show a small active-filter count and a clear-all action only when filters are applied.
- Do not expose a desktop scrollbar for the primary controls.

## 5. Programme list

Keep an editorial agenda list rather than a card grid. The list is the correct structure for comparing time, status, venue, runners, and next action.

Each row follows this scan order:

1. State/time/date.
2. Race and championship identity.
3. Compact metadata: distance and field size.
4. One state-specific primary action.
5. Prediction as a quiet contextual action only when available.

Primary actions by state:

- Live: `Watch live` or `Follow race`.
- Upcoming: `View race card`.
- Completed with media: `Watch highlight`.
- Completed without media: `View result`.

Avoid showing `Predict` and `Race card` as equal filled buttons on every upcoming row.

## 6. Visual and motion rules

- Use gold for the single primary scope/selection treatment.
- Reserve teal/green for live or positive action states; do not use it as a second competing tab selection.
- Keep row borders and dividers quiet but visible; let status, time, and race name create hierarchy.
- Use the existing serif display/sans utility pairing and dark turf palette; do not add glassmorphism, gradients, or decorative cards.
- Animate only the active indicator and local state changes at approximately 180–240ms.
- Respect `prefers-reduced-motion`; selected state must remain clear without animation.

## 7. Responsive behavior

- Desktop: split Race Pulse with media and content, then a clean programme control row.
- Tablet: stack supporting module below the featured content before the list.
- Mobile: stack content/media, use a full-width primary action, move filters into a sheet, and allow touch scrolling for compact tabs without a visible scrollbar.
- Maintain at least 44px interactive targets and preserve focus order from state label → content → media → action → supporting race.

## 8. Data and implementation boundary

The first implementation should use the existing public race search, `RaceSummary`, and public highlight endpoints. No new backend endpoint is required for the initial design.

The frontend may request the relevant upcoming/results slices and select the Race Pulse state from returned status, official-result, winner, and media availability. If this creates duplicate fetching or inconsistent ordering at production scale, a later backend discovery endpoint can own the selection logic; that is outside this change.

Required fallbacks:

- No races: explain that the programme is not published yet and keep discovery controls usable.
- Result without media: show the official result card without a broken player.
- Media request failure: preserve the race/result content and expose a retry or result action.
- Loading: reserve hero dimensions to prevent layout shift.

## 9. Measurement

Validate the behavior hypothesis with product events rather than assumptions:

- First meaningful click from `/races`: race card, result, highlight, or prediction.
- Race detail → prediction entry and completed prediction rate.
- Highlight play rate and full-result open rate.
- Filter open rate, filter completion, and filter reset rate.
- Scroll depth to the first two programme rows.

The target is not maximum prediction clicks in isolation. The target is higher race-content engagement while preserving a healthy contextual path into prediction.

## 10. Acceptance criteria

- The first feature visibly answers what is most relevant now without requiring a filter decision.
- A visitor can identify the latest official result, next race, and primary action within one scan.
- Prediction is discoverable on relevant upcoming races but is not the dominant action on the race discovery page.
- The primary scope and view mode are visually distinct in hierarchy.
- Desktop has no accidental horizontal scrollbar for the control row.
- Mobile filters remain usable without turning the page into a dense toolbar.
- Existing race/result/highlight response shapes remain unchanged.

## 11. Follow-up boundary

Apply the same control hierarchy to `/championships` after the race page is validated. Do not blindly duplicate the Race Pulse hero there: championships are an archive/programme discovery task and should keep their own status and season framing.
