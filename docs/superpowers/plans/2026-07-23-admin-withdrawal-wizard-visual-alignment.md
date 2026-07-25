# Admin Withdrawal Wizard Visual Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the admin withdrawal modal into a minimal three-stage wizard and restyle the payment workspace so it belongs to the existing admin interface.

**Architecture:** Derive the wizard stage directly from `AdminWithdrawalReview.status`; do not introduce a parallel client workflow. Keep decision, payment, and completion behavior in their existing focused components, add presentation-only stepper and compact-summary components, and give payment primitives a shared admin-light visual treatment without changing their API or business rules.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, qrcode.react, Tesseract.js.

---

## File map

- Create `frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.tsx`: map server status to an accessible three-stage indicator.
- Create `frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx`: verify active, completed, and terminal outcome states.
- Create `frontend/src/pages/admin/withdrawals/WithdrawalCompactSummary.tsx`: show essential payout facts and disclose read-only review context.
- Create `frontend/src/pages/admin/withdrawals/WithdrawalCompactSummary.test.tsx`: verify minimal default content and disclosure behavior.
- Modify `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.tsx`: select wizard content from withdrawal status and remove the always-visible review/payment stacking.
- Modify `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx`: cover the requested-to-approved transition, summary collapse, completed stage, and dismissal guard.
- Modify payment files under `frontend/src/pages/admin/withdrawals/payment/`: replace the user dark-green theme with the admin light-neutral theme while preserving orchestration.
- Modify `frontend/src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx`: verify clean VietQR branding and payment behavior after restyling.

### Task 1: Add the status-driven wizard stepper

**Files:**
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.tsx`
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx`

- [ ] **Step 1: Write failing status-mapping tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WithdrawalWizardStepper } from "./WithdrawalWizardStepper";

it.each([
  ["REQUESTED", "Review"],
  ["APPROVED", "Transfer & receipt"],
  ["PAID", "Completed"],
  ["REJECTED", "Completed"],
  ["CANCELLED", "Completed"],
] as const)("marks %s on the expected wizard stage", (status, activeLabel) => {
  render(<WithdrawalWizardStepper status={status} />);
  expect(screen.getByRole("list", { name: /withdrawal progress/i })).toBeInTheDocument();
  expect(screen.getByText(activeLabel).closest("li")).toHaveAttribute("aria-current", "step");
});
```

- [ ] **Step 2: Run the test and verify it fails because the component does not exist**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx`

Expected: FAIL with an unresolved `WithdrawalWizardStepper` import.

- [ ] **Step 3: Implement a presentation-only stepper**

```tsx
import type { WithdrawalStatus } from "../../../types/wallet";

const STEPS = ["Review", "Transfer & receipt", "Completed"] as const;

function activeIndex(status: WithdrawalStatus) {
  if (status === "REQUESTED") return 0;
  if (status === "APPROVED") return 1;
  return 2;
}

export function WithdrawalWizardStepper({ status }: { status: WithdrawalStatus }) {
  const current = activeIndex(status);
  return (
    <nav aria-label="Withdrawal progress" className="border-b border-slate-200 bg-white px-5 sm:px-7">
      <ol role="list" className="mx-auto flex max-w-3xl items-stretch">
        {STEPS.map((label, index) => (
          <li key={label} aria-current={index === current ? "step" : undefined} className="relative flex min-h-16 flex-1 items-center gap-2 px-2 sm:px-4">
            <span className={index <= current ? "text-[#070f4f]" : "text-slate-400"}>{index < current ? "✓" : index + 1}</span>
            <span className={`text-xs font-bold sm:text-sm ${index === current ? "text-[#070f4f]" : "text-slate-500"}`}>{label}</span>
            {index === current ? <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#070f4f]" /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

Use no pills, decorative gradients, shadows, or oversized numbered markers.

- [ ] **Step 4: Run the focused test**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.tsx frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx
git commit -m "feat: add withdrawal wizard progress"
```

### Task 2: Add the compact approved-withdrawal summary

