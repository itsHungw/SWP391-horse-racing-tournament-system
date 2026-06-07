# Referee Profile Dashboard Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new referee `Profile` dashboard as the default `/referee` route, move the monthly race calendar there, and let calendar race chips deep-link into `Assigned Races` with the selected drawer open.

**Architecture:** Keep the existing race-day operation components intact, but split overview responsibilities cleanly: `RefereeProfileDashboardPage` owns month calendar/dashboard summary, while `RefereeOverviewPage` owns only the day timeline and selected race drawer. Use query params for lightweight deep-link selection and clear stale params when the drawer closes.

**Tech Stack:** React 19, React Router 7, TypeScript, Tailwind CSS utilities, Vitest, Testing Library.

---

## Execution Notes

- Run `npm` commands from `frontend/`.
- Run `git` commands from the repository root.
- Keep existing user changes intact; do not reset or revert unrelated files.

---

## File Structure

- Create: `frontend/src/pages/referee/RefereeProfileDashboardPage.tsx`
  - Task 1 creates a small compiling page shell for routing; Task 3 expands it into the full dashboard that loads assigned races, renders referee identity/KPI cards, hosts `MonthRaceCalendar`, and navigates selected race chips to `/referee/assigned-races?raceId={id}`.
- Create: `frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx`
  - Verifies dashboard content, month calendar rendering, and calendar chip navigation.
- Create: `frontend/src/pages/referee/race-day/MonthRaceCalendar.test.tsx`
  - Verifies race chips become accessible buttons when `onRaceSelect` is provided, call the callback, and keep tablet-friendly touch target classes.
- Modify: `frontend/src/routes/AppRouter.tsx`
  - Makes `/referee` render profile dashboard and adds `/referee/assigned-races` for operational overview.
- Modify: `frontend/src/layouts/RefereeLayout.tsx`
  - Adds `Profile` nav item, updates `Assigned Races` href to `/referee/assigned-races`, preserves `Result History`, and keeps removed legacy tabs absent.
- Modify: `frontend/src/layouts/RefereeLayout.test.tsx`
  - Updates sidebar expectations and active-state coverage.
- Modify: `frontend/src/pages/referee/race-day/MonthRaceCalendar.tsx`
  - Adds optional `onRaceSelect`, accessible button race chips, and touch target styling.
- Modify: `frontend/src/pages/referee/RefereeOverviewPage.tsx`
  - Removes month-calendar view state/toggle, reads `raceId` query param, auto-selects matching race, adds drawer close cleanup.
- Modify: `frontend/src/pages/referee/RefereeOverviewPage.test.tsx`
  - Updates tests for no month toggle, deep-link selection, close drawer URL cleanup, and sidebar active state through the layout/router path.

---

### Task 1: Referee Routes And Sidebar Navigation

**Files:**
- Modify: `frontend/src/routes/AppRouter.tsx`
- Modify: `frontend/src/layouts/RefereeLayout.tsx`
- Modify: `frontend/src/layouts/RefereeLayout.test.tsx`
- Create: `frontend/src/pages/referee/RefereeProfileDashboardPage.tsx`

- [ ] **Step 1: Write the failing sidebar route test**

Update `frontend/src/layouts/RefereeLayout.test.tsx` so the current sidebar test expects the new navigation order and hrefs:

```tsx
expect(screen.getByRole("link", { name: /Profile/i })).toHaveAttribute("href", "/referee");
expect(screen.getByRole("link", { name: /Assigned Races/i })).toHaveAttribute(
  "href",
  "/referee/assigned-races"
);
expect(screen.getByRole("link", { name: /Result History/i })).toHaveAttribute(
  "href",
  "/referee/result-history"
);
expect(screen.queryByText(/Pre-Race Checks/i)).not.toBeInTheDocument();
expect(screen.queryByText(/Submit Results/i)).not.toBeInTheDocument();
expect(screen.queryByText(/Reports & Violations/i)).not.toBeInTheDocument();
```

Add a second test for active state with query params:

```tsx
it("marks Assigned Races active when opened with a raceId query param", () => {
  render(
    <MemoryRouter initialEntries={["/referee/assigned-races?raceId=1"]}>
      <RefereeLayout />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: /Assigned Races/i })).toHaveClass("bg-[#007a68]");
  expect(screen.getByRole("link", { name: /Profile/i })).not.toHaveClass("bg-[#007a68]");
});
```

