# Referee Race Reports (No Scrollbar) Redesign

This specification documents the redesign of the Referee Confirmed Race Results (Race Reports) page (`RefereeResultHistoryPage`) from a wide, desktop-only table layout to a fully responsive, modern card feed layout. This eliminates the horizontal scrollbar on narrower screens.

## Background & Problem

Currently, the Race Reports page (`RefereeResultHistoryPage`) renders a large HTML `<table>` on desktop viewports (`md:block`), constrained by a `min-w-[1180px]` width. When the viewport is smaller than 1180px or within the constrained referee workspace container, this forces a horizontal scrollbar, violating responsive design principles.

## Proposed Changes

We will replace the desktop `<table>` with a list of responsive cards, styled to fit any screen size without forcing horizontal scrollbars.

---

### Component Modifications

#### 1. [MODIFY] [RefereeResultHistoryPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/RefereeResultHistoryPage.tsx)
- Remove the desktop `md:block` table layout and mobile `md:hidden` card list split.
- Implement a single, unified, responsive card-list component that works on both mobile and desktop (removing duplicate markup).
- Wrap the list container in `<section role="region" aria-label="published race results" className="space-y-4 p-4">` to keep tests compatible.
- Each race report card will display:
  - **Header**: Race name, scheduled date, venue, and status badge (`PUBLISHED`).
  - **Quick Stats Grid** (`grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-4`):
    - **Winner Block**: Winner name and comma-separated top three runners.
    - **Final Time**: Formatted time value in a highlighted badge.
    - **Publishing Details**: Published timestamp and steward name.
  - **Incidents & Penalties Grid** (`grid grid-cols-1 md:grid-cols-2 gap-4 mt-4`):
    - **Incidents Box**: List of logged incidents (or a clean state tag if none).
    - **Penalties Box**: List of penalties (or a clean state tag if none).

#### 2. [MODIFY] [App.test.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/App.test.tsx)
- Update the referee result history test assertions.
- Change the query from `getByRole("table")` to `getByRole("region")` with the same name `"published race results"`.

---

## Verification Plan

### Automated Tests
- Run the app test file:
  `npx vitest run src/App.test.tsx`
- Run all referee tests:
  `npx vitest run src/pages/referee/`

### Manual Verification
- Resize the browser window and ensure the Race Reports page layout reflows nicely without horizontal scrollbars.
- Check that all data (Winner, Top 3, Time, Incidents, Penalties, Sign-off details) matches the mock entries.
