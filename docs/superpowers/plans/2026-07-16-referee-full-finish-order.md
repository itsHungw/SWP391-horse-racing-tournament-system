# Referee Full Finish Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `RaceSummary.tsx` shows every race participant instead of only the top 3 — top 3, remaining finishers (both editable), and did-not-finish/disqualified runners (read-only).

**Architecture:** Extract the existing top-3 row markup into a local `ResultRow` component (same file), then render it twice — once for `rows.slice(0, 3)` and once for `rows.slice(3)` — plus a new plain read-only list for `snapshot.outOfRace`. No changes to `confirmResultPackage()` or any API call: the full participant set was already being submitted, this is a display-only change.

**Tech Stack:** React + TypeScript, Vitest + `@testing-library/react`.

## Global Constraints

- Do not change `confirmResultPackage()`, the `finishedEntries`/`removedEntries` mapping, or any API call.
- Do not change the appeals board, incident history, or report draft sections.
- Follow TDD: write the failing tests before touching `RaceSummary.tsx`.

---

### Task 1: Full finish order display in RaceSummary

**Files:**
- Modify: `frontend/src/pages/referee/race-day/RaceSummary.tsx`
- Test: `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx` (already imports and directly renders `RaceSummary`)

**Interfaces:**
- Consumes: `LiveRunner` type (`participantId`, `horseName`, `gateNumber`, `progressPercent`, `speedMultiplier`, `status: "RUNNING" | "DNS" | "DNF" | "DSQ"`, `finishMilliseconds?`) from `./refereeRaceDayModels`, already used elsewhere in this file.
- Produces: no new exports — internal restructuring of `RaceSummary.tsx`'s render output only.

- [ ] **Step 1: Write the failing tests**

Add these three tests to `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`, inside the existing `describe("RefereeOfficiatePage", ...)` block, right after the `"renders a finished draft snapshot summary"` test:

```tsx
  it("shows a remaining finish order section for runners beyond the top 3", () => {
    render(
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 70_000,
          leaderboard: [
            {
              participantId: 7,
              horseName: "Golden Arrow",
              gateNumber: 1,
              progressPercent: 100,
              speedMultiplier: 1,
              status: "RUNNING",
              finishMilliseconds: 62_345,
            },
            {
              participantId: 5,
              horseName: "Night Bloom",
              gateNumber: 2,
              progressPercent: 100,
              speedMultiplier: 0.98,
              status: "RUNNING",
              finishMilliseconds: 63_000,
            },
            {
              participantId: 3,
              horseName: "Silver Comet",
              gateNumber: 3,
              progressPercent: 100,
              speedMultiplier: 0.95,
              status: "RUNNING",
              finishMilliseconds: 64_000,
            },
            {
              participantId: 9,
              horseName: "Blue Ridge",
              gateNumber: 4,
              progressPercent: 100,
              speedMultiplier: 0.9,
              status: "RUNNING",
              finishMilliseconds: 65_000,
            },
          ],
          outOfRace: [],
          incidents: [],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Remaining finish order" })).toBeInTheDocument();
    expect(screen.getByText("Blue Ridge")).toBeInTheDocument();
    expect(screen.getByLabelText("Override total time for Blue Ridge")).toBeEnabled();
    expect(screen.getByText("P4 (was P4)")).toBeInTheDocument();
  });

  it("hides the remaining finish order section when there are 3 or fewer finishers", () => {
    render(
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 62_345,
          leaderboard: [
            {
              participantId: 7,
              horseName: "Golden Arrow",
              gateNumber: 1,
              progressPercent: 96,
              speedMultiplier: 1,
              status: "RUNNING",
            },
          ],
          outOfRace: [],
          incidents: [],
        }}
      />
    );

    expect(screen.queryByRole("heading", { name: "Remaining finish order" })).not.toBeInTheDocument();
  });

  it("shows did-not-finish and disqualified runners as read-only", () => {
    render(
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 62_345,
          leaderboard: [
            {
              participantId: 7,
              horseName: "Golden Arrow",
              gateNumber: 1,
              progressPercent: 96,
              speedMultiplier: 1,
              status: "RUNNING",
              finishMilliseconds: 62_345,
            },
          ],
          outOfRace: [
            {
              participantId: 5,
              horseName: "Thunderstrike",
              gateNumber: 2,
              progressPercent: 0,
              speedMultiplier: 1,
              status: "DNS",
            },
            {
              participantId: 3,
              horseName: "Night Bloom",
              gateNumber: 3,
              progressPercent: 60,
              speedMultiplier: 1,
              status: "DSQ",
            },
          ],
          incidents: [],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Did not finish / disqualified" })).toBeInTheDocument();
    expect(screen.getByText("Thunderstrike")).toBeInTheDocument();
    expect(screen.getByText("Night Bloom")).toBeInTheDocument();
    expect(screen.getByText("DNF")).toBeInTheDocument();
    expect(screen.getByText("DSQ")).toBeInTheDocument();
    expect(screen.queryByLabelText("Override total time for Thunderstrike")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Override total time for Night Bloom")).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/pages/referee/RefereeOfficiatePage.test.tsx -t "finish order"`

