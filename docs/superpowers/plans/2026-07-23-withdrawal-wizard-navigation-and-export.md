# Withdrawal Wizard Navigation and Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the withdrawal wizard visually connected and safely reviewable after approval, add URL deep links into the protected modal, and reorganize Excel exports into Payment Queue, Paid Reconciliation, and masked Operations sheets.

**Architecture:** Keep `AdminWithdrawalReview.status` as the sole business-stage source and add only a modal-local inspection view. Preserve payment form state by keeping the approved payment workspace mounted while the read-only review is shown. Rework the existing Apache POI exporter through three focused sheet writers, reuse stored withdrawal/action evidence, and create optional admin hyperlinks from the existing `app.frontend-base-url` configuration.

**Tech Stack:** React 19, TypeScript, React Router 7, Tailwind CSS 4, Vitest/Testing Library, Spring Boot, Java, Apache POI SXSSF, JUnit 5.

---

## File map

### Wizard and modal

- Modify `frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.tsx` — connected rail visuals and completed-review inspection control.
- Modify `frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx` — authoritative-stage and inspection semantics.
- Modify `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.tsx` — local inspection view, read-only evidence workspace, payment-state preservation, and return action.
- Modify `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx` — review inspection, read-only controls, payment restoration, and terminal behavior.
- Modify `frontend/src/styles.css` — one restrained stage-panel entrance and reduced-motion fallback.

### Deep link

- Modify `frontend/src/pages/admin/AdminWithdrawalsPage.tsx` — synchronize `review=<id>` with the modal.
- Modify `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx` — direct modal opening and URL cleanup.

### Export preview

- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalExportPreviewResponse.java` — separate queue and paid counts.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalExportService.java` — calculate the new preview counts.
- Modify `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java` — preview response contract.
- Modify `frontend/src/types/wallet.ts` — mirror the preview response.
- Modify `frontend/src/pages/admin/withdrawals/WithdrawalExportDialog.tsx` — clear three-sheet preview and sensitive-data notice.
- Modify `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx` — preview behavior and copy.

### Workbook

- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/VietQrService.java` — expose the configured transfer content without duplicating its template.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalExportService.java` — write the three sheets, evidence metadata, styles, and optional links.
- Modify `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalExportServiceTest.java` — workbook structure, sensitive fields, evidence links, no images, injection safety, row limit, and audit.

No migration, new endpoint, or new role is required.

---

### Task 1: Turn the step indicator into a connected, inspectable progress rail

**Files:**
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.tsx`

- [ ] **Step 1: Write failing tests for safe Review inspection**

Replace the existing “no navigation controls” expectation and add explicit current-stage assertions:

```tsx
it("offers completed Review as an inspection control without changing the current stage", () => {
  const onInspectReview = vi.fn();
  render(
    <WithdrawalWizardStepper
      status="APPROVED"
      inspectingReview={false}
      onInspectReview={onInspectReview}
    />,
  );

  const progress = screen.getByRole("navigation", { name: /withdrawal progress/i });
  expect(within(progress).getByRole("listitem", { current: "step" }))
    .toHaveTextContent("Transfer & receipt");

  const review = within(progress).getByRole("button", { name: /view approved review/i });
  expect(review).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(review);
  expect(onInspectReview).toHaveBeenCalledOnce();
});

it("keeps Review static while it is the authoritative current stage", () => {
  render(<WithdrawalWizardStepper status="REQUESTED" />);
  const progress = screen.getByRole("navigation", { name: /withdrawal progress/i });
  expect(within(progress).queryByRole("button", { name: /review/i })).not.toBeInTheDocument();
});
```

Add `fireEvent` and `vi` to the test imports.

- [ ] **Step 2: Run the focused test and verify RED**

Run from `frontend`:

```powershell
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx --reporter=dot
```

Expected: FAIL because the component does not accept `onInspectReview` or render the Review button.

- [ ] **Step 3: Implement the inspection API and connected presentation**

Use this public interface:

```tsx
type WithdrawalWizardStepperProps = {
  status: WithdrawalStatus;
  inspectingReview?: boolean;
  inspectionDisabled?: boolean;
  onInspectReview?: () => void;
};
```

Keep `activeIndex(status)` unchanged. For the Review item, render a button only when `current > 0` and `onInspectReview` exists:

```tsx
const inspectableReview = index === 0 && current > 0 && Boolean(onInspectReview);

