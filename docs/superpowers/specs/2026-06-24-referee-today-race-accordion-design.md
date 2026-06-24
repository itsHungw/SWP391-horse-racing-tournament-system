# Referee Today's Races Accordion Layout Redesign

This specification documents the redesign of the Referee Today's Races page (`RefereeOverviewPage`) from a 2-column list-and-drawer layout to a unified, centered, single-column accordion layout.

## Background & Problem

Currently, the Today's Races page uses a 2-column layout:
- Left Column: A vertical list of assigned races (Work Queue).
- Right Column: A brief drawer panel that displays details for the selected race, along with the main action button (e.g., "Start Checks", "Submit Results").

**UX Pain Point:** On desktop, when the work queue is long, the right column (drawer) remains statically at the top of the grid. If a referee scrolls down to view or select a race card near the bottom of the page, they have to scroll all the way back up to click the action button in the right-hand brief panel. This creates tedious, repetitive scrolling.

## Proposed Changes

We will transition the layout to a balanced 2-column view on desktop:
1. Replace the right-hand `RaceDetailDrawer` with a new sticky statistics and quick actions dashboard: `StewardDeskPanel`.
2. Keep each race card in the left column timeline as an interactive accordion card.
3. When a card is clicked, it expands inline to show the details grid and the primary action button.
4. On desktop, the layout will use the grid layout `xl:grid-cols-[minmax(0,1fr)_360px]` with the `StewardDeskPanel` sticking to the top (`sticky top-6`) as the user scrolls.

---

### Component Modifications

#### 1. [MODIFY] [RefereeOverviewPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/RefereeOverviewPage.tsx)
- Remove imports of `RaceDetailDrawer`.
- Import the new `StewardDeskPanel`.
- Restore the 2-column grid layout on desktop: `grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]`.
- Place `StewardDeskPanel` on the right column. Pass the list of `races`, the current `referenceNow` date, and the `onSelectRace` handler so that it can trigger navigation/card expansion.
- Pass URL search parameter state `raceId` down to `AssignedRaceTimeline` as `selectedRaceId`.
- Implement a callback `onSelectRace` to toggle search params (setting `?raceId=<id>` to expand or clearing it to collapse) and automatically switch the view mode to `"queue"`.

#### 1.1 [NEW] [StewardDeskPanel.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/race-day/StewardDeskPanel.tsx)
- Create a new component that renders on the right side.
- Renders:
  - Duty session summary (Current date and role).
  - Officiating progress timeline (workflow checklist of Checks, Ready, Live, Results, Review).
  - "Next Up" card: automatically selects the next upcoming race and provides a button to jump straight to it.
  - Quick action buttons/links to Profile, Incident Reports, and Contracts.

#### 2. [MODIFY] [AssignedRaceTimeline.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/race-day/AssignedRaceTimeline.tsx)
- Reorganize the card layout so that it is structured as a `div` containing:
  - A header button for expanding/collapsing.
  - A body region containing detail information and the action button.
- Add chevron rotation transition and grid-based height animation for smooth expansion.
- Render the action button inline inside the expanded content of the card.
- Add accessibility attributes (`aria-expanded`, `aria-controls`, `role="region"`, `id`).

#### 3. [DELETE] [RaceDetailDrawer.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/race-day/RaceDetailDrawer.tsx)
- Since the brief detail panel is now fully integrated into the accordion cards, this file is obsolete and will be removed.

---

## Design & Interactions

### Accordion Card States

#### Collapsed State
- **Left section**: Month, Day, and Scheduled Time badge.
- **Center section**: Race Name and Status Badge.
- **Right section**: Chevron Down icon (`lucide-react/ChevronDown`) rotating 180 degrees when expanded.
- **Footer**: A subtle helper tag (e.g. `Next: Start checks`) indicating the upcoming action.

#### Expanded State (Inline slide-down)
- **Detail Grid**:
  - Date, Start Time, Venue, Distance.
- **Instruction/Action Brief**:
  - Explanatory copy of the action step.
- **Action Button/Link**:
  - High-priority button styled with the standard emerald primary theme (`bg-[#007a68] hover:bg-[#006f5f]`), linking directly to the officiate/results page.

### Smooth Height Transition CSS
To animate the height of the accordion body from `0` to `auto` smoothly:
```css
.accordion-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.accordion-wrapper.expanded {
  grid-template-rows: 1fr;
}
.accordion-content {
  min-height: 0;
}
```

---

## Verification Plan

### Automated Tests
- Run existing test suites (`npm run test`) to check for regressions in referee pages.
- Update `RefereeOverviewPage.test.tsx` and `RefereeOfficiatePage.test.tsx` as needed to match the new layout and behavior.

### Manual Verification
- Verify that clicking a race card opens/closes the accordion.
- Verify that the URL query parameter `raceId` syncs correctly with the expanded card.
- Verify that clicking the action button inside the expanded card navigates directly to the correct workflow page.
- Test responsiveness from small mobile widths up to large desktop sizes.
