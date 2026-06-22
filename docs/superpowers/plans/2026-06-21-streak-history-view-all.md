# Compact Streak History And View-All Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show only the three newest streak tickets in My Streaks and open the complete newest-first history in a modal matching View All Predictions.

**Architecture:** Add a pure non-mutating sorter, extract reusable streak ticket rendering, and add an accessible modal component. The spectator page derives the sorted/recent lists and owns modal visibility so the interaction matches the existing prediction-history modal.

**Tech Stack:** React 19, TypeScript 5.8, Vitest 3, Testing Library 16, Tailwind CSS 4

---

## File Map

- Create `frontend/src/pages/spectator/predictions/streakHistoryUtils.ts`: deterministic newest-first sorting.
- Create `frontend/src/pages/spectator/predictions/streakHistoryUtils.test.ts`: sorter and immutability regression tests.
- Create `frontend/src/pages/spectator/predictions/components/StreakHistoryList.tsx`: shared ticket cards and empty state.
- Create `frontend/src/pages/spectator/predictions/components/StreakHistoryModal.tsx`: full-history dialog, Escape handling, and focus entry.
- Create `frontend/src/pages/spectator/predictions/components/StreakHistoryModal.test.tsx`: modal rendering, focus, and Escape tests.
- Create `frontend/src/pages/spectator/predictions/components/StreakSlip.test.tsx`: compact list and View All trigger tests.
- Modify `frontend/src/pages/spectator/predictions/components/StreakSlip.tsx`: render only supplied recent streaks and expose View All.
- Modify `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`: derive sorted/top-three data, own modal state, restore trigger focus.
- Modify `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`: add the currently missing streak API mock so existing page tests can load.

### Task 1: Add deterministic streak ordering

**Files:**
- Create: `frontend/src/pages/spectator/predictions/streakHistoryUtils.ts`
- Create: `frontend/src/pages/spectator/predictions/streakHistoryUtils.test.ts`

- [ ] **Step 1: Write the failing sorter tests**

Create `streakHistoryUtils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sortStreaksNewestFirst } from "./streakHistoryUtils";
import type { StreakPredictionResponse } from "./types/prediction.types";

function streak(id: number, createdAt: string): StreakPredictionResponse {
  return {
    id,
    tournamentId: 1,
    wagerAmount: 10_000,
    totalOdds: 3.5,
    status: "PENDING",
    rewardPoints: 0,
    createdAt,
    legs: [],
  };
}

describe("sortStreaksNewestFirst", () => {
  it("sorts by createdAt descending without mutating API state", () => {
    const source = [
      streak(1, "2026-06-01T10:00:00Z"),
      streak(3, "2026-06-03T10:00:00Z"),
      streak(2, "2026-06-02T10:00:00Z"),
    ];

    expect(sortStreaksNewestFirst(source).map((item) => item.id)).toEqual([3, 2, 1]);
    expect(source.map((item) => item.id)).toEqual([1, 3, 2]);
  });

  it("uses descending id when timestamps are equal or invalid", () => {
    expect(sortStreaksNewestFirst([
      streak(7, "invalid"),
      streak(9, "invalid"),
      streak(8, "invalid"),
    ]).map((item) => item.id)).toEqual([9, 8, 7]);

    expect(sortStreaksNewestFirst([
      streak(4, "2026-06-01T10:00:00Z"),
      streak(5, "2026-06-01T10:00:00Z"),
    ]).map((item) => item.id)).toEqual([5, 4]);
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
cd frontend
npm test -- --run src/pages/spectator/predictions/streakHistoryUtils.test.ts
```

Expected: FAIL because `streakHistoryUtils.ts` does not exist.

- [ ] **Step 3: Implement the sorter**

Create `streakHistoryUtils.ts`:

```ts
import type { StreakPredictionResponse } from "./types/prediction.types";

export function sortStreaksNewestFirst(
  streaks: readonly StreakPredictionResponse[],
): StreakPredictionResponse[] {
  return [...streaks].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return right.id - left.id;
  });
}
```

- [ ] **Step 4: Verify GREEN**

Run the same test command. Expected: 2 tests pass.

### Task 2: Extract streak history rendering and add the compact trigger

**Files:**
- Create: `frontend/src/pages/spectator/predictions/components/StreakHistoryList.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/StreakSlip.test.tsx`
- Modify: `frontend/src/pages/spectator/predictions/components/StreakSlip.tsx`

- [ ] **Step 1: Write the failing compact-history test**

Create `StreakSlip.test.tsx` with four fixtures but pass only the newest three to the component:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StreakSlip } from "./StreakSlip";
import type { StreakPredictionResponse } from "../types/prediction.types";