const node = complete ? (
  <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#070f4f] bg-white text-[#070f4f]">
    <Check className="h-4 w-4" strokeWidth={2.5} />
  </span>
) : (
  <span aria-hidden="true" className={`grid h-9 w-9 place-items-center rounded-full border-2 font-mono text-xs font-black ${
    active
      ? "border-[#070f4f] bg-[#070f4f] text-white"
      : "border-slate-300 bg-white text-slate-500"
  }`}>
    {index + 1}
  </span>
);
```

Wrap Review with:

```tsx
<button
  type="button"
  aria-label="View approved review"
  aria-pressed={inspectingReview}
  disabled={inspectionDisabled}
  onClick={onInspectReview}
  className="group flex min-h-11 flex-col items-center justify-center rounded-md px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#070f4f] disabled:cursor-not-allowed disabled:opacity-50"
>
  {node}
  <span className="mt-2 text-sm font-black text-[#070f4f] group-hover:underline">Review</span>
  <span className="mt-0.5 text-xs font-semibold text-slate-500">Approved</span>
</button>
```

Render static stages with the same node/label structure. Draw connectors as absolute 2 px lines behind the nodes; completed connectors use navy, future connectors use `slate-200`. Keep the navigation flat on white and do not add a shadow, gradient, or container rounding.

- [ ] **Step 4: Run the stepper tests and verify GREEN**

Run the command from Step 2.

Expected: all stepper tests PASS and exactly one list item retains `aria-current="step"`.

- [ ] **Step 5: Commit the stepper**

```powershell
git add frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.tsx frontend/src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx
git commit -m "feat: make withdrawal progress safely inspectable"
```

---

### Task 2: Add read-only Review inspection without losing payment input

**Files:**
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.tsx`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Write a failing approved-state inspection test**

Add this test using the existing `approvedReview` fixture:

```tsx
it("shows the approved review read-only and returns to the preserved payment workspace", async () => {
  vi.mocked(adminWalletApi.getReview).mockResolvedValue(approvedReview);
  render(<WithdrawalReviewModal id={22} onClose={vi.fn()} onUpdated={vi.fn()} />);

  const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
  const receipt = new File(["image"], "receipt.png", { type: "image/png" });
  fireEvent.change(within(dialog).getByLabelText(/receipt image/i), {
    target: { files: [receipt] },
  });

  fireEvent.click(within(dialog).getByRole("button", { name: /view approved review/i }));
  expect(within(dialog).getByRole("heading", { name: /approved review record/i })).toBeInTheDocument();
  expect(within(dialog).getByRole("heading", { name: /risk evidence/i })).toBeInTheDocument();
  expect(within(dialog).queryByRole("button", { name: /approve|reject withdrawal/i })).not.toBeInTheDocument();
  expect(within(dialog).queryByRole("heading", { name: /receipt and confirmation/i })).not.toBeVisible();

  fireEvent.click(within(dialog).getByRole("button", { name: /return to transfer/i }));
  expect(within(dialog).getByRole("heading", { name: /receipt and confirmation/i })).toBeVisible();
  expect(within(dialog).getByText("receipt.png")).toBeInTheDocument();
});
```

Import and mock the OCR factory so receipt selection remains deterministic:

```tsx
import { createReceiptOcr } from "./payment/receiptOcr";

vi.mock("./payment/receiptOcr", () => ({ createReceiptOcr: vi.fn() }));

beforeEach(() => {
  vi.mocked(createReceiptOcr).mockResolvedValue({
    recognize: vi.fn().mockResolvedValue({
      rawText: "Ma giao dich FT-20260723-001",
      referenceCandidates: [{ value: "FT-20260723-001", confidence: 0.92 }],
      amount: 420_000,
      transferContent: "WD000022",
      transactionTime: "23/07/2026 14:31",
      confidence: "HIGH",
    }),
    terminate: vi.fn().mockResolvedValue(undefined),
  });
});
```