- [ ] **Step 2: Run the layout test and confirm it fails**

Run:

```powershell
npm test -- --run src/layouts/RefereeLayout.test.tsx
```

Expected: FAIL because `Profile` is not rendered and `Assigned Races` still links to `/referee`.

- [ ] **Step 3: Update the sidebar items**

In `frontend/src/layouts/RefereeLayout.tsx`, replace `refereeNavItems` with:

```tsx
const refereeNavItems = [
  {
    label: "Profile",
    href: "/referee",
    icon: "profile",
    end: true,
  },
  {
    label: "Assigned Races",
    href: "/referee/assigned-races",
    icon: "gauge",
  },
  {
    label: "Result History",
    href: "/referee/result-history",
    icon: "history",
  },
];
```

Add a `profile` branch to `NavIcon`:

```tsx
if (type === "profile") {
  return (
    <svg aria-hidden="true" {...common}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
```

Keep `end: true` only on `Profile` so `/referee/assigned-races?raceId=1` does not keep `Profile` highlighted.

- [ ] **Step 4: Wire the new route shape**

Create `frontend/src/pages/referee/RefereeProfileDashboardPage.tsx` as a compiling page shell:

```tsx
export function RefereeProfileDashboardPage() {
  return (
    <section className="max-w-[1486px]" aria-labelledby="referee-profile-title">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006f5f]">Main Dashboard</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950" id="referee-profile-title">
          Referee Profile
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Check your race-day workload and monthly assignments.
        </p>
      </header>
    </section>
  );
}
```

In `frontend/src/routes/AppRouter.tsx`, import the profile dashboard page:

```tsx
import { RefereeProfileDashboardPage } from "../pages/referee/RefereeProfileDashboardPage";
```

Inside the `path="referee"` route, replace the index and old overview route block with:

```tsx
<Route index element={<RefereeProfileDashboardPage />} />
<Route path="assigned-races" element={<RefereeOverviewPage mode="all" />} />
<Route path="result-history" element={<RefereeResultHistoryPage />} />
<Route path="races/:id/check" element={<PreRaceCheckPage />} />
<Route path="races/:id/results" element={<SubmitResultsPage />} />
<Route path="races/:id/report" element={<IncidentReportsPage />} />
<Route path="races/:id/officiate" element={<RefereeOfficiatePage />} />
```

Remove these legacy route entries from the referee route:

```tsx
<Route path="pre-checks" element={<RefereeOverviewPage mode="check" />} />
<Route path="results" element={<RefereeOverviewPage mode="results" />} />
<Route path="reports" element={<RefereeOverviewPage mode="reports" />} />
```

- [ ] **Step 5: Run the layout test again**

Run:

```powershell
npm test -- --run src/layouts/RefereeLayout.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/routes/AppRouter.tsx frontend/src/layouts/RefereeLayout.tsx frontend/src/layouts/RefereeLayout.test.tsx frontend/src/pages/referee/RefereeProfileDashboardPage.tsx
git commit -m "feat: add referee profile navigation route"
```

---

### Task 2: Selectable Month Race Calendar

**Files:**
- Modify: `frontend/src/pages/referee/race-day/MonthRaceCalendar.tsx`
- Create: `frontend/src/pages/referee/race-day/MonthRaceCalendar.test.tsx`

- [ ] **Step 1: Write the failing calendar tests**

Create `frontend/src/pages/referee/race-day/MonthRaceCalendar.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonthRaceCalendar } from "./MonthRaceCalendar";
import { AssignedRace } from "./refereeRaceDayModels";

const races: AssignedRace[] = [
  {
    id: 1,
    name: "Royal Ascot Gold Cup - Qualifiers A",
    code: "R-2026-001",
    distanceMeters: 1600,
    status: "SCHEDULED",
    scheduledAt: "2026-06-02T14:00:00+07:00",
    venue: "Turf Tower C",
  },
];

describe("MonthRaceCalendar", () => {
  it("renders selectable race chips as accessible buttons", () => {
    const onRaceSelect = vi.fn();

    render(
      <MonthRaceCalendar
        races={races}
        referenceDate={new Date("2026-06-02T12:30:00+07:00")}
        onRaceSelect={onRaceSelect}
      />
    );

    const chip = screen.getByRole("button", {
      name: "Open R-2026-001 Royal Ascot Gold Cup - Qualifiers A",
    });

    expect(chip).toHaveClass("min-h-11");
    fireEvent.click(chip);
    expect(onRaceSelect).toHaveBeenCalledWith(races[0]);
  });

  it("keeps race chips as static text when no selection handler is provided", () => {
    render(
      <MonthRaceCalendar
        races={races}
        referenceDate={new Date("2026-06-02T12:30:00+07:00")}
      />
    );

    expect(screen.getByText("R-2026-001")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open R-2026-001/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the calendar test and confirm it fails**

Run:

```powershell
npm test -- --run src/pages/referee/race-day/MonthRaceCalendar.test.tsx
```

Expected: FAIL because `MonthRaceCalendar` does not accept `onRaceSelect` and chips are not buttons.

- [ ] **Step 3: Implement selectable race chips**

Replace `frontend/src/pages/referee/race-day/MonthRaceCalendar.tsx` with:

```tsx
import { AssignedRace } from "./refereeRaceDayModels";

