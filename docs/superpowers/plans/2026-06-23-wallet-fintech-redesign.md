# Wallet Fintech Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/wallet` into a premium fintech wallet with authoritative money states, a Performance equity curve, single-screen withdrawal, saved bank accounts, withdrawal cancel/timeline, custom top-up, and updated tests.

**Architecture:** Keep the existing backend contracts and `walletApi` unchanged. Add one focused chart component, refactor the existing withdraw sheet from wizard to single-screen, and rewrite `WalletPage.tsx` around server summary data plus client-side transaction filtering. Keep all money logic in small helpers inside wallet page/chart files unless a second consumer appears.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion 12, Lucide React, Vitest, React Testing Library.

---

## Scope Notes

- Spec: `docs/superpowers/specs/2026-06-23-wallet-fintech-redesign-design.md`.
- Do not change backend endpoints, DTOs, migrations, route protection, VNPay flow, or admin withdrawal behavior.
- Visible wallet copy must avoid: `Bet`, `Betting`, `Wager`, `Odds`, `Stake`, `Gambling`, `P&L`, `Profit/Loss`.
- Use: `Prediction`, `Entry`, `Payout`, `Winnings`, `Performance`, `Net result`, `Top-up`, `Withdrawal`.
- Format money as `1,234,567 VND`; show `+` only for ledger/chart signed values.

## File Map

- Create: `frontend/src/pages/wallet/PerformanceChart.tsx`
  - Owns chart data derivation, range filtering, SVG path generation, empty/loading states, and a11y label.
- Modify: `frontend/src/pages/wallet/WithdrawSheet.tsx`
  - Remove wizard stepper and convert to one scrollable sheet with amount, saved accounts, inline add account, live summary, and amount-specific submit button.
- Modify: `frontend/src/pages/wallet/WalletPage.tsx`
  - Load `getSummary()` and bank-aware withdraw sheet, compute `availableToWithdraw`, render new layout, custom top-up, ledger filters, payout queue cancel/timeline.
- Modify: `frontend/src/pages/wallet/WalletPage.test.tsx`
  - Replace old page assertions with new summary/chart/withdraw/filter/cancel behavior assertions.

---

### Task 1: Update Wallet Page Test Contract First

**Files:**
- Modify: `frontend/src/pages/wallet/WalletPage.test.tsx`

- [ ] **Step 1: Replace the current wallet API mock with the complete wallet API surface**

Replace the `vi.mock("../../api/walletApi", ...)` block with:

```ts
vi.mock("../../api/walletApi", () => ({
  walletApi: {
    getMyWallet: vi.fn(),
    getSummary: vi.fn(),
    getMyTransactions: vi.fn(),
    getMyWithdrawals: vi.fn(),
    createTopUp: vi.fn(),
    getBankAccounts: vi.fn(),
    addBankAccount: vi.fn(),
    deleteBankAccount: vi.fn(),
    createWithdrawal: vi.fn(),
    cancelWithdrawal: vi.fn(),
  },
}));
```

- [ ] **Step 2: Add user interaction imports**

Change the imports to include `fireEvent` and `waitFor`:

```ts
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
```

- [ ] **Step 3: Seed summary, transactions, withdrawals, and saved banks**

In `beforeEach`, after `getMyWallet`, add:

```ts
vi.mocked(walletApi.getSummary).mockResolvedValue({
  balance: 1245875,
  status: "ACTIVE",
  inPlay: 125000,
  pendingWithdrawal: 150000,
});
```

Keep two result transactions and add withdrawal/top-up rows so filter chips have coverage:

```ts
vi.mocked(walletApi.getMyTransactions).mockResolvedValue([
  {
    id: 1,
    amount: 25000,
    type: "BET_PAYOUT",
    referenceType: "RACE",
    referenceId: 9,
    balanceAfter: 1245875,
    description: "Race #9 payout",
    createdAt: "2026-06-20T08:30:00Z",
  },
  {
    id: 2,
    amount: -10000,
    type: "BET_PLACED",
    referenceType: "RACE",
    referenceId: 8,
    balanceAfter: 1220875,
    description: "Prediction entry",
    createdAt: "2026-06-19T08:30:00Z",
  },
  {
    id: 4,
    amount: -150000,
    type: "WITHDRAWAL_HOLD",
    referenceType: "WITHDRAWAL",
    referenceId: 3,
    balanceAfter: 1210875,
    description: "Withdrawal hold",
    createdAt: "2026-06-18T08:30:00Z",
  },
  {
    id: 5,
    amount: 500000,
    type: "TOPUP",
    referenceType: "TOPUP_ORDER",
    referenceId: 21,
    balanceAfter: 1360875,
    description: "VNPay top-up",
    createdAt: "2026-06-17T08:30:00Z",
  },
]);
```

Keep the existing requested withdrawal and add a cancelled one:

```ts
vi.mocked(walletApi.getMyWithdrawals).mockResolvedValue([
  {
    id: 3,
    userId: 7,
    userName: "Racing Fan",
    userEmail: "fan@example.com",
    amount: 150000,
    status: "REQUESTED",
    bankInfo: "RACING FAN - 123456789 - Vietcombank (VCB)",
    reviewNote: null,
    reviewedByName: null,
    requestedAt: "2026-06-21T10:00:00Z",
    reviewedAt: null,
    paidAt: null,
  },
  {
    id: 6,
    userId: 7,
    userName: "Racing Fan",
    userEmail: "fan@example.com",
    amount: 80000,
    status: "CANCELLED",
    bankInfo: "RACING FAN - 987654321 - Techcombank (TCB)",
    reviewNote: null,
    reviewedByName: null,
    requestedAt: "2026-06-18T10:00:00Z",
    reviewedAt: "2026-06-18T10:05:00Z",
    paidAt: null,
  },
]);
```