function streak(id: number): StreakPredictionResponse {
  return {
    id,
    tournamentId: 1,
    wagerAmount: 10_000,
    totalOdds: 3.5,
    status: "PENDING",
    rewardPoints: 0,
    createdAt: `2026-06-0${id}T10:00:00Z`,
    legs: [{
      id: id * 10,
      raceId: id,
      raceName: `Race ${id}`,
      predictedWinnerId: id,
      predictedWinnerName: `Horse ${id}`,
      lockedOdds: 1.5,
      status: "PENDING",
    }],
  };
}

describe("StreakSlip history", () => {
  it("shows three recent streaks and opens View All through its callback", () => {
    const onViewAllStreaks = vi.fn();

    render(
      <StreakSlip
        legs={[]}
        wagerAmount={10_000}
        pointBalance={100_000}
        myStreaks={[streak(4), streak(3), streak(2)]}
        totalStreakCount={4}
        hasMoreStreaks
        onViewAllStreaks={onViewAllStreaks}
        onClearAll={vi.fn()}
        onRemoveLeg={vi.fn()}
        onWagerChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /my streaks/i }));

    expect(screen.getByText("Ticket #4")).toBeInTheDocument();
    expect(screen.getByText("Ticket #3")).toBeInTheDocument();
    expect(screen.getByText("Ticket #2")).toBeInTheDocument();
    expect(screen.queryByText("Ticket #1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view all streaks/i }));
    expect(onViewAllStreaks).toHaveBeenCalledOnce();
  });

  it("hides View All when history has at most three streaks", () => {
    render(
      <StreakSlip
        legs={[]}
        wagerAmount={10_000}
        pointBalance={100_000}
        myStreaks={[streak(3), streak(2), streak(1)]}
        totalStreakCount={3}
        hasMoreStreaks={false}
        onViewAllStreaks={vi.fn()}
        onClearAll={vi.fn()}
        onRemoveLeg={vi.fn()}
        onWagerChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /my streaks/i }));
    expect(screen.queryByRole("button", { name: /view all streaks/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
cd frontend
npm test -- --run src/pages/spectator/predictions/components/StreakSlip.test.tsx
```

Expected: FAIL because the new props and View All button do not exist.

- [ ] **Step 3: Extract the shared ticket list**

Create `StreakHistoryList.tsx`:

```tsx
import { History } from "lucide-react";
import type { StreakPredictionResponse } from "../types/prediction.types";

interface StreakHistoryListProps {
  streaks: readonly StreakPredictionResponse[];
}

export function StreakHistoryList({ streaks }: StreakHistoryListProps) {
  if (streaks.length === 0) {
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
        <History className="mb-2 h-8 w-8 text-turf-700" aria-hidden="true" />
        <p className="text-sm font-semibold text-turf-400">No streak history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {streaks.map((streak) => (
        <article key={streak.id} className="rounded-lg border border-turf-800 bg-turf-900 shadow-lg">
          <div className="flex items-center justify-between border-b border-turf-800 bg-turf-850 px-3 py-2">
            <span className="font-data text-xs font-bold text-turf-300">Ticket #{streak.id}</span>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              streak.status === "WON"
                ? "bg-green-500/20 text-green-400"
                : streak.status === "LOST"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-gold-500/20 text-gold-400"
            }`}>
              {streak.status}
            </span>
          </div>

          <div className="space-y-2 p-3">
            {streak.legs.map((leg, index) => (
              <div key={leg.id ?? `${leg.raceId}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[10px] font-bold uppercase text-ivory-dim">Leg {index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-right font-semibold text-ivory">
                  {leg.predictedWinnerName ?? leg.horseName ?? "Unknown runner"}
                </span>
                <span className="font-data text-gold-300">x{leg.lockedOdds.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-turf-800 bg-turf-850/50 px-3 py-2 text-sm">
            <div>
              <span className="block text-[10px] font-bold uppercase text-ivory-dim">Wager</span>
              <span className="font-data font-semibold text-ivory">{streak.wagerAmount.toLocaleString()} VND</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase text-ivory-dim">Total Odds</span>
              <span className="font-data font-bold text-gold-400">x{streak.totalOdds.toFixed(2)}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Update StreakSlip**

Add props:

```ts
totalStreakCount: number;
hasMoreStreaks: boolean;
onViewAllStreaks: () => void;
```

Use `totalStreakCount` in the My Streaks badge. Replace the current history `myStreaks.map(...)` branch with:

```tsx
<div className="flex-1 overflow-y-auto bg-turf-950 p-4">
  <StreakHistoryList streaks={myStreaks} />
  {hasMoreStreaks && (
    <button
      type="button"
      onClick={onViewAllStreaks}
      className="mt-4 w-full rounded-lg border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm font-bold text-gold-300 transition-colors hover:border-gold-400/60 hover:bg-gold-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
    >
      View All Streaks
    </button>
  )}
</div>
```

- [ ] **Step 5: Verify GREEN**

Run the StreakSlip test command. Expected: 2 tests pass.

### Task 3: Add the full-history modal and page wiring

**Files:**
- Create: `frontend/src/pages/spectator/predictions/components/StreakHistoryModal.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/StreakHistoryModal.test.tsx`
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`

- [ ] **Step 1: Write the failing modal tests**

Create `StreakHistoryModal.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StreakHistoryModal } from "./StreakHistoryModal";
import type { StreakPredictionResponse } from "../types/prediction.types";

const streaks: StreakPredictionResponse[] = [4, 3, 2, 1].map((id) => ({
  id,
  tournamentId: 1,
  wagerAmount: 10_000,
  totalOdds: 3.5,
  status: "PENDING",
  rewardPoints: 0,
  createdAt: `2026-06-0${id}T10:00:00Z`,
  legs: [],
}));

describe("StreakHistoryModal", () => {
  it("renders all streaks and moves focus to Close", () => {
    render(<StreakHistoryModal open streaks={streaks} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: /all streak predictions/i })).toBeInTheDocument();
    expect(screen.getByText("Ticket #4")).toBeInTheDocument();
    expect(screen.getByText("Ticket #1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close streak history/i })).toHaveFocus();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<StreakHistoryModal open streaks={streaks} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes from the explicit close button", () => {
    const onClose = vi.fn();
    render(<StreakHistoryModal open streaks={streaks} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close streak history$/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
cd frontend
npm test -- --run src/pages/spectator/predictions/components/StreakHistoryModal.test.tsx
```

Expected: FAIL because the modal component does not exist.

- [ ] **Step 3: Implement the modal**

Create `StreakHistoryModal.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { StreakPredictionResponse } from "../types/prediction.types";
import { StreakHistoryList } from "./StreakHistoryList";

interface StreakHistoryModalProps {
  open: boolean;
  streaks: readonly StreakPredictionResponse[];
  onClose: () => void;
}

export function StreakHistoryModal({ open, streaks, onClose }: StreakHistoryModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
      <button
        type="button"
        aria-label="Close streak history backdrop"
        className="absolute inset-0 bg-turf-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="all-streak-predictions-title"
        className="relative flex h-full max-h-[800px] w-full max-w-[800px] flex-col overflow-hidden rounded-2xl border border-turf-700 bg-turf-900 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-turf-800 p-4 sm:p-6">
          <div>
            <h2 id="all-streak-predictions-title" className="text-xl font-extrabold text-ivory">
              All Streak Predictions
            </h2>
            <p className="mt-1 text-sm font-semibold text-ivory-dim">Your complete streak history</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close streak history"
            className="grid h-10 w-10 place-items-center rounded-full bg-turf-800 text-ivory-dim transition-colors hover:bg-turf-700 hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
          <StreakHistoryList streaks={streaks} />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Wire the spectator page**

Update the React import to include `useCallback` and `useMemo`. Import `sortStreaksNewestFirst` and `StreakHistoryModal`. Add:

```tsx
const sortedStreaks = useMemo(() => sortStreaksNewestFirst(myStreaks), [myStreaks]);
const recentStreaks = sortedStreaks.slice(0, 3);
const [isAllStreaksModalOpen, setIsAllStreaksModalOpen] = useState(false);
const streakModalTriggerRef = useRef<HTMLElement | null>(null);

const openAllStreaks = () => {
  streakModalTriggerRef.current =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  setIsAllStreaksModalOpen(true);
};

const closeAllStreaks = useCallback(() => {
  setIsAllStreaksModalOpen(false);
  window.requestAnimationFrame(() => streakModalTriggerRef.current?.focus());
}, []);
```

Pass these props to `StreakSlip`:

```tsx
myStreaks={recentStreaks}
totalStreakCount={sortedStreaks.length}
hasMoreStreaks={sortedStreaks.length > 3}
onViewAllStreaks={openAllStreaks}
```

Render beside the existing View All Predictions modal:

```tsx
<StreakHistoryModal
  open={isAllStreaksModalOpen}
  streaks={sortedStreaks}
  onClose={closeAllStreaks}
/>
```

Finally, add `getSpectatorStreaks: vi.fn()` to the mocked API in `SpectatorPredictionsPage.test.tsx` and default it to `mockResolvedValue([])` in `beforeEach`.

- [ ] **Step 5: Verify modal GREEN**

Run the modal test command. Expected: 3 tests pass.

- [ ] **Step 6: Run focused frontend verification**

```powershell
cd frontend
npm test -- --run src/pages/spectator/predictions/streakHistoryUtils.test.ts src/pages/spectator/predictions/components/StreakSlip.test.tsx src/pages/spectator/predictions/components/StreakHistoryModal.test.tsx
npm run build
```

Expected: 7 new tests pass and the production build exits 0.

- [ ] **Step 7: Inspect the final diff**

```powershell
git diff --check
git diff -- frontend/src/pages/spectator/predictions
```

Confirm the source array is not mutated, only three tickets reach the compact panel, all tickets reach the modal, and existing user-owned edits remain intact.