**Files:**
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalCompactSummary.tsx`
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalCompactSummary.test.tsx`

- [ ] **Step 1: Write the failing disclosure test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AdminWithdrawalReview } from "../../../types/wallet";
import { WithdrawalCompactSummary } from "./WithdrawalCompactSummary";

const approvedReview: AdminWithdrawalReview = {
  id: 22,
  amount: 420000,
  status: "APPROVED",
  requestedAt: "2026-07-21T12:00:00",
  reviewedAt: "2026-07-21T12:05:00",
  paidAt: null,
  user: { id: 7, name: "Mai Tran", email: "mai@example.com", status: "ACTIVE", createdAt: "2026-01-01T00:00:00" },
  wallet: { balance: 900000, status: "ACTIVE" },
  destination: { bankCode: "VCB", bankName: "Vietcombank", accountHolder: "MAI TRAN", accountNumber: "0123456789", displayText: "MAI TRAN · 0123456789 · Vietcombank (VCB)", legacy: false },
  risk: { level: "HIGH", findings: [{ code: "SHARED", severity: "HIGH", title: "Shared destination", explanation: "Shared by users.", evidence: "2 users", suggestedCheck: "Verify ownership." }], contextMarkers: [] },
  aggregates: { requestCount: 2, totalRequested: 500000, paidCount: 0, totalPaid: 0, rejectedOrCancelledCount: 0 },
  recentWithdrawals: [],
  actions: [],
  paymentInstruction: { available: true, unavailableReason: null, payload: "000201010212...CRC", transferContent: "WD000022", bankCode: "VCB", bankName: "Vietcombank", accountHolder: "MAI TRAN", accountNumber: "0123456789", amount: 420000 },
  paymentEvidence: null,
};

it("keeps essential payout facts visible and review evidence collapsed", () => {
  render(<WithdrawalCompactSummary review={approvedReview} />);
  expect(screen.getByText("420,000 VND")).toBeInTheDocument();
  expect(screen.getByText(/vietcombank/i)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /risk evidence/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /view review details/i }));
  expect(screen.getByRole("heading", { name: /risk evidence/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /hide review details/i })).toHaveAttribute("aria-expanded", "true");
});
```

- [ ] **Step 2: Run the test and verify the missing component failure**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalCompactSummary.test.tsx`

Expected: FAIL with an unresolved component import.

- [ ] **Step 3: Implement the summary as one flat section**

The component must:

```tsx
const [expanded, setExpanded] = useState(false);

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-32">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-black text-slate-900">{value}</dd>
    </div>
  );
}

return (
  <section aria-labelledby="payout-summary-heading" className="border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">
      <div className="min-w-44 flex-1">
        <h3 id="payout-summary-heading" className="font-black text-[#070f4f]">{review.user.name}</h3>
        <p className="text-xs text-slate-500">WD-{String(review.id).padStart(6, "0")}</p>
      </div>
      <Fact label="Amount" value={formatVnd(review.amount)} />
      <Fact label="Destination" value={`${review.destination.bankName} · ${review.destination.accountNumber}`} />
      <Fact label="Risk" value={riskPresentation[review.risk.level].label} />
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="min-h-11 text-sm font-black text-[#070f4f] underline-offset-4 hover:underline">
        {expanded ? "Hide review details" : "View review details"}
      </button>
    </div>
    {expanded ? <div className="grid gap-5 border-t border-slate-200 bg-[#fafaf8] p-5 lg:grid-cols-[minmax(0,1fr)_320px]"><WithdrawalRiskPanel risk={review.risk} /><WithdrawalTimeline actions={review.actions} /></div> : null}
  </section>
);
```

Do not nest additional decorative cards inside the summary. Reuse existing risk and timeline components only inside the disclosed region.