Expected: FAIL — none of "Remaining finish order", the "Did not finish / disqualified" heading, or a 4th runner's row exist in the current markup.

- [ ] **Step 3: Extract `ResultRow` and add the two new sections**

In `frontend/src/pages/referee/race-day/RaceSummary.tsx`, change the import line from:

```tsx
import { RaceAppeal, RaceSnapshot } from "./refereeRaceDayModels";
```

to:

```tsx
import { LiveRunner, RaceAppeal, RaceSnapshot } from "./refereeRaceDayModels";
```

Insert this new type and component directly after the `penaltyFor` function and before `export function RaceSummary`:

```tsx
type ResultRowData = {
  runner: LiveRunner;
  physicalPosition: number;
  actualSeconds: number;
  penaltySeconds: number;
  hasManualOverride: boolean;
  totalSeconds: number;
};

function ResultRow({
  row,
  position,
  confirmed,
  timeDraft,
  savedIndicatorVisible,
  onDraftChange,
  onSave,
}: {
  row: ResultRowData;
  position: number;
  confirmed: boolean;
  timeDraft: string;
  savedIndicatorVisible: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <li className="race-day-row-motion rounded-2xl border border-slate-200 bg-[#fbfdfe] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#007a68] px-3 py-1 font-mono text-xs font-black text-white">P{position}</span>
          <strong className="text-base text-slate-950">{row.runner.horseName}</strong>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
            P{position} (was P{row.physicalPosition})
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-xs font-black text-slate-500">
            Total time override
            <input
              aria-label={`Override total time for ${row.runner.horseName}`}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 font-mono text-sm font-black text-slate-950 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#d4f1e7] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-28"
              disabled={confirmed}
              inputMode="decimal"
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={row.totalSeconds.toFixed(3)}
              type="number"
              value={timeDraft}
            />
          </label>
          <button
            aria-label={`Update time for ${row.runner.horseName}`}
            className="min-h-11 rounded-md bg-[#007a68] px-3 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={confirmed || !timeDraft.trim()}
            onClick={onSave}
            type="button"
          >
            Update Time
          </button>
          {savedIndicatorVisible ? (
            <span className="inline-flex min-h-11 items-center rounded-md bg-emerald-50 px-3 text-xs font-black text-emerald-700">
              Saved
            </span>
          ) : null}
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-white px-3 py-2 font-mono text-sm font-black text-slate-700">
        {seconds(row.actualSeconds)} + {seconds(row.penaltySeconds)} = {seconds(row.totalSeconds)}
      </p>
    </li>
  );
}
```

Then replace the block that starts at `<div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">` and runs through the `</ol>` right before `{draftUpdated ? (`. The current block is:

```tsx
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Official top 3</h3>
          <ol className="mt-3 space-y-3">
            {rows.slice(0, 3).map((row, index) => (
              <li className="race-day-row-motion rounded-2xl border border-slate-200 bg-[#fbfdfe] p-4" key={row.runner.participantId}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#007a68] px-3 py-1 font-mono text-xs font-black text-white">P{index + 1}</span>
                    <strong className="text-base text-slate-950">{row.runner.horseName}</strong>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      P{index + 1} (was P{row.physicalPosition})
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="text-xs font-black text-slate-500">
                      Total time override
                      <input
                        aria-label={`Override total time for ${row.runner.horseName}`}
                        className="mt-1 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 font-mono text-sm font-black text-slate-950 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#d4f1e7] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-28"
                        disabled={confirmed}
                        inputMode="decimal"
                        onChange={(event) =>
                          setTimeDrafts((current) => ({
                            ...current,
                            [row.runner.participantId]: event.target.value,
                          }))
                        }
                        placeholder={row.totalSeconds.toFixed(3)}
                        type="number"
                        value={timeDrafts[row.runner.participantId] ?? ""}
                      />
                    </label>
                    <button
                      aria-label={`Update time for ${row.runner.horseName}`}
                      className="min-h-11 rounded-md bg-[#007a68] px-3 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      disabled={confirmed || !timeDrafts[row.runner.participantId]?.trim()}
                      onClick={() => saveOverride(row.runner.participantId)}
                      type="button"
                    >
                      Update Time
                    </button>
                    {savedRunnerIds.includes(row.runner.participantId) ? (
                      <span className="inline-flex min-h-11 items-center rounded-md bg-emerald-50 px-3 text-xs font-black text-emerald-700">
                        Saved
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-white px-3 py-2 font-mono text-sm font-black text-slate-700">
                  {seconds(row.actualSeconds)} + {seconds(row.penaltySeconds)} = {seconds(row.totalSeconds)}
                </p>
              </li>
            ))}
          </ol>

          {draftUpdated ? (
```

Replace it with:

```tsx
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Official top 3</h3>
          <ol className="mt-3 space-y-3">
            {rows.slice(0, 3).map((row, index) => (
              <ResultRow
                confirmed={confirmed}
                key={row.runner.participantId}
                onDraftChange={(value) =>
                  setTimeDrafts((current) => ({
                    ...current,
                    [row.runner.participantId]: value,
                  }))
                }
                onSave={() => saveOverride(row.runner.participantId)}
                position={index + 1}
                row={row}
                savedIndicatorVisible={savedRunnerIds.includes(row.runner.participantId)}
                timeDraft={timeDrafts[row.runner.participantId] ?? ""}
              />
            ))}
          </ol>

          {rows.length > 3 ? (
            <>
              <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-slate-700">Remaining finish order</h3>
              <ol className="mt-3 space-y-3">
                {rows.slice(3).map((row, index) => (
                  <ResultRow
                    confirmed={confirmed}
                    key={row.runner.participantId}
                    onDraftChange={(value) =>
                      setTimeDrafts((current) => ({
                        ...current,
                        [row.runner.participantId]: value,
                      }))
                    }
                    onSave={() => saveOverride(row.runner.participantId)}
                    position={index + 4}
                    row={row}
                    savedIndicatorVisible={savedRunnerIds.includes(row.runner.participantId)}
                    timeDraft={timeDrafts[row.runner.participantId] ?? ""}
                  />
                ))}
              </ol>
            </>
          ) : null}

          {snapshot.outOfRace.length > 0 ? (
            <>
              <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-slate-700">Did not finish / disqualified</h3>
              <ol className="mt-3 space-y-2">
                {snapshot.outOfRace.map((runner) => (
                  <li
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    key={runner.participantId}
                  >
                    <strong className="text-sm font-black text-slate-800">{runner.horseName}</strong>
                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">
                      {runner.status === "DSQ" ? "DSQ" : "DNF"}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}

          {draftUpdated ? (
```

(Everything from `{draftUpdated ? (` onward — the Appeals Board block through the closing `</section>` — is unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/referee/RefereeOfficiatePage.test.tsx`

Expected: all tests in the file PASS — the 3 new ones plus every pre-existing test in this file unmodified (they all use 3-or-fewer leaderboard runners and empty `outOfRace`, so the top-3 rendering path is unaffected and the two new sections simply don't render for them).

- [ ] **Step 5: Run the wider referee test suite to check for regressions**

Run: `cd frontend && npx vitest run src/pages/referee`

Expected: all tests PASS.

- [ ] **Step 6: Type check**

Run: `cd frontend && npx tsc -b --noEmit`

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/referee/race-day/RaceSummary.tsx frontend/src/pages/referee/RefereeOfficiatePage.test.tsx
git commit -m "feat: show full finish order with did-not-finish/disqualified section"
```