After selecting the receipt, wait for `findByDisplayValue("FT-20260723-001")` before activating Review so the OCR busy state has completed.

- [ ] **Step 2: Run the modal test and verify RED**

Run from `frontend`:

```powershell
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx --reporter=dot
```

Expected: FAIL because the progress rail is not connected to a read-only panel.

- [ ] **Step 3: Add presentation-only viewed-step state**

In `WithdrawalReviewModal`, add:

```tsx
type ViewedStep = "AUTHORITATIVE" | "REVIEW";
const [viewedStep, setViewedStep] = useState<ViewedStep>("AUTHORITATIVE");
```

Reset it whenever the modal loads or receives an authoritative update:

```tsx
setReview(await adminWalletApi.getReview(id));
setViewedStep("AUTHORITATIVE");

const handleUpdated = useCallback((updated: AdminWithdrawalReview) => {
  setReview(updated);
  setViewedStep("AUTHORITATIVE");
  setWorkflow(IDLE_WORKFLOW);
  onUpdated();
}, [onUpdated]);
```

Pass the inspection intent to the stepper without altering `review.status`:

```tsx
<WithdrawalWizardStepper
  status={review.status}
  inspectingReview={viewedStep === "REVIEW"}
  inspectionDisabled={workflow.busy}
  onInspectReview={review.status === "REQUESTED" ? undefined : () => setViewedStep("REVIEW")}
/>
```

- [ ] **Step 4: Render a focused read-only workspace**

Add a local `ReadOnlyReviewWorkspace` that reuses existing modal evidence helpers:

```tsx
function ReadOnlyReviewWorkspace({
  review,
  returnLabel,
  onReturn,
}: {
  review: AdminWithdrawalReview;
  returnLabel: string;
  onReturn: () => void;
}) {
  return (
    <main className="withdrawal-stage-panel p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-[#070f4f]">Approved review record</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            This is the evidence recorded at approval. The decision is read-only.
          </p>
        </div>
        <button type="button" onClick={onReturn} className="inline-flex min-h-11 items-center justify-center border border-[#070f4f] px-4 text-sm font-black text-[#070f4f] hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f]">
          {returnLabel}
        </button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.75fr)]">
        <div className="space-y-6">
          <WithdrawalOverview review={review} />
          <WithdrawalRiskPanel risk={review.risk} />
          <UserContext review={review} />
        </div>
        <div className="border border-slate-200 bg-white p-5">
          <WithdrawalTimeline actions={review.actions} />
        </div>
      </div>
    </main>
  );
}
```

For `APPROVED`, keep the payment workspace mounted and toggle the HTML `hidden` attribute so receipt/OCR state survives:

```tsx
<div hidden={viewedStep === "REVIEW"}>
  <ApprovedPaymentWorkspace ... />
</div>
{viewedStep === "REVIEW" ? (
  <ReadOnlyReviewWorkspace review={review} returnLabel="Return to transfer" onReturn={returnToAuthoritative} />
) : null}
```

For terminal states, conditionally swap `CompletedWithdrawalWorkspace` and the read-only workspace; both are immutable.

- [ ] **Step 5: Add restrained stage motion**

Append to `frontend/src/styles.css`:

```css
@keyframes withdrawal-stage-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.withdrawal-stage-panel {
  animation: withdrawal-stage-in 160ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .withdrawal-stage-panel { animation: none; }
}
```

Do not animate the modal size, QR, or receipt preview.

- [ ] **Step 6: Run modal, payment, and stepper tests**

Run from `frontend`:

```powershell
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx --reporter=dot
```

Expected: all focused tests PASS; selected receipt remains visible after returning to transfer.

- [ ] **Step 7: Commit the modal navigation**

```powershell
git add frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.tsx frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx frontend/src/styles.css
git commit -m "feat: add read-only withdrawal review navigation"
```

---

### Task 3: Deep-link Excel users into the protected review modal

**Files:**
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx`
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.tsx`

- [ ] **Step 1: Write failing deep-link tests**

Add a location probe in the test file:

```tsx
function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current location">{location.search}</output>;
}
```

Add this test:

```tsx
it("opens and closes a review from the review query parameter", async () => {
  render(
    <MemoryRouter initialEntries={["/admin/withdrawals?status=APPROVED&review=22"]}>
      <AdminWithdrawalsPage />
      <LocationProbe />
    </MemoryRouter>,
  );

  const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
  expect(adminWalletApi.getReview).toHaveBeenCalledWith(22);
  fireEvent.click(within(dialog).getByRole("button", { name: /close review/i }));
  await waitFor(() => expect(screen.getByLabelText("Current location")).toHaveTextContent("status=APPROVED"));
  expect(screen.getByLabelText("Current location")).not.toHaveTextContent("review=");
});
```

Import `useLocation` from React Router.

- [ ] **Step 2: Run the page test and verify RED**

Run from `frontend`:

```powershell
node node_modules/vitest/vitest.mjs run src/pages/admin/AdminWithdrawalsPage.test.tsx --reporter=dot
```

Expected: FAIL because `selectedId` ignores the URL.

- [ ] **Step 3: Make the query parameter authoritative for modal selection**

Add a strict parser:

```tsx
function parseReviewId(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
```

Derive `selectedId` from `searchParams`, and preserve all existing filters while opening or closing:

```tsx
const selectedId = useMemo(() => parseReviewId(searchParams.get("review")), [searchParams]);

const openReview = useCallback((id: number) => {
  const next = new URLSearchParams(searchParams);
  next.set("review", String(id));
  setSearchParams(next);
}, [searchParams, setSearchParams]);

const closeReview = useCallback(() => {
  const next = new URLSearchParams(searchParams);
  next.delete("review");
  setSearchParams(next, { replace: true });
}, [searchParams, setSearchParams]);
```

Remove local `selectedId` state, pass `openReview` to the table, and pass `closeReview` to the modal. When `patchFilters` writes normalized filters, copy the current `review` value into the resulting parameters if a modal is open.

```tsx
const patchFilters = useCallback((patch: Partial<WithdrawalAdminFilters>) => {
  const next = writeWithdrawalFilters({ ...filters, ...patch });
  const reviewId = searchParams.get("review");
  if (reviewId) next.set("review", reviewId);
  setSearchParams(next);
}, [filters, searchParams, setSearchParams]);
```

- [ ] **Step 4: Run the page tests and verify GREEN**

Run the command from Step 2.

Expected: all page tests PASS and invalid/non-positive review IDs do not open a modal.

- [ ] **Step 5: Commit the deep link**

```powershell
git add frontend/src/pages/admin/AdminWithdrawalsPage.tsx frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx
git commit -m "feat: deep link withdrawal reviews"
```

---

### Task 4: Expose and present three export populations

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalExportPreviewResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalExportService.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java`
- Modify: `frontend/src/types/wallet.ts`
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalExportDialog.tsx`
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx`

- [ ] **Step 1: Update backend preview contract test first**

In the existing export-preview integration assertion, replace `reconciliationRows` with explicit counts:

```java
.andExpect(jsonPath("$.operationsRows").value(1))
.andExpect(jsonPath("$.paymentQueueRows").value(1))
.andExpect(jsonPath("$.paidReconciliationRows").value(0))
.andExpect(jsonPath("$.containsSensitiveData").value(true));
```

- [ ] **Step 2: Run the integration test and verify RED**

Run from `backend`:

```powershell
./mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest test
```

Expected: FAIL because the response still contains `reconciliationRows`.

- [ ] **Step 3: Implement explicit preview counts**

Change the DTO to:

```java
public record WithdrawalExportPreviewResponse(
        int operationsRows,
        int paymentQueueRows,
        int paidReconciliationRows,
        boolean containsSensitiveData
) {
}
```

Calculate counts without new queries:

```java
int paymentQueueRows = (int) rows.stream()
        .filter(row -> row.status() == WithdrawalStatus.APPROVED)
        .count();
int paidReconciliationRows = (int) rows.stream()
        .filter(row -> row.status() == WithdrawalStatus.PAID)
        .count();
