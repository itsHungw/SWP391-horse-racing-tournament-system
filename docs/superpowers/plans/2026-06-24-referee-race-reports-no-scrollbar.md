# Referee Race Reports (No Scrollbar) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Referee Result History (Race Reports) page to use a single, unified, responsive card feed layout, eliminating the horizontal scrollbar.

**Architecture:** Replace the wide desktop HTML table and duplicate mobile layouts with a single responsive card layout wrapped in a `<section role="region" aria-label="published race results">` element for test compatibility.

**Tech Stack:** React, TypeScript, React Router, Lucide Icons, Vitest, React Testing Library.

---

### Task 1: Update Test Assertions in App.test.tsx

**Files:**
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Write the updated test assertions**
  In `App.test.tsx`, locate the test `"renders referee result packages as a read-only confirmed results archive"`.
  Replace the table query assertion with a region query assertion:

  ```typescript
  // Replace lines 449-455 with:
  const resultsContainer = screen.getByRole("region", { name: /published race results/i });
  expect(resultsContainer).toBeInTheDocument();
  expect(within(resultsContainer).getAllByText("PUBLISHED")).toHaveLength(2);
  expect(within(resultsContainer).getByText("June Stakes - Heat 2")).toBeInTheDocument();
  expect(within(resultsContainer).getByText(/Golden Arrow, Night Bloom, River Comet/i)).toBeInTheDocument();
  expect(within(resultsContainer).getByText(/Track Hazard - Caution Period Enabled/i)).toBeInTheDocument();
  expect(within(resultsContainer).getByText(/Warning: Lane drift/i)).toBeInTheDocument();
  ```

- [ ] **Step 2: Run the test to verify it fails**
  Run: `npx vitest run src/App.test.tsx`
  Expected: FAIL (as the `region` role is not yet present in `RefereeResultHistoryPage.tsx` and the `table` role was deleted/not matching).

---

### Task 2: Redesign RefereeResultHistoryPage with Responsive Card Feed

**Files:**
- Modify: `frontend/src/pages/referee/RefereeResultHistoryPage.tsx`

- [ ] **Step 1: Re-implement RefereeResultHistoryPage content**
  Replace the mobile (`md:hidden`) and desktop (`md:block`) split view in `RefereeResultHistoryPage` with a single, unified card list.
  
  Make the JSX look like this:
  ```tsx
  export function RefereeResultHistoryPage() {
    return (
      <section className="max-w-[1486px] space-y-6" aria-labelledby="result-history-title">
        <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006f5f]">Result packages</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl" id="result-history-title">
            Confirmed race results
          </h2>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            Review confirmed finish orders, incidents, and penalties after a referee result package has been accepted.
          </p>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Read-only archive</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">Race result packages</h3>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
              {publishedRaceResults.length} published
            </span>
          </div>

          <section role="region" aria-label="published race results" className="space-y-4 p-5 bg-slate-50/50">
            {publishedRaceResults.map((result) => (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5" key={result.id}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="inline-flex rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                      {result.status}
                    </span>
                    <h4 className="mt-3 text-xl font-black text-slate-950">{result.raceName}</h4>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{result.raceDate} · {result.venue}</p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Final Time</p>
                    <p className="mt-1 text-lg font-black text-slate-950 font-mono">{result.finalTime}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Winner</p>
                    <p className="mt-1.5 text-sm font-black text-[#006f5f]">{result.winner}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Top 3 Runners</p>
                    <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-600">{result.topThree.join(", ")}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Published Info</p>
                    <p className="mt-1.5 text-xs font-black text-slate-800">{result.publishedAt}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">By {result.publishedBy}</p>
                  </div>
                </div>

                {/* Incidents & Penalties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-800">Incidents logged</h5>
                    {result.incidents.length > 0 ? (
                      <ul className="mt-2 space-y-1.5 text-xs font-semibold text-rose-950">
                        {result.incidents.map((incident, idx) => (
                          <li key={idx} className="list-disc list-inside leading-relaxed">{incident}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs font-semibold text-slate-400">Clean race recorded</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-amber-800">Penalties applied</h5>
                    {result.penalties.length > 0 ? (
                      <ul className="mt-2 space-y-1.5 text-xs font-semibold text-amber-950">
                        {result.penalties.map((penalty, idx) => (
                          <li key={idx} className="list-disc list-inside leading-relaxed">{penalty}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs font-semibold text-slate-400">No penalties</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    );
  }
  ```

---

### Task 3: Verify and Run Test Suites

**Files:**
- Test: `frontend/src/App.test.tsx`

- [ ] **Step 1: Run the App test**
  Run: `npx vitest run src/App.test.tsx`
  Expected: PASS

- [ ] **Step 2: Run all referee tests**
  Run: `npx vitest run src/pages/referee/`
  Expected: PASS
