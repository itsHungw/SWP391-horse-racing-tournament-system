# Referee Submit Results Grouped Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `SubmitResultsPage.tsx` groups its rows into "Official top 3" / "Remaining finish order" / "Did not finish / disqualified" sections with `P{n}` badges, visually matching `RaceSummary.tsx`, while keeping its existing manual position/time/status editing model unchanged.

**Architecture:** Derive two grouping arrays from `entries` (a position-sorted list of `FINISHED` entries, and a list of everything else) purely for rendering. Extract the existing per-row markup into a local `EntryRow` component (same file) so it can be rendered three times — top 3, remaining, and did-not-finish/disqualified — without duplicating JSX. No change to state shape, validation, or `handleSave`.

**Tech Stack:** React + TypeScript, Vitest + `@testing-library/react`.

## Global Constraints

- Do not change `handleSave`, `handleNumberChange`, `handleStatusChange`, duplicate-position validation, or any API call.
- Do not change the already-shipped `disabled={isReadOnly || entry.status !== "FINISHED"}` rule on Position/Time inputs, or `disabled={isReadOnly}` on the Result status select.
- No shared component with `RaceSummary.tsx`'s `ResultRow` — different field models, kept separate.
- Follow TDD: write the failing tests before touching `SubmitResultsPage.tsx`.

---

### Task 1: Grouped layout in SubmitResultsPage

**Files:**
- Modify: `frontend/src/pages/referee/SubmitResultsPage.tsx`
- Modify: `frontend/src/pages/referee/SubmitResultsPage.test.tsx`

**Interfaces:**
- Consumes: `ParticipantResultEntry` type, already imported from `../../api/refereeApi`.
- Produces: no new exports — internal restructuring of `SubmitResultsPage.tsx`'s render output only.

- [ ] **Step 1: Write the failing tests**

Add `within` to the testing-library import at the top of `frontend/src/pages/referee/SubmitResultsPage.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
```

Add these three tests inside the existing `describe("SubmitResultsPage", ...)` block, right after the `"disables position and time inputs for entries that are not finished"` test:

```tsx
  it("shows a remaining finish order section for more than 3 finished entries", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue([
      {
        participantId: 1,
        horseName: "Golden Arrow",
        jockeyName: "Mina Park",
        position: 1,
        finishTimeSeconds: 62.345,
        status: "FINISHED",
      },
      {
        participantId: 2,
        horseName: "Night Bloom",
        jockeyName: "Ana Lee",
        position: 2,
        finishTimeSeconds: 63,
        status: "FINISHED",
      },
      {
        participantId: 3,
        horseName: "Silver Comet",
        jockeyName: "Tom Ruiz",
        position: 3,
        finishTimeSeconds: 64,
        status: "FINISHED",
      },
      {
        participantId: 4,
        horseName: "Blue Ridge",
        jockeyName: "Sam Cole",
        position: 4,
        finishTimeSeconds: 65,
        status: "FINISHED",
      },
    ]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Remaining finish order" })).toBeInTheDocument();
    expect(screen.getByText("Blue Ridge")).toBeInTheDocument();
    expect(screen.getByText("P4")).toBeInTheDocument();
  });

  it("shows did-not-finish entries in their own section with an editable status dropdown", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue([
      {
        participantId: 1,
        horseName: "Golden Arrow",
        jockeyName: "Mina Park",
        position: 1,
        finishTimeSeconds: 62.345,
        status: "FINISHED",
      },
      {
        participantId: 5,
        horseName: "Thunderstrike",
        jockeyName: "Julian Sterling",
        position: "",
        finishTimeSeconds: "",
        status: "DID_NOT_FINISH",
      },
    ]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Did not finish / disqualified" })).toBeInTheDocument();

    const thunderstrikeRow = screen.getByText("Thunderstrike").closest("article") as HTMLElement;
    expect(within(thunderstrikeRow).getByRole("combobox")).toBeEnabled();
    expect(within(thunderstrikeRow).queryByText(/^P\d+$/)).not.toBeInTheDocument();
  });

  it("orders finished entries by their typed position, not array order", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue([
      {
        participantId: 1,
        horseName: "Night Bloom",
        jockeyName: "Ana Lee",
        position: 2,
        finishTimeSeconds: 63,
        status: "FINISHED",
      },
      {
        participantId: 2,
        horseName: "Golden Arrow",
        jockeyName: "Mina Park",
        position: 1,
        finishTimeSeconds: 62.345,
        status: "FINISHED",
      },
    ]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    const horseNames = screen.getAllByText(/^(Night Bloom|Golden Arrow)$/).map((node) => node.textContent);
    expect(horseNames).toEqual(["Golden Arrow", "Night Bloom"]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/pages/referee/SubmitResultsPage.test.tsx`

Expected: the 3 new tests FAIL — no "Remaining finish order" or "Did not finish / disqualified" headings exist yet, no `P{n}` badges exist, and all entries currently render in original array order (Night Bloom before Golden Arrow). The 5 pre-existing tests still PASS.

- [ ] **Step 3: Extract `EntryRow` and add the grouping**

