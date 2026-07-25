# Suspended Prediction Arena Read-only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give suspended users a clearly communicated, fully read-only Prediction Arena while preserving race, odds, position, history, and settlement visibility.

**Architecture:** `SpectatorPredictionsPage` derives one `predictionReadOnly` capability from the authenticated session and passes it into mutation-owning components. A focused notice component explains the restriction; `PredictionSlip` and `StreakSlip` suppress mutation UI and network calls while the page retains handler-level guards as a second line of protection.

**Tech Stack:** React 19, TypeScript, React Router, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Add the suspended-state contract and operational notice

**Files:**
- Create: `frontend/src/pages/spectator/predictions/components/SuspendedPredictionNotice.tsx`
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`
- Test: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`

- [ ] **Step 1: Add a failing suspended-state rendering test**

Mock the session hook at module scope and default it to active so existing tests remain unchanged:

```tsx
let accountStatus: "ACTIVE" | "SUSPENDED" = "ACTIVE";

vi.mock("../../../hooks/useClientSession", () => ({
  useClientSession: () => ({
    session: { accountStatus },
    isAuthenticated: true,
    isInitializing: false,
    logout: vi.fn(),
  }),
}));
```

Reset `accountStatus = "ACTIVE"` in `beforeEach`, then add:

```tsx
it("shows a professional account-under-review notice while preserving arena data", async () => {
  accountStatus = "SUSPENDED";
  renderArena();

  expect(await screen.findByText(/predictions are temporarily paused/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /review account status/i })).toHaveAttribute(
    "href",
    "/account-restricted",
  );
  expect(await screen.findByRole("button", { name: /twilight sprint/i })).toBeEnabled();
  expect(screen.getByRole("tab", { name: /my positions/i })).toBeEnabled();
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
npm --prefix frontend test -- SpectatorPredictionsPage.test.tsx --run
```

Expected: the new test fails because the notice and account-status link do not exist.

- [ ] **Step 3: Create the operational notice**

Implement a compact, labelled status region using the existing racing palette:

```tsx
import { LockKeyhole, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function SuspendedPredictionNotice() {
  return (
    <section
      aria-labelledby="prediction-restriction-title"
      className="relative mb-4 overflow-hidden rounded-lg border border-amber-300/25 bg-[#2a1015] px-5 py-4 shadow-[0_18px_50px_-38px_rgba(0,0,0,.9)]"
    >
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-amber-400" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-300/10 text-amber-300">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-data text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
              Account under review
            </p>
            <h1 id="prediction-restriction-title" className="mt-1 font-display text-xl font-bold text-ivory">
              Predictions are temporarily paused
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ivory-dim">
              You can still review races, odds, existing positions, and settlements. New predictions remain unavailable while your account is under review.
            </p>
          </div>
        </div>
        <Link
          to="/account-restricted"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-amber-300/35 px-4 text-sm font-black text-amber-200 hover:bg-amber-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Review account status <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Derive the page-level capability and render the notice**

In `SpectatorPredictionsPage`, import `useClientSession`, `accountCapabilities`, and the new notice. Derive:

```tsx
const { session } = useClientSession();
const capabilities = accountCapabilities(session?.accountStatus ?? "ACTIVE");
const predictionReadOnly = !capabilities.canMutateBusinessData;
const readOnlyReason = predictionReadOnly
  ? "Predictions are unavailable while your account is under review."
  : undefined;