Add saved accounts:

```ts
vi.mocked(walletApi.getBankAccounts).mockResolvedValue([
  {
    id: 11,
    bankCode: "VCB",
    bankName: "Vietcombank",
    accountNumber: "123456789",
    accountHolder: "RACING FAN",
    label: "Main account",
  },
]);
vi.mocked(walletApi.createWithdrawal).mockResolvedValue({
  id: 12,
  userId: 7,
  userName: "Racing Fan",
  userEmail: "fan@example.com",
  amount: 100000,
  status: "REQUESTED",
  bankInfo: "RACING FAN - 123456789 - Vietcombank (VCB)",
  reviewNote: null,
  reviewedByName: null,
  requestedAt: "2026-06-22T10:00:00Z",
  reviewedAt: null,
  paidAt: null,
});
vi.mocked(walletApi.cancelWithdrawal).mockResolvedValue({
  id: 3,
  userId: 7,
  userName: "Racing Fan",
  userEmail: "fan@example.com",
  amount: 150000,
  status: "CANCELLED",
  bankInfo: "RACING FAN - 123456789 - Vietcombank (VCB)",
  reviewNote: null,
  reviewedByName: null,
  requestedAt: "2026-06-21T10:00:00Z",
  reviewedAt: "2026-06-21T10:05:00Z",
  paidAt: null,
});
```

- [ ] **Step 4: Replace the old page rendering test**

Replace the current `it(...)` with:

```ts
it("renders a platform-grade wallet with money states, performance, top-up, ledger, and payout queue", async () => {
  render(
    <MemoryRouter initialEntries={["/wallet?topup=success"]}>
      <WalletPage />
    </MemoryRouter>,
  );

  expect(await screen.findByRole("heading", { name: /available balance/i })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(/top-up successful/i);

  expect(screen.getByText("970,875 VND")).toBeInTheDocument();
  expect(screen.getByText("125,000 VND")).toBeInTheDocument();
  expect(screen.getAllByText("150,000 VND")[0]).toBeInTheDocument();

  expect(screen.getByRole("img", { name: /performance: net result \+15,000 vnd/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /performance/i })).toBeInTheDocument();

  const topUp = screen.getByRole("region", { name: /add money/i });
  expect(within(topUp).getByRole("button", { name: /top up 50,000 vnd/i })).toBeEnabled();
  expect(within(topUp).getByLabelText(/custom top-up amount/i)).toBeInTheDocument();

  const ledger = screen.getByRole("table", { name: /wallet ledger/i });
  expect(within(ledger).getByText("Race payout")).toBeInTheDocument();
  expect(within(ledger).getByText("+25,000 VND")).toBeInTheDocument();
  expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
});
```

- [ ] **Step 5: Add a withdraw sheet behavior test**

Append:

```ts
it("opens the single-screen withdraw sheet and submits to the selected saved account", async () => {
  render(
    <MemoryRouter initialEntries={["/wallet"]}>
      <WalletPage />
    </MemoryRouter>,
  );

  await screen.findByRole("heading", { name: /available balance/i });
  fireEvent.click(screen.getByRole("button", { name: /^withdraw$/i }));

  const dialog = await screen.findByRole("dialog", { name: /withdraw funds/i });
  expect(within(dialog).queryByText(/continue/i)).not.toBeInTheDocument();
  expect(within(dialog).getByLabelText(/amount to withdraw/i)).toBeInTheDocument();
  expect(within(dialog).getByText(/vietcombank/i)).toBeInTheDocument();

  fireEvent.change(within(dialog).getByLabelText(/amount to withdraw/i), { target: { value: "100000" } });
  fireEvent.click(within(dialog).getByRole("button", { name: /withdraw 100,000 vnd/i }));

  await waitFor(() => {
    expect(walletApi.createWithdrawal).toHaveBeenCalledWith(
      100000,
      "RACING FAN · 123456789 · Vietcombank (VCB)",
    );
  });
});
```

- [ ] **Step 6: Add a cancel withdrawal test**

Append:

```ts
it("cancels requested withdrawals from the payout queue", async () => {
  render(
    <MemoryRouter initialEntries={["/wallet"]}>
      <WalletPage />
    </MemoryRouter>,
  );

  await screen.findByRole("heading", { name: /available balance/i });
  fireEvent.click(screen.getByRole("button", { name: /cancel withdrawal 3/i }));

  await waitFor(() => {
    expect(walletApi.cancelWithdrawal).toHaveBeenCalledWith(3);
  });
});
```

- [ ] **Step 7: Run the wallet tests and verify they fail for the old UI**

Run from `frontend/`:

```bash
node node_modules/vitest/vitest.mjs run src/pages/wallet
```

Expected: FAIL because `getSummary`, Performance chart, single-screen withdraw, and cancel action are not implemented in `WalletPage.tsx` yet.

- [ ] **Step 8: Commit the failing test contract**

```bash
git add frontend/src/pages/wallet/WalletPage.test.tsx
git commit -m "test: capture wallet fintech redesign contract"
```

