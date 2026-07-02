# Referee Today's Races Accordion & Steward Desk Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the referee Today's Races page to use an inline accordion queue layout on the left, and a sticky "Steward Desk Panel" showing stats, ca trực, quick links, and a "Jump to Next Race" quick action on the right.

**Architecture:** We will restore the 2-column grid layout on desktop (`xl:grid-cols-[minmax(0,1fr)_360px]`). The left side will contain the collapsible accordion cards. The right side will house the new sticky `StewardDeskPanel`.

**Tech Stack:** React, TypeScript, React Router, Lucide Icons, Vitest, React Testing Library.

---

### Task 1: Create the StewardDeskPanel Component

**Files:**
- Create: `frontend/src/pages/referee/race-day/StewardDeskPanel.tsx`

- [ ] **Step 1: Write the StewardDeskPanel component**
  Create a component that accepts:
  - `races: AssignedRace[]`
  - `now: Date`
  - `onSelectRace: (race: AssignedRace | undefined) => void`
  
  Inside it:
  1. Render a clean card interface with a sticky position: `aside className="sticky top-6 hidden xl:block w-[360px] bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6"`.
  2. **Duty Session Summary**: Display the name "Jonathan Whitmore" (or dynamically load user profile/name if available, otherwise static name matching the client sidebar layout) as "Race Day Official" with the formatted date of today.
  3. **Officiating Progress**: Compute the counts using `countRaceStatuses(races)` (import it from `../refereeUi`). Render a checklist layout showing the count and labels (Checks, Ready, Live, Results, Review) with matching Lucide icons (`ClipboardCheck`, `CheckCircle2`, `Play`, `Flag`, `AlertTriangle`).
  4. **"Next Up" Quick Action**: Use `getNextRace(races, now)` to determine the next active race. If found, render a mini card showing the name and time, and a button `Jump to Next Race` that calls `onSelectRace(nextRace)`.
  5. **Quick Links**: Add styled links to profile, contracts, and incident reports.

---

### Task 2: Integrate StewardDeskPanel into RefereeOverviewPage

**Files:**
- Modify: `frontend/src/pages/referee/RefereeOverviewPage.tsx`

- [ ] **Step 1: Update RefereeOverviewPage layout**
  - Import `StewardDeskPanel` from `./race-day/StewardDeskPanel`.
  - Restore the grid layout `xl:grid-cols-[minmax(0,1fr)_360px]`.
  - Render `StewardDeskPanel` in the right column:
    ```tsx
    <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      {viewMode === "queue" ? (
        <AssignedRaceTimeline races={races} now={referenceNow} onSelectRace={handleSelectRace} selectedRaceId={selectedRace?.id} />
      ) : (
        <MonthRaceCalendar races={races} referenceDate={referenceNow} onRaceSelect={handleSelectRace} />
      )}
      <StewardDeskPanel races={races} now={referenceNow} onSelectRace={handleSelectRace} />
    </div>
    ```

---

### Task 3: Verify and Run Test Suites

**Files:**
- Test: `frontend/src/pages/referee/RefereeOverviewPage.test.tsx`

- [ ] **Step 1: Run the test suite**
  Run: `npx vitest run src/pages/referee/RefereeOverviewPage.test.tsx`
  Expected: PASS

- [ ] **Step 2: Run all referee tests**
  Run: `npx vitest run src/pages/referee/`
  Expected: PASS