return new WithdrawalExportPreviewResponse(
        rows.size(),
        paymentQueueRows,
        paidReconciliationRows,
        paymentQueueRows + paidReconciliationRows > 0);
```

Keep the audit entity unchanged; record `paymentQueueRows + paidReconciliationRows` in its existing reconciliation count.

- [ ] **Step 4: Write the frontend RED expectations**

Update the mocked preview:

```tsx
vi.mocked(adminWalletApi.getExportPreview).mockResolvedValue({
  operationsRows: 2,
  paymentQueueRows: 1,
  paidReconciliationRows: 1,
  containsSensitiveData: true,
});
```

In the export test assert:

```tsx
expect(await screen.findByText("Payment Queue")).toBeInTheDocument();
expect(screen.getByText("Paid Reconciliation")).toBeInTheDocument();
expect(screen.getByText("Operations")).toBeInTheDocument();
expect(screen.getByText(/receipt images are not embedded/i)).toBeInTheDocument();
```

Run from `frontend`:

```powershell
node node_modules/vitest/vitest.mjs run src/pages/admin/AdminWithdrawalsPage.test.tsx --reporter=dot
```

Expected: FAIL because the TypeScript contract and dialog still describe two sheets.

- [ ] **Step 5: Update the frontend contract and dialog**

Use:

```ts
export interface WithdrawalExportPreview {
  operationsRows: number;
  paymentQueueRows: number;
  paidReconciliationRows: number;
  containsSensitiveData: boolean;
}
```

Refactor `WithdrawalExportDialog` into readable JSX rather than retaining the current one-line component. Present three flat rows in one bordered section:

```tsx
const sheets = [
  { name: "Payment Queue", rows: preview.paymentQueueRows, detail: "Approved · full destination" },
  { name: "Paid Reconciliation", rows: preview.paidReconciliationRows, detail: "Paid · evidence index" },
  { name: "Operations", rows: preview.operationsRows, detail: "All matched · masked destination" },
];
```

Each row uses a divider, name/detail on the left, and a tabular count on the right. Retain the acknowledgement checkbox and add: “Receipt images are not embedded; paid rows link back to protected admin review when configured.” Keep one navy download action, a 44 px close target, and the existing focus trap.

- [ ] **Step 6: Run backend and frontend focused tests**

Run both commands from Steps 2 and 4.

Expected: both focused suites PASS.

- [ ] **Step 7: Commit the preview contract**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalExportPreviewResponse.java backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalExportService.java backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java frontend/src/types/wallet.ts frontend/src/pages/admin/withdrawals/WithdrawalExportDialog.tsx frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx
git commit -m "feat: preview withdrawal export populations"
```

---

### Task 5: Build Payment Queue, Paid Reconciliation, and Operations sheets

**Files:**
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalExportServiceTest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/VietQrService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalExportService.java`

- [ ] **Step 1: Prepare tests for multiple rows without weakening the row-limit test**

In `setUp`, make normal workbook tests use a practical limit:

```java
ReflectionTestUtils.setField(service, "maxRows", 50_000);
```

At the start of `exportRejectsMoreThanConfiguredMaximumRows`, restore the intended limit:

```java
ReflectionTestUtils.setField(service, "maxRows", 1);
```

Import `org.springframework.test.util.ReflectionTestUtils`.

- [ ] **Step 2: Replace the workbook structure test with approved and paid evidence**

Create two requests and mark one paid:

```java
WithdrawalRequest approved = withdrawalService.createRequest(target, 250_000L, bankAccount.getId());
withdrawalService.approve(approved.getId(), admin.getEmail(), true, "Reviewed");

WithdrawalRequest paid = withdrawalService.createRequest(target, 300_000L, bankAccount.getId());
withdrawalService.approve(paid.getId(), admin.getEmail(), true, "Reviewed");
withdrawalService.markPaid(
        paid.getId(),
        admin.getEmail(),
        "FT-20260723-001",
        "Receipt matched",
        "withdrawal-" + paid.getId() + ".png",
        "abc123checksum",
        "11111111-1111-1111-1111-111111111111");