In `frontend/src/pages/referee/SubmitResultsPage.tsx`, insert this new component directly after the `READ_ONLY_STATUS_MESSAGES` constant and before `export function SubmitResultsPage`:

```tsx
function EntryRow({
  badge,
  entry,
  isReadOnly,
  onPositionChange,
  onStatusChange,
  onTimeChange,
}: {
  badge: string | null;
  entry: ParticipantResultEntry;
  isReadOnly: boolean;
  onPositionChange: (value: string) => void;
  onStatusChange: (status: ParticipantResultEntry["status"]) => void;
  onTimeChange: (value: string) => void;
}) {
  const fieldsDisabled = isReadOnly || entry.status !== "FINISHED";

  return (
    <article className="rounded-2xl border border-slate-200 bg-[#fbfdfe] p-4">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.4fr)_110px_150px_170px] lg:items-end">
        <div className="flex items-center gap-3">
          {badge ? (
            <span className="rounded-full bg-[#007a68] px-3 py-1 font-mono text-xs font-black text-white">{badge}</span>
          ) : null}
          <div>
            <p className="text-base font-black text-slate-950">{entry.horseName}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{entry.jockeyName}</p>
          </div>
        </div>
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Position</span>
          <input
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={fieldsDisabled}
            onChange={(event) => onPositionChange(event.target.value)}
            placeholder="1"
            type="number"
            value={entry.position ?? ""}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Time seconds</span>
          <input
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={fieldsDisabled}
            onChange={(event) => onTimeChange(event.target.value)}
            placeholder="94.25"
            type="text"
            value={entry.finishTimeSeconds ?? ""}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Result status</span>
          <select
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={isReadOnly}
            onChange={(event) => onStatusChange(event.target.value as ParticipantResultEntry["status"])}
            value={entry.status}
          >
            <option value="FINISHED">Finished</option>
            <option value="DISQUALIFIED">Disqualified</option>
            <option value="DID_NOT_FINISH">Did not finish</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </label>
      </div>
    </article>
  );
}
```

Then, inside `SubmitResultsPage`, add the grouping arrays right after the existing `const resultBlocked = ...` line:

```tsx
  const sortedFinishedEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.status === "FINISHED")
    .sort((a, b) => {
      const positionA = typeof a.entry.position === "number" ? a.entry.position : Number.POSITIVE_INFINITY;
      const positionB = typeof b.entry.position === "number" ? b.entry.position : Number.POSITIVE_INFINITY;
      return positionA - positionB || a.index - b.index;
    });

  const otherEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.status !== "FINISHED");
```

Finally, replace the row-rendering block — everything from `<div className="mt-5 space-y-3">` through its matching closing `</div>` (the block that currently does `{entries.map((entry, index) => (<article>...</article>))}`) — with:

```tsx
          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Official top 3</h3>
            <div className="space-y-3">
              {sortedFinishedEntries.slice(0, 3).map(({ entry, index }, position) => (
                <EntryRow
                  badge={`P${position + 1}`}
                  entry={entry}
                  isReadOnly={isReadOnly}
                  key={entry.participantId}
                  onPositionChange={(value) => handleNumberChange(index, "position", value)}
                  onStatusChange={(status) => handleStatusChange(index, status)}
                  onTimeChange={(value) => handleNumberChange(index, "finishTimeSeconds", value)}
                />
              ))}
            </div>

            {sortedFinishedEntries.length > 3 ? (
              <>
                <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-slate-700">Remaining finish order</h3>
                <div className="space-y-3">
                  {sortedFinishedEntries.slice(3).map(({ entry, index }, position) => (
                    <EntryRow
                      badge={`P${position + 4}`}
                      entry={entry}
                      isReadOnly={isReadOnly}
                      key={entry.participantId}
                      onPositionChange={(value) => handleNumberChange(index, "position", value)}
                      onStatusChange={(status) => handleStatusChange(index, status)}
                      onTimeChange={(value) => handleNumberChange(index, "finishTimeSeconds", value)}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {otherEntries.length > 0 ? (
              <>
                <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-slate-700">Did not finish / disqualified</h3>
                <div className="space-y-3">
                  {otherEntries.map(({ entry, index }) => (
                    <EntryRow
                      badge={null}
                      entry={entry}
                      isReadOnly={isReadOnly}
                      key={entry.participantId}
                      onPositionChange={(value) => handleNumberChange(index, "position", value)}
                      onStatusChange={(status) => handleStatusChange(index, status)}
                      onTimeChange={(value) => handleNumberChange(index, "finishTimeSeconds", value)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/referee/SubmitResultsPage.test.tsx`

Expected: all 8 tests in the file PASS (5 pre-existing plus the 3 new ones).

- [ ] **Step 5: Run the wider referee test suite to check for regressions**

Run: `cd frontend && npx vitest run src/pages/referee`

Expected: all tests PASS.

- [ ] **Step 6: Type check**

Run: `cd frontend && npx tsc -b --noEmit`

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/referee/SubmitResultsPage.tsx frontend/src/pages/referee/SubmitResultsPage.test.tsx
git commit -m "feat: group submit-results rows to match the post-race summary layout"
```