---

### Task 2: Add Performance Equity Curve Component

**Files:**
- Create: `frontend/src/pages/wallet/PerformanceChart.tsx`
- Test indirectly: `frontend/src/pages/wallet/WalletPage.test.tsx`

- [ ] **Step 1: Create the component file**

Create `frontend/src/pages/wallet/PerformanceChart.tsx` with:

```tsx
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity } from "lucide-react";

import type { WalletTransaction } from "../../types/wallet";

const vnd = new Intl.NumberFormat("en-US");
const RESULT_TYPES = new Set(["BET_PLACED", "BET_PAYOUT", "BET_REFUND"]);
const RANGES = ["1W", "1M", "3M", "All"] as const;

type RangeKey = (typeof RANGES)[number];

interface Point {
  t: number;
  value: number;
}

function formatSigned(amount: number) {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${vnd.format(Math.abs(amount))} VND`;
}

function cutoffFor(range: RangeKey, now: number) {
  const day = 24 * 60 * 60 * 1000;
  if (range === "1W") return now - 7 * day;
  if (range === "1M") return now - 30 * day;
  if (range === "3M") return now - 90 * day;
  return Number.NEGATIVE_INFINITY;
}

function buildSeries(transactions: WalletTransaction[]) {
  let total = 0;
  return transactions
    .filter((tx) => RESULT_TYPES.has(tx.type))
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((tx) => {
      total += tx.amount;
      return {
        t: new Date(tx.createdAt).getTime(),
        value: total,
      };
    });
}