```

Assert the workbook contract:

```java
try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
    assertEquals("Payment Queue", workbook.getSheetAt(0).getSheetName());
    assertEquals("Paid Reconciliation", workbook.getSheetAt(1).getSheetName());
    assertEquals("Operations", workbook.getSheetAt(2).getSheetName());
    assertEquals(0, workbook.getAllPictures().size());

    Sheet queue = workbook.getSheet("Payment Queue");
    Sheet paidSheet = workbook.getSheet("Paid Reconciliation");
    Sheet operations = workbook.getSheet("Operations");

    assertEquals(approved.getId().doubleValue(), queue.getRow(3).getCell(0).getNumericCellValue());
    assertEquals("0123456789", queue.getRow(3).getCell(6).getStringCellValue());
    assertEquals(CellType.STRING, queue.getRow(3).getCell(6).getCellType());
    assertEquals("FT-20260723-001", paidSheet.getRow(3).getCell(8).getStringCellValue());
    assertEquals("Available", paidSheet.getRow(3).getCell(10).getStringCellValue());
    assertEquals("abc123checksum", paidSheet.getRow(3).getCell(11).getStringCellValue());
    assertTrue(paidSheet.getRow(3).getCell(12).getHyperlink().getAddress()
            .endsWith("/admin/withdrawals?review=" + paid.getId()));
    assertEquals("•••• 6789", operations.getRow(3).getCell(7).getStringCellValue());
}
```

Set `app.frontend-base-url=https://admin.example.test` in the test annotation so the hyperlink is deterministic.

- [ ] **Step 3: Run the exporter test and verify RED**

Run from `backend`:

```powershell
./mvnw.cmd -Dtest=WithdrawalExportServiceTest test
```

Expected: FAIL because only Operations and Bank Reconciliation exist.

- [ ] **Step 4: Reuse the configured transfer-content template**

In `VietQrService`, extract and expose:

```java
public String transferContentFor(WithdrawalRequest request) {
    return properties.transferContentTemplate()
            .replace("{withdrawalId}", request.getId().toString());
}
```

Make `instructionFor` call `transferContentFor(request)` rather than repeating the replacement. Inject `VietQrService` into `WithdrawalExportService`.

- [ ] **Step 5: Split workbook writing into three focused methods**

Build in this order:

```java
writePaymentQueue(workbook, rows, withdrawals, styles, normalizedFilters);
writePaidReconciliation(workbook, rows, withdrawals, paymentActions, styles, normalizedFilters);
writeOperations(workbook, rows, styles, normalizedFilters);
```

`writePaymentQueue` filters exactly `APPROVED` and writes:

```java
List.of(
    "Request ID", "Approved At", "User", "Email", "Amount (VND)",
    "Bank", "Account Number", "Account Holder", "Transfer Content", "Risk")
```

`writePaidReconciliation` filters exactly `PAID` and writes:

```java
List.of(
    "Request ID", "Requested At", "Paid At", "User", "Email", "Amount (VND)",
    "Bank", "Account Number", "Transfer Reference", "Payment Actor",
    "Receipt", "Receipt Checksum", "Admin Review")
```

`writeOperations` retains its current masked nine-column structure.

For Payment Queue, obtain transfer content with `vietQrService.transferContentFor(withdrawal)`. For Paid Reconciliation, take payment actor from the `MARKED_PAID` history entry and stored reference/time/receipt fields from `WithdrawalRequest`.

- [ ] **Step 6: Add safe string and link styles**

Extend `Styles` with a text style and hyperlink style:

```java
CellStyle text = workbook.createCellStyle();
text.setDataFormat(workbook.createDataFormat().getFormat("@"));

Font linkFont = workbook.createFont();
linkFont.setColor(IndexedColors.BLUE.getIndex());
linkFont.setUnderline(Font.U_SINGLE);
CellStyle hyperlink = workbook.createCellStyle();
hyperlink.setFont(linkFont);
```

Use the text style for account and transfer-reference cells. Add a helper that degrades to text when the base URL is blank:

```java
private void adminReviewLink(Row row, int column, Long withdrawalId, Styles styles) {
    Cell cell = row.createCell(column);
    cell.setCellValue("Open in admin");
    if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
        cell.setCellValue("WD-" + String.format("%06d", withdrawalId));
        return;
    }
    Hyperlink link = row.getSheet().getWorkbook().getCreationHelper()
            .createHyperlink(HyperlinkType.URL);
    link.setAddress(frontendBaseUrl.replaceAll("/+$", "")
            + "/admin/withdrawals?review=" + withdrawalId);
    cell.setHyperlink(link);
    cell.setCellStyle(styles.hyperlink());
}
```

Continue routing every user-controlled value through `safeText` before writing it.

- [ ] **Step 7: Improve sheet metadata without decorative formatting**

Update `prepareSheet` to write:

```java
text(sheet.createRow(1), 0, "Exported: " + LocalDateTime.now().format(EXPORT_TIME_FORMAT)
        + " | Filters: " + filters);
```

Keep the navy header, white header text, freeze pane, auto-filter, and explicit widths. Apply `#,##0` to amounts and `yyyy-mm-dd hh:mm` to timestamps. Do not embed images, logos, gradients, or merged decorative sections beyond the existing title row.

- [ ] **Step 8: Run exporter and VietQR tests**

Run from `backend`:

```powershell
./mvnw.cmd -Dtest=WithdrawalExportServiceTest,VietQrServiceTest test
```

Expected: PASS, including formula-injection, row-limit, audit, full-account, hyperlink, and zero embedded-image assertions.

- [ ] **Step 9: Commit the workbook**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/VietQrService.java backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalExportService.java backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalExportServiceTest.java
git commit -m "feat: organize withdrawal settlement workbook"
```

---

### Task 6: Quality gate and anti-slop review

**Files:**
- Modify only if a focused verification failure requires it.

- [ ] **Step 1: Run the withdrawal frontend tests**

Run from `frontend`:

```powershell
node node_modules/vitest/vitest.mjs run src/pages/admin/AdminWithdrawalsPage.test.tsx src/pages/admin/withdrawals/WithdrawalWizardStepper.test.tsx src/pages/admin/withdrawals/WithdrawalCompactSummary.test.tsx src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx --reporter=dot --maxWorkers=1 --minWorkers=1
```

Expected: PASS with no unhandled worker, image, or network errors from these files.

- [ ] **Step 2: Run the withdrawal backend tests**

Run from `backend`:

```powershell
./mvnw.cmd -Dtest=WithdrawalExportServiceTest,AdminWithdrawalOperationsIntegrationTest,VietQrServiceTest,WithdrawalPaymentIntegrationTest test
```

Expected: PASS with zero failures and zero errors.

- [ ] **Step 3: Build the frontend**

Run from `frontend`:

```powershell
npm run build
```

Expected: TypeScript and Vite complete with exit code 0.

- [ ] **Step 4: Run the complete frontend suite serially**

Run from `frontend`:

```powershell
node node_modules/vitest/vitest.mjs run --reporter=dot --maxWorkers=1 --minWorkers=1
```

Expected: all test files PASS. Run serially because parallel build/test execution previously caused unrelated lazy-route timeouts.

- [ ] **Step 5: Run the complete backend suite**

Run from `backend`:

```powershell
./mvnw.cmd test
```

Expected: zero failures and zero errors.

- [ ] **Step 6: Perform the visual restraint checklist**

Inspect the final modal at desktop and narrow widths and confirm:

- the authoritative stage remains visually unambiguous while Review is inspected;
- only completed Review is interactive, and keyboard focus is visible;
- no approval/rejection controls appear in the read-only panel;
- selected receipt state survives Review inspection;
- no gradients, glass, nested decorative cards, oversized rounding, or center QR overlay were introduced;
- mobile labels remain readable and interactive targets remain at least 44 px;
- the export dialog explains all three sheets without a repeated card grid;
- receipt images are absent from the workbook and full account data stays out of Operations.

- [ ] **Step 7: Confirm a clean branch**

```powershell
git status --short
git log -6 --oneline
```

Expected: no uncommitted changes; the latest commits correspond to stepper, modal navigation, deep link, preview, and workbook work.