```

Render `<SuspendedPredictionNotice />` immediately below `<ClientHeader />` content, inside the main page width, only when `session?.accountStatus === "SUSPENDED"`.

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run:

```powershell
npm --prefix frontend test -- SpectatorPredictionsPage.test.tsx --run
```

Expected: all existing tests and the suspended notice test pass.

- [ ] **Step 6: Commit the notice and capability contract**

```powershell
git add frontend/src/pages/spectator/predictions
git commit -m "feat: show suspended prediction arena notice"
```

### Task 2: Make standard predictions read-only and suppress quote traffic

**Files:**
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`
- Modify: `frontend/src/pages/spectator/predictions/components/PredictionSlip.tsx`
- Test: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`

- [ ] **Step 1: Add a failing mutation-suppression test**

```tsx
it("does not select, quote, or submit a standard prediction while suspended", async () => {
  accountStatus = "SUSPENDED";
  renderArena();

  fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
  const oddsButton = (await screen.findAllByRole("button", { name: /2\.50/i }))[0];
  expect(oddsButton).toBeDisabled();
  fireEvent.click(oddsButton);

  expect(screen.getByText(/unavailable while suspended/i)).toBeInTheDocument();
  expect(spectatorPredictionApi.quotePrediction).not.toHaveBeenCalled();
  expect(spectatorPredictionApi.submitPrediction).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
npm --prefix frontend test -- SpectatorPredictionsPage.test.tsx --run
```

Expected: the runner remains enabled and the explicit lock message is absent.

- [ ] **Step 3: Extend `PredictionSlip` with an explicit read-only contract**

Add props:

```tsx
readOnly?: boolean;
readOnlyReason?: string;
```

Default `readOnly = false`. Include it in confirmation and quote rules:

```tsx
const canConfirm = !readOnly && validation.canConfirm && !submitting && success == null;

if (
  readOnly ||
  !race ||
  !options?.predictionOpen ||
  !picks.winnerId ||
  wagerAmount < 10000 ||
  (predType === "EXACT_POSITION" && !picks.predictedPosition) ||
  predType === "WINNING_STREAK"
) {
  setQuote(null);
  setQuoteLoading(false);
  setQuoteError(null);
  return;
}
```

Add `readOnly` to the quote effect dependency list and guard `handleConfirm`:

```tsx
if (readOnly || !validation.canConfirm || submitting || success) return;
```

Replace the validation message and confirm button label when read-only:

```tsx
const visibleValidation = readOnly
  ? (readOnlyReason ?? "Predictions are currently unavailable.")
  : validationDisplay(validation.message);

{readOnly ? <LockKeyhole className="h-4 w-4" aria-hidden="true" /> : null}
{readOnly ? "Unavailable while suspended" : submitting ? "Processing" : "Confirm Prediction"}
```

Keep the Bet Slip / My Positions tabs and rules dialog enabled.

- [ ] **Step 4: Disable page-owned standard mutation controls**

Pass `predictionReadOnly` into existing selector components:

```tsx
disabled={predictionReadOnly || !predictionOptions.predictionOpen || cockpitSubmitting}
```

Apply `disabled={predictionReadOnly}` to wager presets, the `Other` button, custom input, increment, decrement, and clear-selection actions. Use disabled classes without hover affordances.

Pass the contract to the slip:

```tsx
<PredictionSlip
  race={selectedRace}
  options={predictionOptions}
  predType={predType}
  picks={picks}
  wagerAmount={wagerAmount}
  pointBalance={pointBalance}
  myPredictions={myPredictions}
  onClear={handleClearSelections}
  onConfirm={handleCockpitConfirm}
  onViewAll={() => setIsAllPredictionsModalOpen(true)}
  readOnly={predictionReadOnly}
  readOnlyReason={readOnlyReason}
/>
```

Insert `if (predictionReadOnly) return;` as the first statement of `handleSelectRunner` and `handleClearSelections`. Change the first condition in `handleCockpitConfirm` to:

```tsx
if (predictionReadOnly || !cockpitValidation.canConfirm || cockpitSubmitting) return;
```

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run:

```powershell
npm --prefix frontend test -- SpectatorPredictionsPage.test.tsx --run
```

Expected: the suspended test passes and the active submit test still calls `submitPrediction` once.

- [ ] **Step 6: Commit standard read-only prediction behavior**

```powershell
git add frontend/src/pages/spectator/predictions
git commit -m "fix: prevent suspended prediction mutations"
```

### Task 3: Make winning streaks read-only and complete verification

**Files:**
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`
- Modify: `frontend/src/pages/spectator/predictions/components/StreakSlip.tsx`
- Test: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`

- [ ] **Step 1: Add a failing streak read-only test**

Add `submitStreakPrediction: vi.fn()` to the mocked API. Then add:

```tsx
it("keeps streak history available without allowing suspended streak mutations", async () => {
  accountStatus = "SUSPENDED";
  renderArena();

  fireEvent.click(await screen.findByRole("button", { name: /winning streak pick/i }));
  expect(screen.getByRole("button", { name: /my streaks/i })).toBeEnabled();
  expect(screen.getByRole("button", { name: /unavailable while suspended/i })).toBeDisabled();
  expect(spectatorPredictionApi.submitStreakPrediction).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
npm --prefix frontend test -- SpectatorPredictionsPage.test.tsx --run
```

Expected: the streak confirm button still says `Place Streak Bet` and has no read-only contract.

- [ ] **Step 3: Extend `StreakSlip` with the same read-only contract**

Add props with an active-compatible default:

```tsx
readOnly?: boolean;
readOnlyReason?: string;
```

Default `readOnly = false`, then change the first line inside `handleConfirm` to guard submission:

```tsx
if (readOnly || !canSubmit || submitting) return;
```

Disable `Clear All`, remove-leg buttons, wager input, decrement, and increment when `readOnly`. Preserve `New Bet`, `My Streaks`, `View All`, and rules navigation.

Render an explicit lock explanation and button state:

```tsx
{readOnly ? (
  <div className="rounded-md border border-amber-300/20 bg-amber-300/5 p-3 text-center text-xs font-semibold leading-5 text-amber-200">
    {readOnlyReason}
  </div>
) : !canSubmit ? (
  <div className="rounded-md bg-turf-800/50 p-2 text-center text-xs font-semibold text-turf-400">
    {validationMessage}
  </div>
) : null}

<button disabled={readOnly || !canSubmit || submitting || !!success} aria-label={readOnly ? "Unavailable while suspended" : "Place Streak Bet"}>
  {readOnly ? "Unavailable while suspended" : submitting ? "Processing..." : "Place Streak Bet"}
</button>
```

- [ ] **Step 4: Stop page-level streak mutation and pass the contract**

Prevent building a streak in `handleSelectRunner` through the existing page-level `predictionReadOnly` guard. Pass:

```tsx
<StreakSlip
  legs={streakLegs}
  wagerAmount={wagerAmount}
  pointBalance={pointBalance}
  myStreaks={myStreaks}
  onClearAll={() => setStreakLegs([])}
  onRemoveLeg={(id) => setStreakLegs((current) => current.filter((leg) => leg.raceId !== id))}
  onWagerChange={setWagerAmount}
  onViewAllStreaks={() => setIsAllStreaksModalOpen(true)}
  readOnly={predictionReadOnly}
  readOnlyReason={readOnlyReason}
  onSubmit={async () => {
    if (predictionReadOnly) return;
    if (!selectedRace?.tournamentId) throw new Error("Tournament not found");
    await spectatorPredictionApi.submitStreakPrediction({
      tournamentId: selectedRace.tournamentId,
      wagerAmount,
      legs: streakLegs.map((leg) => ({
        raceId: leg.raceId,
        predictedWinnerId: leg.predictedWinnerId,
      })),
    });
    await refreshAll();
  }}
/>
```

- [ ] **Step 5: Run final focused verification once**

Run:

```powershell
npm --prefix frontend test -- SpectatorPredictionsPage.test.tsx --run
npm --prefix frontend run build
git diff --check
```

Expected: all Prediction Arena tests pass, production TypeScript/Vite build exits 0, and `git diff --check` prints no errors.

- [ ] **Step 6: Commit streak behavior and verification-ready result**

```powershell
git add frontend/src/pages/spectator/predictions
git commit -m "fix: make suspended streak predictions read only"
```