type MonthRaceCalendarProps = {
  races: AssignedRace[];
  referenceDate: Date;
  onRaceSelect?: (race: AssignedRace) => void;
};

export function MonthRaceCalendar({ races, referenceDate, onRaceSelect }: MonthRaceCalendarProps) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = referenceDate.toLocaleDateString("en-US", { month: "long" });
  const today = new Date();

  return (
    <section aria-label="Month calendar" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Assignment calendar</p>
      <h3 className="mt-2 text-2xl font-black text-slate-950">{monthName} {year} Calendar</h3>
      <div className="mt-6 grid grid-cols-7 gap-2">
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
          const dayRaces = races.filter((race) => {
            const scheduledAt = new Date(race.scheduledAt);
            return scheduledAt.getFullYear() === year && scheduledAt.getMonth() === month && scheduledAt.getDate() === day;
          });

          return (
            <div
              className={`min-h-24 rounded-lg border p-2 ${isToday ? "border-[#007a68] bg-[#eefbf7]" : "border-slate-200 bg-[#fbfdfe]"}`}
              key={day}
            >
              <span className="text-xs font-black text-slate-500">{day}</span>
              <div className="mt-2 flex flex-col gap-1.5">
                {dayRaces.map((race) =>
                  onRaceSelect ? (
                    <button
                      aria-label={`Open ${race.code} ${race.name}`}
                      className="min-h-11 rounded bg-[#e8fbf4] px-2 py-2 text-left text-[10px] font-black text-[#007a68] transition hover:bg-[#d7f7ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
                      key={race.id}
                      onClick={() => onRaceSelect(race)}
                      type="button"
                    >
                      {race.code}
                    </button>
                  ) : (
                    <p className="min-h-6 rounded bg-[#e8fbf4] px-1.5 py-1 text-[10px] font-black text-[#007a68]" key={race.id}>
                      {race.code}
                    </p>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the calendar test again**

Run:

```powershell
npm test -- --run src/pages/referee/race-day/MonthRaceCalendar.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/pages/referee/race-day/MonthRaceCalendar.tsx frontend/src/pages/referee/race-day/MonthRaceCalendar.test.tsx
git commit -m "feat: make referee month calendar selectable"
```

---

### Task 3: Profile Dashboard Page

**Files:**
- Modify: `frontend/src/pages/referee/RefereeProfileDashboardPage.tsx`
- Create: `frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx`

- [ ] **Step 1: Write the failing profile dashboard test**

Create `frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import * as refereeApi from "../../api/refereeApi";
import { RefereeProfileDashboardPage } from "./RefereeProfileDashboardPage";

vi.mock("../../api/refereeApi");
vi.mock("../../hooks/useClientSession", () => ({
  useClientSession: () => ({
    session: {
      email: "referee@equine.com",
      fullName: "Julian Sterling",
      roles: ["REFEREE"],
    },
  }),
}));

const mockRaces = [
  {
    id: 1,
    name: "Royal Ascot Gold Cup - Qualifiers A",
    code: "R-2026-001",
    distanceMeters: 1600,
    status: "SCHEDULED",
    scheduledAt: "2026-06-02T14:00:00+07:00",
    venue: "Turf Tower C",
  },
];

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}{location.search}</p>;
}

describe("RefereeProfileDashboardPage", () => {
  it("renders referee profile dashboard cards and calendar", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter>
        <RefereeProfileDashboardPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Preparing referee profile dashboard/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Referee Profile" })).toBeInTheDocument();
    expect(screen.getByText("Julian Sterling")).toBeInTheDocument();
    expect(screen.getByText("referee@equine.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "June 2026 Calendar" })).toBeInTheDocument();
    expect(screen.getByText("Assigned Today")).toBeInTheDocument();
    expect(screen.getByText("Ready For Pre-Race")).toBeInTheDocument();
  });

  it("navigates from a calendar race chip to assigned races with raceId", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter initialEntries={["/referee"]}>
        <Routes>
          <Route path="/referee" element={<RefereeProfileDashboardPage now={new Date("2026-06-02T12:30:00+07:00")} />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", {
      name: "Open R-2026-001 Royal Ascot Gold Cup - Qualifiers A",
    }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/referee/assigned-races?raceId=1");
    });
  });
});
```

- [ ] **Step 2: Run the profile test and confirm it fails**

Run:

```powershell
npm test -- --run src/pages/referee/RefereeProfileDashboardPage.test.tsx
```

Expected: FAIL because the page shell does not load races, render KPI cards, or host the month calendar yet.

- [ ] **Step 3: Implement the profile dashboard**

Replace `frontend/src/pages/referee/RefereeProfileDashboardPage.tsx` with:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssignedRaces } from "../../api/refereeApi";
import { useClientSession } from "../../hooks/useClientSession";
import { MonthRaceCalendar } from "./race-day/MonthRaceCalendar";
import { normalizeAssignedRace } from "./race-day/refereeRaceDayAdapter";
import { AssignedRace } from "./race-day/refereeRaceDayModels";

type RefereeProfileDashboardPageProps = {
  now?: Date;
};

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function metricLabel(status: string) {
  if (status === "ONGOING") return "Live / Ongoing";
  if (status === "PUBLISHED") return "Published Results";
  return "Ready For Pre-Race";
}

export function RefereeProfileDashboardPage({ now }: RefereeProfileDashboardPageProps) {
  const referenceNow = useMemo(() => now ?? new Date(), [now]);
  const navigate = useNavigate();
  const { session } = useClientSession();
  const [races, setRaces] = useState<AssignedRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadRaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const data = await getAssignedRaces();
      setRaces(data.map((race) => normalizeAssignedRace(race, referenceNow)));
    } catch {
      setError("Unable to load referee profile dashboard.");
    } finally {
      setLoading(false);
    }
  }, [referenceNow]);

  useEffect(() => {
    void loadRaces();
  }, [loadRaces]);

  const racesToday = races.filter((race) => isSameDay(new Date(race.scheduledAt), referenceNow));
  const readyForPreRace = races.filter((race) => ["SCHEDULED", "CHECKING", "READY"].includes(race.status));
  const ongoingRaces = races.filter((race) => race.status === "ONGOING");
  const publishedResults = races.filter((race) => race.status === "PUBLISHED");

  if (loading) {
    return (
      <div className="max-w-[1486px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Preparing referee profile dashboard</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1486px] rounded-xl border border-rose-200 bg-rose-50 p-6" role="alert">
        <p className="font-black text-rose-800">{error}</p>
        <button className="mt-4 min-h-11 rounded-md bg-rose-700 px-5 text-sm font-black text-white" onClick={() => void loadRaces()} type="button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="max-w-[1486px]" aria-labelledby="referee-profile-title">
      <header className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006f5f]">Main Dashboard</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950" id="referee-profile-title">
            Referee Profile
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Check your race-day workload, scan the monthly assignment calendar, and jump straight into the active race desk.
          </p>
        </div>
        <aside className="rounded-2xl border border-slate-100 bg-[#f8fcfb] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Assigned official</p>
          <p className="mt-3 text-2xl font-black text-slate-950">{session?.fullName || "Assigned official"}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{session?.email || "No email available"}</p>
          <span className="mt-4 inline-flex rounded-full bg-[#007a68] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
            Race Operations
          </span>
        </aside>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Assigned Today", racesToday.length],
          ["Ready For Pre-Race", readyForPreRace.length],
          [metricLabel("ONGOING"), ongoingRaces.length],
          [metricLabel("PUBLISHED"), publishedResults.length],
        ].map(([label, value]) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
            <p className="mt-3 text-4xl font-black text-[#006f5f]">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <MonthRaceCalendar
          races={races}
          referenceDate={referenceNow}
          onRaceSelect={(race) => navigate(`/referee/assigned-races?raceId=${race.id}`)}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the profile test again**

Run:

```powershell
npm test -- --run src/pages/referee/RefereeProfileDashboardPage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Re-run the route/sidebar test**

Run:

```powershell
npm test -- --run src/layouts/RefereeLayout.test.tsx
```

Expected: PASS now that the route import exists.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/pages/referee/RefereeProfileDashboardPage.tsx frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx frontend/src/routes/AppRouter.tsx frontend/src/layouts/RefereeLayout.tsx frontend/src/layouts/RefereeLayout.test.tsx
git commit -m "feat: add referee profile dashboard"
```

---

### Task 4: Assigned Races Timeline-Only Deep Link Flow

**Files:**
- Modify: `frontend/src/pages/referee/RefereeOverviewPage.tsx`
- Modify: `frontend/src/pages/referee/RefereeOverviewPage.test.tsx`
- Modify: `frontend/src/pages/referee/race-day/RaceDetailDrawer.tsx`

- [ ] **Step 1: Replace the old month-toggle test with timeline-only behavior**

In `frontend/src/pages/referee/RefereeOverviewPage.test.tsx`, replace the first test with:

```tsx
it("renders the day timeline without the month calendar toggle", async () => {
  vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

  render(
    <MemoryRouter>
      <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
    </MemoryRouter>
  );

  expect(screen.getByText(/Preparing steward assignments/i)).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "Today's Race Timeline" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Month calendar" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "June 2026 Calendar" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Add deep-link and cleanup tests**

Add these tests to `RefereeOverviewPage.test.tsx`:

```tsx
function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}{location.search}</p>;
}

it("opens the matching race drawer from the raceId query param", async () => {
  vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

  render(
    <MemoryRouter initialEntries={["/referee/assigned-races?raceId=1"]}>
      <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
    </MemoryRouter>
  );

  expect(await screen.findByRole("heading", { name: "Race Details" })).toBeInTheDocument();
  expect(screen.getByText("Royal Ascot Gold Cup - Qualifiers A")).toBeInTheDocument();
});

it("clears raceId from the URL when the selected drawer is closed", async () => {
  vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

  render(
    <MemoryRouter initialEntries={["/referee/assigned-races?raceId=1"]}>
      <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
      <LocationProbe />
    </MemoryRouter>
  );

  fireEvent.click(await screen.findByRole("button", { name: "Close race details" }));

  expect(screen.queryByRole("heading", { name: "Race Details" })).not.toBeInTheDocument();
  expect(screen.getByTestId("location")).toHaveTextContent("/referee/assigned-races");
});
```

Update imports at the top:

```tsx
import { MemoryRouter, useLocation } from "react-router-dom";
```

- [ ] **Step 3: Run overview tests and confirm they fail**

Run:

```powershell
npm test -- --run src/pages/referee/RefereeOverviewPage.test.tsx
```

Expected: FAIL because month toggle still exists, query param selection is not implemented, and drawer has no close button.

- [ ] **Step 4: Add drawer close control**

In `frontend/src/pages/referee/race-day/RaceDetailDrawer.tsx`, change the signature:

```tsx
export function RaceDetailDrawer({
  race,
  now,
  demoMode,
  onClose,
}: {
  race: AssignedRace;
  now: Date;
  demoMode: boolean;
  onClose?: () => void;
}) {
```

Replace the top title block with this close-aware block:

```tsx
<div className="flex items-start justify-between gap-3">
  <div>
    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Selected assignment</p>
    <h3 className="mt-2 text-xl font-black text-slate-950">Race Details</h3>
  </div>
  {onClose ? (
    <button
      aria-label="Close race details"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
      onClick={onClose}
      type="button"
    >
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  ) : null}
</div>
```

- [ ] **Step 5: Remove month view and add query-param selection**

In `frontend/src/pages/referee/RefereeOverviewPage.tsx`, update imports:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAssignedRaces } from "../../api/refereeApi";
import { AssignedRaceTimeline } from "./race-day/AssignedRaceTimeline";
import { RaceDetailDrawer } from "./race-day/RaceDetailDrawer";
```

Remove the `MonthRaceCalendar` import and remove:

```tsx
const [view, setView] = useState<"timeline" | "month">("timeline");
```

Add search params after state declarations:

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const raceIdParam = searchParams.get("raceId");
```

After the load effect, add:

```tsx
useEffect(() => {
  if (!raceIdParam || races.length === 0) {
    return;
  }

  const raceId = Number(raceIdParam);
  if (!Number.isFinite(raceId)) {
    return;
  }

  const matchingRace = races.find((race) => race.id === raceId);
  if (matchingRace) {
    setSelectedRace(matchingRace);
  }
}, [raceIdParam, races]);

const handleSelectRace = useCallback(
  (race: AssignedRace) => {
    setSelectedRace(race);
    if (raceIdParam) {
      setSearchParams({}, { replace: true });
    }
  },
  [raceIdParam, setSearchParams]
);

const handleCloseDrawer = useCallback(() => {
  setSelectedRace(undefined);
  if (raceIdParam) {
    setSearchParams({}, { replace: true });
  }
}, [raceIdParam, setSearchParams]);
```

Remove the entire month/timeline toggle button block.

Replace the grid body with:

```tsx
<div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
  <AssignedRaceTimeline
    races={races}
    now={referenceNow}
    onSelectRace={handleSelectRace}
    selectedRaceId={selectedRace?.id}
  />
  {selectedRace ? (
    <RaceDetailDrawer
      demoMode={demoMode}
      now={referenceNow}
      onClose={handleCloseDrawer}
      race={selectedRace}
    />
  ) : (
    <aside className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-500">
      Select a timeline card to inspect the assigned race and check its pre-race activation guard.
    </aside>
  )}
</div>
```

- [ ] **Step 6: Run overview tests again**

Run:

```powershell
npm test -- --run src/pages/referee/RefereeOverviewPage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/pages/referee/RefereeOverviewPage.tsx frontend/src/pages/referee/RefereeOverviewPage.test.tsx frontend/src/pages/referee/race-day/RaceDetailDrawer.tsx
git commit -m "feat: deep link assigned race drawer"
```

---

### Task 5: Full Frontend Verification

**Files:**
- Verify all changed frontend files.

- [ ] **Step 1: Run focused referee tests**

Run:

```powershell
npm test -- --run src/layouts/RefereeLayout.test.tsx src/pages/referee/RefereeProfileDashboardPage.test.tsx src/pages/referee/RefereeOverviewPage.test.tsx src/pages/referee/race-day/MonthRaceCalendar.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full frontend test suite**

Run:

```powershell
npm test -- --run
```

Expected: PASS. Existing React `act(...)` warnings in legacy referee pages are acceptable only if they were already present before this plan; do not introduce new warnings in the new profile/calendar tests.

- [ ] **Step 3: Build frontend**

Run:

```powershell
npm run build
```

Expected: PASS with TypeScript and Vite build complete.

- [ ] **Step 4: Inspect final diff**

Run:

```powershell
git diff --stat
git diff --check
```

Expected: `git diff --check` prints no whitespace errors. Diff should be limited to referee routing/layout/profile/calendar/overview tests plus this plan/spec docs.

- [ ] **Step 5: Commit verification fixes if needed**

If verification required small fixes, commit them:

```powershell
git add frontend/src docs/superpowers/plans/2026-06-03-referee-profile-dashboard-calendar.md
git commit -m "test: verify referee profile calendar flow"
```

---

## Self-Review

Spec coverage:

- `Profile` default route is covered by Task 1 and Task 3.
- Sidebar order and active state are covered by Task 1.
- Month calendar moved out of Assigned Races and into Profile is covered by Task 3 and Task 4.
- Calendar chip click deep-links to `/referee/assigned-races?raceId={id}` is covered by Task 2 and Task 3.
- Assigned Races auto-selects query-param race and opens the drawer is covered by Task 4.
- Drawer close clears `raceId` with `replace: true` is covered by Task 4.
- Touch target and accessible race chip behavior are covered by Task 2.
- Removed old tabs stay absent is covered by Task 1.

Completeness scan:

- This plan gives concrete code or commands wherever a step changes behavior.

Type consistency:

- `AssignedRace` is imported from `refereeRaceDayModels`.
- `MonthRaceCalendar` prop names match the spec: `races`, `referenceDate`, `onRaceSelect`.
- Navigation target matches the spec: `/referee/assigned-races?raceId=${race.id}`.
- Drawer close handler uses `setSearchParams({}, { replace: true })`.