function pathFor(points: Point[], width: number, height: number, padding = 18) {
  if (points.length < 2) return { line: "", area: "", zeroY: null as number | null };

  const xs = points.map((p) => p.t);
  const ys = points.map((p) => p.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const xSpan = Math.max(1, maxX - minX);
  const ySpan = Math.max(1, maxY - minY);

  const x = (value: number) => padding + ((value - minX) / xSpan) * (width - padding * 2);
  const y = (value: number) => height - padding - ((value - minY) / ySpan) * (height - padding * 2);

  const coords = points.map((p) => [x(p.t), y(p.value)] as const);
  const line = coords.map(([cx, cy], index) => `${index === 0 ? "M" : "L"} ${cx.toFixed(2)} ${cy.toFixed(2)}`).join(" ");
  const first = coords[0];
  const last = coords[coords.length - 1];
  const area = `${line} L ${last[0].toFixed(2)} ${height - padding} L ${first[0].toFixed(2)} ${height - padding} Z`;

  return {
    line,
    area,
    zeroY: minY < 0 && maxY > 0 ? y(0) : null,
  };
}

export function PerformanceChart({
  transactions,
  loading,
}: {
  transactions: WalletTransaction[];
  loading: boolean;
}) {
  const reduce = useReducedMotion();
  const [range, setRange] = useState<RangeKey>("All");

  const allPoints = useMemo(() => buildSeries(transactions), [transactions]);
  const now = allPoints.at(-1)?.t ?? Date.now();
  const visiblePoints = useMemo(() => {
    const cutoff = cutoffFor(range, now);
    return allPoints.filter((point) => point.t >= cutoff);
  }, [allPoints, now, range]);

  const points = visiblePoints.length >= 2 ? visiblePoints : allPoints;
  const latest = points.at(-1)?.value ?? 0;
  const first = points[0]?.value ?? 0;
  const delta = points.length >= 2 ? latest - first : 0;
  const positive = latest >= 0;
  const chart = pathFor(points, 640, 240);
  const accent = positive ? "#66d9a3" : "#fda4af";
  const gradientId = positive ? "walletPerformancePositive" : "walletPerformanceNegative";

  return (
    <section
      aria-labelledby="performance-title"
      className="rounded-lg border border-white/10 bg-[#061a15] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-data text-[11px] uppercase tracking-[0.18em] text-gold-200">Net results over time</p>
          <h2 id="performance-title" className="mt-2 text-xl font-black text-ivory">
            Performance
          </h2>
          {loading ? (
            <span className="mt-4 block h-9 w-44 animate-pulse rounded bg-white/10" />
          ) : (
            <p className={`mt-3 font-data text-3xl font-black ${positive ? "text-emerald-soft" : "text-rose-200"}`}>
              {formatSigned(latest)}
            </p>
          )}
          {!loading && points.length >= 2 ? (
            <p className="mt-2 font-data text-xs font-bold text-ivory-dim">
              {formatSigned(delta)} in selected range
            </p>
          ) : null}
        </div>

        <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 p-1" aria-label="Performance range">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`min-h-9 rounded-full px-3 font-data text-xs font-bold transition-colors ${
                range === item ? "bg-gold-400 text-turf-950" : "text-ivory-dim hover:text-ivory"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 h-[240px] animate-pulse rounded-lg bg-white/8" aria-label="Loading performance" />
      ) : allPoints.length < 2 ? (
        <div className="mt-6 grid min-h-[220px] place-items-center rounded-lg border border-dashed border-white/15 p-6 text-center">
          <div>
            <Activity className="mx-auto h-9 w-9 text-gold-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-ivory">Your performance curve appears after your first settled prediction.</p>
          </div>
        </div>
      ) : (
        <div
          className="mt-6"
          role="img"
          aria-label={`Performance: net result ${formatSigned(latest)} over ${range.toLowerCase()}`}
        >
          <svg viewBox="0 0 640 240" className="h-auto w-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            {chart.zeroY != null ? (
              <line x1="18" x2="622" y1={chart.zeroY} y2={chart.zeroY} stroke="rgba(255,255,255,0.16)" strokeDasharray="6 8" />
            ) : null}
            <motion.path
              d={chart.area}
              fill={`url(#${gradientId})`}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.path
              d={chart.line}
              fill="none"
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Run wallet tests**

Run from `frontend/`:

```bash
node node_modules/vitest/vitest.mjs run src/pages/wallet
```

Expected: still FAIL because `WalletPage.tsx` has not imported or rendered `PerformanceChart`.

- [ ] **Step 3: Commit the chart component**

```bash
git add frontend/src/pages/wallet/PerformanceChart.tsx
git commit -m "feat: add wallet performance chart"
```

---

### Task 3: Refactor Withdraw Sheet To Single Screen

**Files:**
- Modify: `frontend/src/pages/wallet/WithdrawSheet.tsx`
- Test: `frontend/src/pages/wallet/WalletPage.test.tsx`

- [ ] **Step 1: Remove wizard state and stepper constants**

In `WithdrawSheet.tsx`, remove:

```ts
const STEPS = ["Amount", "Bank", "Review"] as const;
const [step, setStep] = useState(0);
const canContinue = step === 0 ? amountValid : step === 1 ? Boolean(selectedAccount) : true;
```

Also remove imports that become unused:

```ts
ArrowLeft,
Check,
```

Keep `Check` if you still use it for selected account rows.

- [ ] **Step 2: Add derived summary values**

Below `selectedAccount`, add:

```ts
const safeAmount = amountValid ? amountValue : 0;
const balanceAfter = Math.max(0, available - safeAmount);
const submitLabel = safeAmount > 0 ? `Withdraw ${vnd.format(safeAmount)} VND` : "Withdraw";
```

- [ ] **Step 3: Replace the header JSX with a non-stepper header**

Replace the sticky header block with:

```tsx
<div className="sticky top-0 z-10 border-b border-white/8 bg-turf-900/95 px-6 pb-4 pt-5 backdrop-blur">
  <div className="flex items-center justify-between">
    <div>
      <p className="font-data text-[10px] uppercase tracking-[0.18em] text-gold-200">Manual payout review</p>
      <h2 className="mt-1 font-display text-xl font-medium text-ivory">Withdraw</h2>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="flex h-9 w-9 items-center justify-center rounded-full text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory"
    >
      <X size={18} />
    </button>
  </div>
</div>
```

- [ ] **Step 4: Replace the body with always-visible amount and destination sections**

Replace the contents of `<div className="flex-1 px-6 py-6">...</div>` with:

```tsx
<div className="flex-1 space-y-6 px-6 py-6">
  <section aria-labelledby="withdraw-amount-title">
    <div className="flex items-center justify-between">
      <label id="withdraw-amount-title" htmlFor="withdraw-sheet-amount" className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint">
        Amount to withdraw
      </label>
      <button
        type="button"
        onClick={() => setAmount(String(available))}
        disabled={available <= 0}
        className="font-data text-[11px] font-bold uppercase tracking-[0.14em] text-gold-300 hover:text-gold-200 disabled:opacity-40"
      >
        Max
      </button>
    </div>
    <div className="relative mt-2">
      <input
        id="withdraw-sheet-amount"
        aria-label="Amount to withdraw"
        autoFocus
        type="number"
        inputMode="numeric"
        min={0}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
        className="min-h-14 w-full rounded-xl border border-white/10 bg-turf-950 pl-4 pr-16 font-data text-2xl text-ivory placeholder:text-ivory-faint/60 focus:border-gold-400 focus:outline-none"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-data text-xs uppercase tracking-[0.16em] text-ivory-faint">
        VND
      </span>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2">
      {[0.25, 0.5, 1].map((ratio) => (
        <button
          key={ratio}
          type="button"
          onClick={() => setAmount(String(Math.floor(available * ratio)))}
          disabled={available <= 0}
          className="min-h-10 rounded-lg border border-white/10 bg-white/5 font-data text-xs font-bold text-ivory-dim hover:border-gold-400/50 hover:text-gold-200 disabled:opacity-40"
        >
          {Math.round(ratio * 100)}%
        </button>
      ))}
    </div>
    <p className="mt-2 font-data text-xs text-ivory-faint">
      Available to withdraw: {vnd.format(available)} VND
    </p>
    {amount && !amountValid ? (
      <p className="mt-2 text-sm font-semibold text-rose-300">
        {amountValue > available ? "Amount exceeds your available balance." : "Enter a valid amount."}
      </p>
    ) : null}
  </section>

  <section aria-labelledby="withdraw-destination-title" className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 id="withdraw-destination-title" className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint">
        Destination
      </h3>
      {accounts.length > 0 && !adding ? (
        <button type="button" onClick={() => setAdding(true)} className="text-sm font-semibold text-gold-300 hover:text-gold-200">
          Add account
        </button>
      ) : null}
    </div>

    {accounts.map((acc) => {
      const active = acc.id === selectedId;
      return (
        <div
          key={acc.id}
          className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
            active ? "border-gold-400/60 bg-gold-400/5" : "border-white/10 bg-turf-950 hover:border-white/20"
          }`}
        >
          <button
            type="button"
            onClick={() => setSelectedId(acc.id)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            aria-pressed={active}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-data text-[10px] font-bold text-white"
              style={{ backgroundColor: bankColor(acc.bankCode) }}
              aria-hidden="true"
            >
              {acc.bankCode}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ivory">{acc.bankName}</span>
              <span className="font-data text-xs text-ivory-faint">
                {mask(acc.accountNumber)} · {acc.accountHolder}
              </span>
            </span>
          </button>
          {active ? <Check size={16} className="shrink-0 text-gold-300" /> : null}
          <button
            type="button"
            onClick={() => handleRemove(acc.id)}
            aria-label={`Remove ${acc.bankName} account`}
            className="shrink-0 text-ivory-faint opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100"
          >
            <Trash2 size={15} />
          </button>
        </div>
      );
    })}

    {adding ? (
      <div className="space-y-3 rounded-xl border border-white/10 bg-turf-950 p-4">
        <BankSelect banks={BANKS} value={newBankCode} onChange={setNewBankCode} />
        <input
          type="text"
          inputMode="numeric"
          value={newAccount}
          onChange={(e) => setNewAccount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Account number"
          aria-label="Account number"
          className="min-h-11 w-full rounded-lg border border-white/10 bg-turf-900 px-4 font-data text-sm tracking-[0.08em] text-ivory placeholder:text-ivory-faint/70 focus:border-gold-400 focus:outline-none"
        />
        <input
          type="text"
          value={newHolder}
          onChange={(e) => setNewHolder(e.target.value.toUpperCase())}
          placeholder="ACCOUNT HOLDER"
          aria-label="Account holder"
          className="min-h-11 w-full rounded-lg border border-white/10 bg-turf-900 px-4 text-sm uppercase text-ivory placeholder:text-ivory-faint/70 focus:border-gold-400 focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveBank}
            disabled={savingBank}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-sm bg-gold-400 px-4 text-[12px] font-bold uppercase tracking-[0.12em] text-turf-950 hover:bg-gold-300 disabled:opacity-50"
          >
            {savingBank ? "Saving..." : "Save account"}
          </button>
          {accounts.length > 0 ? (
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-white/15 px-4 text-[12px] font-bold uppercase tracking-[0.12em] text-ivory-dim hover:text-ivory"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    ) : null}
  </section>

  {error ? <p className="text-sm font-semibold text-rose-300" role="alert">{error}</p> : null}
</div>
```

- [ ] **Step 5: Replace footer navigation with sticky live summary**

Replace the footer block with:

```tsx
<div className="sticky bottom-0 space-y-4 border-t border-white/8 bg-turf-900/95 px-6 py-4 backdrop-blur">
  <dl className="grid grid-cols-2 gap-3 text-sm">
    <div>
      <dt className="text-ivory-faint">Amount</dt>
      <dd className="mt-1 font-data font-bold text-ivory">{vnd.format(safeAmount)} VND</dd>
    </div>
    <div className="text-right">
      <dt className="text-ivory-faint">Fee</dt>
      <dd className="mt-1 font-semibold text-emerald-soft">Free</dd>
    </div>
    <div>
      <dt className="text-ivory-faint">You receive</dt>
      <dd className="mt-1 font-data font-bold text-gold-300">{vnd.format(safeAmount)} VND</dd>
    </div>
    <div className="text-right">
      <dt className="text-ivory-faint">Balance after</dt>
      <dd className="mt-1 font-data font-bold text-ivory">{vnd.format(balanceAfter)} VND</dd>
    </div>
  </dl>
  <p className="flex items-start gap-2 text-[12px] leading-relaxed text-ivory-faint">
    <ShieldCheck size={15} className="mt-px shrink-0 text-emerald-soft" />
    Reviewed manually before payout, usually 1-2 business days. The amount is held from your available balance until paid or rejected.
  </p>
  <button
    type="button"
    disabled={submitting || !amountValid || !selectedAccount}
    onClick={handleSubmit}
    className="inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-gold-400 px-5 text-[13px] font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ivory-faint"
  >
    {submitting ? "Submitting..." : submitLabel}
  </button>
</div>
```

- [ ] **Step 6: Run wallet tests**

Run from `frontend/`:

```bash
node node_modules/vitest/vitest.mjs run src/pages/wallet
```

Expected: withdraw-specific assertions may still fail until `WalletPage.tsx` opens the sheet.

- [ ] **Step 7: Commit the withdraw sheet refactor**

```bash
git add frontend/src/pages/wallet/WithdrawSheet.tsx
git commit -m "feat: simplify wallet withdrawal sheet"
```

---

### Task 4: Rewrite Wallet Page Around Summary, Chart, And Fintech Layout

**Files:**
- Modify: `frontend/src/pages/wallet/WalletPage.tsx`
- Test: `frontend/src/pages/wallet/WalletPage.test.tsx`

- [ ] **Step 1: Update imports**

Remove unused imports tied to the old inline withdraw form:

```ts
FormEvent,
Link,
Landmark,
ShieldCheck,
Trophy,
```

Add:

```ts
BarChart3,
CircleDollarSign,
CreditCard,
Filter,
Send,
XCircle,
```

Import the new components:

```ts
import { CountUp } from "../../components/client/CountUp";
import { PerformanceChart } from "./PerformanceChart";
import { WithdrawSheet } from "./WithdrawSheet";
```

Add `WalletSummary` to the type imports.

- [ ] **Step 2: Add constants and helpers**

Add near the existing constants:

```ts
const CUSTOM_TOPUP_MAX = 50000000;

type LedgerFilter = "ALL" | "TOPUPS" | "PREDICTIONS" | "PAYOUTS" | "WITHDRAWALS";

const LEDGER_FILTERS: Array<{ key: LedgerFilter; label: string; types?: WalletTransactionType[] }> = [
  { key: "ALL", label: "All" },
  { key: "TOPUPS", label: "Top-ups", types: ["TOPUP"] },
  { key: "PREDICTIONS", label: "Predictions", types: ["BET_PLACED", "BET_REFUND"] },
  { key: "PAYOUTS", label: "Payouts", types: ["BET_PAYOUT"] },
  { key: "WITHDRAWALS", label: "Withdrawals", types: ["WITHDRAWAL_HOLD", "WITHDRAWAL_REFUND"] },
];
```

Extend `WITHDRAWAL_BADGE` with:

```ts
CANCELLED: {
  label: "Cancelled",
  className: "border-white/15 bg-white/5 text-ivory-dim",
},
```

Add:

```ts
function formatVndPlain(amount: number) {
  return `${vnd.format(Math.max(0, amount))} VND`;
}

function maskBankInfo(value: string) {
  return value.replace(/\b(\d{2})\d+(\d{4})\b/g, "$1****$2");
}
```

- [ ] **Step 3: Replace page state for summary, sheet, custom top-up, filter, and cancelling**

Add:

```ts
const [summary, setSummary] = useState<WalletSummary | null>(null);
const [withdrawOpen, setWithdrawOpen] = useState(false);
const [customTopup, setCustomTopup] = useState("");
const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>("ALL");
const [cancellingWithdrawalId, setCancellingWithdrawalId] = useState<number | null>(null);
```

Remove:

```ts
const [withdrawAmount, setWithdrawAmount] = useState("");
const [withdrawBank, setWithdrawBank] = useState("");
const [withdrawing, setWithdrawing] = useState(false);
const [withdrawError, setWithdrawError] = useState<string | null>(null);
```

- [ ] **Step 4: Load summary in refresh**

Change `refresh` to:

```ts
const refresh = useCallback(async () => {
  const [walletData, summaryData, txData, wdData] = await Promise.all([
    walletApi.getMyWallet(),
    walletApi.getSummary(),
    walletApi.getMyTransactions(),
    walletApi.getMyWithdrawals(),
  ]);
  setWallet(walletData);
  setSummary(summaryData);
  setTransactions(txData);
  setWithdrawals(wdData);
}, []);
```

- [ ] **Step 5: Add derived values**

Replace `walletSummary` with:

```ts
const effectiveSummary = summary ?? {
  balance: wallet?.balance ?? 0,
  status: wallet?.status ?? "ACTIVE",
  inPlay: 0,
  pendingWithdrawal: 0,
};
const walletLocked = effectiveSummary.status === "LOCKED";
const availableToWithdraw = Math.max(
  0,
  effectiveSummary.balance - effectiveSummary.inPlay - effectiveSummary.pendingWithdrawal,
);
const activeFilter = LEDGER_FILTERS.find((item) => item.key === ledgerFilter) ?? LEDGER_FILTERS[0];
const filteredTransactions = activeFilter.types
  ? transactions.filter((tx) => activeFilter.types?.includes(tx.type))
  : transactions;
const visibleTransactions = filteredTransactions.slice(0, 25);
```

- [ ] **Step 6: Replace withdraw submit handler with cancel and custom top-up handlers**

Delete `handleWithdraw`.

Add:

```ts
async function handleCustomTopUp(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const amount = Number(customTopup);
  if (!Number.isFinite(amount) || amount <= 0 || amount > CUSTOM_TOPUP_MAX) {
    setTopupError(`Enter an amount from 1 to ${vnd.format(CUSTOM_TOPUP_MAX)} VND.`);
    return;
  }
  await handleTopUp(Math.floor(amount));
}

async function handleCancelWithdrawal(id: number) {
  setCancellingWithdrawalId(id);
  try {
    await walletApi.cancelWithdrawal(id);
    await refresh();
  } catch (err) {
    console.error("Withdrawal cancel failed.", err);
  } finally {
    setCancellingWithdrawalId(null);
  }
}
```

- [ ] **Step 7: Replace hero with slim balance hero**

Use this structure for the first top section:

```tsx
<section
  aria-labelledby="wallet-balance-title"
  className="relative overflow-hidden rounded-lg border border-white/10 bg-[#061a15] p-6 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.95)] sm:p-8"
>
  <img src={raceHero} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-12" />
  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,15,12,0.96),rgba(3,15,12,0.84)_60%,rgba(3,15,12,0.6))]" />
  <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <Eyebrow tone="gold">Available balance</Eyebrow>
      <h1 id="wallet-balance-title" className="mt-4 text-2xl font-black text-ivory">
        Available balance
      </h1>
      {loading ? (
        <LoadingLine className="mt-5 h-14 w-64" />
      ) : (
        <p className="mt-4 font-data text-5xl font-black leading-none text-foil sm:text-6xl">
          <CountUp value={effectiveSummary.balance} format={(value) => vnd.format(value)} />
        </p>
      )}
      <p className="mt-2 font-data text-sm font-bold text-gold-300">VND wallet</p>
      <span className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
        walletLocked ? "border-rose-300/25 bg-rose-400/10 text-rose-200" : "border-emerald-soft/25 bg-emerald-soft/10 text-emerald-soft"
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full ${walletLocked ? "bg-rose-200" : "bg-emerald-soft"}`} aria-hidden="true" />
        {walletLocked ? "Locked" : "Active"}
      </span>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href="#add-money"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-gold-400 px-5 text-[13px] font-black uppercase tracking-[0.12em] text-turf-950 transition-colors hover:bg-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add money
      </a>
      <button
        type="button"
        onClick={() => setWithdrawOpen(true)}
        disabled={walletLocked || availableToWithdraw <= 0}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-gold-400/70 px-5 text-[13px] font-black uppercase tracking-[0.12em] text-gold-200 transition-colors hover:bg-gold-400 hover:text-turf-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        Withdraw
      </button>
    </div>
  </div>
</section>
```

- [ ] **Step 8: Replace overview cards with three money-state tiles**

Render after the hero:

```tsx
<section aria-label="Wallet money states" className="grid gap-3 sm:grid-cols-3">
  {[
    { label: "Available", value: availableToWithdraw, caption: "Ready to withdraw", icon: CircleDollarSign, tone: "text-emerald-soft" },
    { label: "In play", value: effectiveSummary.inPlay, caption: "Locked in open predictions", icon: BarChart3, tone: "text-gold-300" },
    { label: "Pending withdrawal", value: effectiveSummary.pendingWithdrawal, caption: "Awaiting payout", icon: Clock, tone: "text-sky-200" },
  ].map((item) => {
    const Icon = item.icon;
    return (
      <div key={item.label} className="rounded-lg border border-white/10 bg-[#061a15] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ivory-dim">{item.label}</p>
            <p className="mt-1 text-xs text-ivory-faint">{item.caption}</p>
          </div>
          <span className={`grid h-10 w-10 place-items-center rounded-sm bg-white/5 ${item.tone}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        {loading ? <LoadingLine className="mt-4 h-8 w-36" /> : <p className={`mt-4 font-data text-2xl font-black ${item.tone}`}>{formatVndPlain(item.value)}</p>}
      </div>
    );
  })}