- [ ] **Step 4: Run the focused test**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalCompactSummary.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/pages/admin/withdrawals/WithdrawalCompactSummary.tsx frontend/src/pages/admin/withdrawals/WithdrawalCompactSummary.test.tsx
git commit -m "feat: add compact withdrawal summary"
```

### Task 3: Restyle payment primitives for the admin surface

**Files:**
- Modify: `frontend/src/pages/admin/withdrawals/payment/VietQrCard.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/payment/ReceiptUploader.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/payment/ReceiptOcrResult.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx`

- [ ] **Step 1: Add failing semantic assertions for the new payment surface**

```tsx
it("presents a clean VietQR rail inside the admin payment workspace", () => {
  render(<WithdrawalPaymentStep review={approvedReview} onPaid={vi.fn()} onStateChange={vi.fn()} />);
  expect(screen.getByText("VietQR · NAPAS 247")).toBeInTheDocument();
  expect(screen.getByLabelText(/vietqr for withdrawal 123/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /transfer details/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /receipt and confirmation/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the payment test and verify the new copy is absent**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx`

Expected: FAIL because the new rail and headings are not rendered.

- [ ] **Step 3: Replace the dark user-theme styling with restrained admin styling**

Use this visual contract consistently:

```tsx
// Section
className="border border-slate-200 bg-white p-5"

// Primary heading
className="text-lg font-black text-[#070f4f]"

// Body copy
className="text-sm leading-6 text-slate-600"

// Input
className="min-h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f]"

// Primary action
className="min-h-12 bg-[#070f4f] px-5 text-sm font-black text-white hover:bg-[#111d6b] disabled:bg-slate-300"

// Destructive disclosure/action
className="text-[#9f1239] hover:bg-rose-50"
```

`VietQrCard` must render `VietQR · NAPAS 247` outside the canvas. Do not overlay any logo or image inside `QRCodeCanvas`. Keep the QR on a plain white area with enough margin.

`WithdrawalPaymentStep` must be one responsive two-column layout, not a dark wrapper containing multiple dark cards. Keep the rejection path as a quiet bordered disclosure below the main columns.

- [ ] **Step 4: Run payment and OCR tests**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx src/pages/admin/withdrawals/payment/receiptFieldExtractor.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/pages/admin/withdrawals/payment
git commit -m "style: align withdrawal payment with admin theme"
```

### Task 4: Integrate the wizard into the modal

**Files:**
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx`

- [ ] **Step 1: Add failing modal lifecycle tests**

```tsx
it("collapses approved review context and activates payment", async () => {
  vi.mocked(adminWalletApi.getReview).mockResolvedValue(approvedReview);
  render(<WithdrawalReviewModal id={22} onClose={vi.fn()} onUpdated={vi.fn()} />);

  const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
  expect(within(dialog).getByText("Transfer & receipt").closest("li")).toHaveAttribute("aria-current", "step");
  expect(within(dialog).getByRole("button", { name: /view review details/i })).toBeInTheDocument();
  expect(within(dialog).queryByRole("heading", { name: /risk evidence/i })).not.toBeInTheDocument();
  expect(within(dialog).getByRole("heading", { name: /receipt and confirmation/i })).toBeInTheDocument();
});

it("shows the completed step for a paid request", async () => {
  const paidReview: AdminWithdrawalReview = {
    ...approvedReview,
    status: "PAID",
    paidAt: "2026-07-23T14:31:00",
    paymentInstruction: null,
    paymentEvidence: {
      transferReference: "FT-20260723-001",
      receiptUrl: "/api/v1/files/private/receipt.png",
      checksum: "abc123",
      paidAt: "2026-07-23T14:31:00",
    },
  };
  vi.mocked(adminWalletApi.getReview).mockResolvedValue(paidReview);
  render(<WithdrawalReviewModal id={22} onClose={vi.fn()} onUpdated={vi.fn()} />);
  const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
  expect(within(dialog).getByText("Completed").closest("li")).toHaveAttribute("aria-current", "step");
  expect(within(dialog).getByText(/payment complete/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run modal tests and verify the wizard assertions fail**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx`

Expected: FAIL because the stepper and compact approved layout are not integrated.

- [ ] **Step 3: Render one stage at a time from server status**

Use this stage selection in `ReviewWorkspace`:

```tsx
<WithdrawalWizardStepper status={review.status} />
{review.status === "REQUESTED" ? (
  <RequestedReviewWorkspace review={review} onUpdated={onUpdated} onConflict={onConflict} onStateChange={onStateChange} />
) : review.status === "APPROVED" ? (
  <div className="space-y-5 p-5 sm:p-7">
    <WithdrawalCompactSummary review={review} />
    <WithdrawalPaymentStep review={review} onPaid={onUpdated} onStateChange={onStateChange} onConflict={onConflict} />
  </div>
) : (
  <CompletedWithdrawalWorkspace review={review} />
)}
```

`RequestedReviewWorkspace` is the current requested-state overview/risk/context/decision/timeline markup moved unchanged into a local function with these props:

```tsx
function RequestedReviewWorkspace({
  review,
  onUpdated,
  onConflict,
  onStateChange,
}: {
  review: AdminWithdrawalReview;
  onUpdated: (review: AdminWithdrawalReview) => void;
  onConflict: () => Promise<void>;
  onStateChange: (state: PaymentStepState) => void;
}) {
  return (
    <main className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]">
      <div className="space-y-6"><WithdrawalOverview review={review} /><WithdrawalRiskPanel risk={review.risk} /><UserContext review={review} /></div>
      <aside className="space-y-6"><WithdrawalDecisionPanel review={review} onUpdated={onUpdated} onConflict={onConflict} onStateChange={onStateChange} /><div className="border border-slate-200 bg-white p-5"><WithdrawalTimeline actions={review.actions} /></div></aside>
    </main>
  );
}
```

`CompletedWithdrawalWorkspace` wraps the existing terminal evidence panel without restoring editable controls:

```tsx
function CompletedWithdrawalWorkspace({ review }: { review: AdminWithdrawalReview }) {
  return (
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px]">
      <CompletedPanel review={review} />
      <div className="border border-slate-200 bg-white p-5"><WithdrawalTimeline actions={review.actions} /></div>
    </div>
  );
}
```

Remove the dark `bg-[#03130f]` payment wrapper and the duplicate approved-state “Next step” card. Keep dismissal guards and authoritative conflict reload unchanged.

- [ ] **Step 4: Run modal and payment tests**

Run: `cd frontend && node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/pages/admin/withdrawals
git commit -m "feat: present withdrawals as a guided wizard"
```

### Task 5: Verify quality and anti-slop constraints

**Files:**
- Modify only if a verification failure requires a focused fix.

- [ ] **Step 1: Run the focused withdrawal suite**

Run:

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/admin/AdminWithdrawalsPage.test.tsx src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx src/pages/admin/withdrawals/WithdrawalCompactSummary.test.tsx src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx src/pages/admin/withdrawals/payment/receiptFieldExtractor.test.ts --reporter=dot
```

Expected: all focused files pass.

- [ ] **Step 2: Run production compilation**

Run: `cd frontend && npm run build`

Expected: TypeScript and Vite build exit with code 0.

- [ ] **Step 3: Run the complete frontend suite serially**

Run: `cd frontend && npm test -- --run --reporter=dot --maxWorkers=1 --testTimeout=15000`

Expected: all test files pass.

- [ ] **Step 4: Perform the visual restraint audit**

Confirm all of the following directly in the rendered modal or component markup:

- only one active step is emphasized;
- approved review context is collapsed by default;
- payment has no green/dark user-theme container;
- QR has no center overlay;
- no nested decorative cards, gradients, glass effects, oversized rounding, or repeated uppercase kickers were introduced;
- red is limited to destructive/error states and green to success;
- controls remain at least 44 pixels and keyboard focus remains visible;
- mobile layout reads in the order summary, QR, receipt, confirmation, rejection.

- [ ] **Step 5: Commit any verification-only fixes**

```powershell
git add frontend
git commit -m "fix: polish withdrawal wizard usability"
```

Skip this commit when verification requires no code changes.