</section>
```

- [ ] **Step 9: Render PerformanceChart**

Add:

```tsx
<PerformanceChart transactions={transactions} loading={loading} />
```

- [ ] **Step 10: Replace quick top-up with presets plus custom form**

Use the old preset buttons but put the section under:

```tsx
<section id="add-money" aria-labelledby="add-money-title" className="rounded-lg border border-white/10 bg-[#061a15] p-4 sm:p-5">
  <div className="flex items-center gap-3">
    <span className="grid h-10 w-10 place-items-center rounded-sm border border-gold-400/30 bg-gold-400/10 text-gold-300">
      <CreditCard className="h-5 w-5" aria-hidden="true" />
    </span>
    <div>
      <h2 id="add-money-title" className="text-lg font-black text-ivory">Add money</h2>
      <p className="text-sm text-ivory-dim">VNPay presets or a custom amount.</p>
    </div>
  </div>
  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {TOPUP_PRESETS.map((amount) => (
      <button
        key={amount}
        type="button"
        aria-label={`Top up ${vnd.format(amount)} VND`}
        disabled={walletLocked || toppingUp !== null}
        onClick={() => handleTopUp(amount)}
        className="group min-h-[92px] rounded-lg border border-white/10 bg-[#04120f] p-4 text-left transition-colors hover:border-gold-400 hover:bg-gold-400 hover:text-turf-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-white/5 text-gold-300 group-hover:bg-turf-950 group-hover:text-gold-200">
            <Plus className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-data text-[11px] uppercase tracking-[0.14em] text-ivory-faint group-hover:text-turf-800">
            VNPay
          </span>
        </span>
        <span className="mt-4 block font-data text-lg font-black text-ivory group-hover:text-turf-950">
          {toppingUp === amount ? "Redirecting..." : `${vnd.format(amount)} VND`}
        </span>
      </button>
    ))}
  </div>
  <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleCustomTopUp}>
    <label className="sr-only" htmlFor="custom-topup">Custom top-up amount</label>
    <input
      id="custom-topup"
      aria-label="Custom top-up amount"
      type="number"
      inputMode="numeric"
      min={1}
      max={CUSTOM_TOPUP_MAX}
      value={customTopup}
      onChange={(event) => setCustomTopup(event.target.value)}
      placeholder="Custom amount"
      className="min-h-11 flex-1 rounded-sm border border-white/15 bg-[#030f0c] px-4 font-data text-sm font-semibold text-ivory outline-none placeholder:text-ivory-faint focus:border-gold-400 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold-400"
      disabled={walletLocked || toppingUp !== null}
    />
    <button
      type="submit"
      disabled={walletLocked || toppingUp !== null}
      className="inline-flex min-h-11 items-center justify-center rounded-sm border border-gold-400 px-5 text-[13px] font-black uppercase tracking-[0.12em] text-gold-200 transition-colors hover:bg-gold-400 hover:text-turf-950 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Top up
    </button>
  </form>
</section>
```

- [ ] **Step 11: Add ledger filter chips and use filtered rows**

In the ledger header, add:

```tsx
<div className="flex flex-wrap gap-2" aria-label="Ledger filters">
  {LEDGER_FILTERS.map((item) => (
    <button
      key={item.key}
      type="button"
      onClick={() => setLedgerFilter(item.key)}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold ${
        ledgerFilter === item.key ? "border-gold-400 bg-gold-400 text-turf-950" : "border-white/10 bg-white/5 text-ivory-dim hover:text-ivory"
      }`}
    >
      <Filter className="h-3.5 w-3.5" aria-hidden="true" />
      {item.label}
    </button>
  ))}
</div>
```

Change the table label to:

```tsx
<table className="w-full min-w-[760px] text-left text-sm" aria-label="Wallet ledger">
```

Render `visibleTransactions.map(...)` instead of `transactions.map(...)`.

- [ ] **Step 12: Replace right rail with payout queue and compact guardrail**

Keep a right rail if desired, but remove the old inline withdrawal form. In payout queue rows, add cancel/timeline:

```tsx
{item.status === "REQUESTED" ? (
  <button
    type="button"
    onClick={() => handleCancelWithdrawal(item.id)}
    disabled={cancellingWithdrawalId === item.id}
    aria-label={`Cancel withdrawal ${item.id}`}
    className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-sm border border-white/10 px-3 text-xs font-bold text-ivory-dim hover:border-rose-300/40 hover:text-rose-200 disabled:opacity-50"
  >
    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
    {cancellingWithdrawalId === item.id ? "Cancelling..." : "Cancel"}
  </button>
) : null}
<ol className="mt-4 space-y-2 border-l border-white/10 pl-3 text-xs text-ivory-faint">
  <li>Requested {formatDateTime(item.requestedAt)}</li>
  {item.reviewedAt ? <li>{item.status === "CANCELLED" ? "Cancelled" : "Reviewed"} {formatDateTime(item.reviewedAt)}</li> : null}
  {item.paidAt ? <li>Paid {formatDateTime(item.paidAt)}</li> : null}
</ol>
```

Use `maskBankInfo(item.bankInfo)` in the row copy.

- [ ] **Step 13: Mount WithdrawSheet at the page root**

Before `<ClientFooter />`, add:

```tsx
<WithdrawSheet
  open={withdrawOpen}
  available={availableToWithdraw}
  onClose={() => setWithdrawOpen(false)}
  onSubmitted={refresh}
/>
```

- [ ] **Step 14: Run wallet tests**

Run from `frontend/`:

```bash
node node_modules/vitest/vitest.mjs run src/pages/wallet
```

Expected: PASS or only small accessible-name/text mismatches to resolve.

- [ ] **Step 15: Commit page redesign**

```bash
git add frontend/src/pages/wallet/WalletPage.tsx
git commit -m "feat: redesign wallet page"
```

---

### Task 5: Polish Tests And Type-Check

**Files:**
- Modify if needed: `frontend/src/pages/wallet/WalletPage.test.tsx`
- Modify if needed: `frontend/src/pages/wallet/WalletPage.tsx`
- Modify if needed: `frontend/src/pages/wallet/WithdrawSheet.tsx`
- Modify if needed: `frontend/src/pages/wallet/PerformanceChart.tsx`

- [ ] **Step 1: Run isolated wallet tests**

Run from `frontend/`:

```bash
node node_modules/vitest/vitest.mjs run src/pages/wallet
```

Expected: PASS.

- [ ] **Step 2: Run frontend type-check**

Run from repo root:

```bash
node frontend/node_modules/typescript/bin/tsc -b frontend --force
```

Expected: exits `0`.

- [ ] **Step 3: Search for banned visible vocabulary in wallet files**

Run from repo root:

```bash
rg -n "Bet|Betting|Wager|Odds|Stake|Gambling|P&L|Profit|Loss|Virtual points" frontend/src/pages/wallet frontend/src/api/walletApi.ts frontend/src/types/wallet.ts
```

Expected: no visible-copy hits. Type names such as `BET_PLACED` may appear in code; that is acceptable if not rendered directly. If `Virtual points` appears in UI, replace it with `Real funds` or `Manual payout review`.

- [ ] **Step 4: Run a broader frontend test pass if time allows**

Run from `frontend/`:

```bash
node node_modules/vitest/vitest.mjs run src/pages/wallet --maxWorkers=2 --minWorkers=1
```

Expected: PASS.

- [ ] **Step 5: Commit verification fixes**

```bash
git add frontend/src/pages/wallet
git commit -m "test: verify wallet fintech redesign"
```

---

## Self-Review

- Spec coverage:
  - Money states from `getSummary`: Task 4.
  - Available-to-withdraw cap: Tasks 3 and 4.
  - Performance equity curve: Task 2, rendered in Task 4.
  - Single-screen withdraw: Task 3.
  - Saved accounts: Task 3 via existing `BankSelect`, `getBankAccounts`, `addBankAccount`, `deleteBankAccount`.
  - Cancel and `CANCELLED` status: Task 4.
  - Custom top-up: Task 4.
  - Tests and type-check: Tasks 1 and 5.
- Placeholder scan: no red-flag markers intentionally left.
- Type consistency:
  - `WalletSummary`, `WalletTransaction`, `WalletTransactionType`, `WithdrawalStatus`, and API method names match `frontend/src/types/wallet.ts` and `frontend/src/api/walletApi.ts`.
  - `WithdrawSheet` props remain `open`, `available`, `onClose`, `onSubmitted`.
