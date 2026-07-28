# Top-up Result Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the wallet top-up banner with an owner-verified receipt dialog for successful, failed, and unavailable VNPay results.

**Architecture:** VNPay return includes the existing transaction reference. A read-only owner-scoped receipt endpoint joins `TopUpOrder` to its wallet ledger entry, while the wallet page consumes return parameters into local state and removes them from browser history. One responsive dialog renders all outcome variants and never performs wallet crediting.

**Tech Stack:** Java 21, Spring Boot, Spring Data JPA, React, TypeScript, React Router, Tailwind CSS, Vitest

---

### Task 1: Add the owner-scoped receipt API with TDD

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/TopUpReceiptResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/TopUpOrderRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WalletTransactionRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/TopUpService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/TopUpController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/TopUpReceiptIntegrationTest.java`

- [ ] **Step 1: Write failing receipt tests**

```java
@Test void ownerReadsSuccessfulReceiptWithBalanceAfter() { /* GET expects amount, SUCCESS, balanceAfter */ }
@Test void ownerReadsFailedReceiptWithoutBalanceAfter() { /* GET expects FAILED and null balanceAfter */ }
@Test void anotherUserReceivesNotFound() { /* same txnRef under second JWT expects 404 */ }
@Test void readingReceiptDoesNotCreateWalletTransaction() { /* compare ledger count before/after */ }
@Test void bannedOwnerCanReadReceiptButCannotCreateTopUp() { /* GET 200, POST topup 403 */ }
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `backend\mvnw.cmd -f backend\pom.xml "-Dtest=TopUpReceiptIntegrationTest" test`

- [ ] **Step 3: Add owner and ledger repository queries**

```java
Optional<TopUpOrder> findByVnpayTxnRefAndUserId(String vnpayTxnRef, Long userId);

Optional<WalletTransaction> findByReferenceTypeAndReferenceIdAndTransactionType(
        String referenceType, Long referenceId, WalletTransactionType transactionType);
```

- [ ] **Step 4: Add the normalized receipt DTO**

```java
public record TopUpReceiptResponse(
        String txnRef,
        ReceiptStatus status,
        long amount,
        Long balanceAfter,
        Long walletTransactionId,
        LocalDateTime processedAt,
        String failureReason) {
    public enum ReceiptStatus { PENDING, SUCCESS, FAILED }
}
```

Map `INITIATED/PENDING` to `PENDING`, `SUCCESS` to `SUCCESS`, and `FAILED/EXPIRED` to `FAILED`. Map gateway response codes to a small user-safe reason set; do not return raw signed parameters.

- [ ] **Step 5: Add the read-only service and controller method**

```java
@Transactional(readOnly = true)
public TopUpReceiptResponse receipt(User user, String txnRef);

@GetMapping("/topups/{txnRef}/receipt")
public TopUpReceiptResponse receipt(@PathVariable @Size(max = 100) String txnRef, Authentication auth) {
    return topUpService.receipt(currentUser(auth), txnRef);
}
```

Return `404` for both unknown and other-user references.

- [ ] **Step 6: Run the focused receipt tests and confirm GREEN**

Run: `backend\mvnw.cmd -f backend\pom.xml "-Dtest=TopUpReceiptIntegrationTest" test`

- [ ] **Step 7: Commit the receipt API**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet backend/src/test/java/com/example/horseracingtournamentsystem/wallet/TopUpReceiptIntegrationTest.java
git commit -m "feat: add owner-scoped top-up receipts"
```

### Task 2: Carry the reference through return and restricted access

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/TopUpController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/AccountAccessPolicy.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/TopUpReceiptIntegrationTest.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/security/AccountAccessPolicyTest.java`

- [ ] **Step 1: Add failing redirect and policy assertions**

Assert that a valid return redirects with URL-encoded `topup` and `txnRef`, and that banned policy allows only `GET /api/v1/wallet/topups/{safeRef}/receipt`, not POST or sibling top-up paths.

- [ ] **Step 2: Add the encoded return reference**

```java
String txnRef = params.get("vnp_TxnRef");
UriComponentsBuilder redirect = UriComponentsBuilder
        .fromUriString(props.getFrontendReturnUrl())
        .queryParam("topup", status);
if (txnRef != null && !txnRef.isBlank()) redirect.queryParam("txnRef", txnRef);
return new RedirectView(redirect.build().encode().toUriString());
```

- [ ] **Step 3: Add the narrow receipt allowlist**

```java
private boolean isTopUpReceiptGet(String method, String path) {
    return HttpMethod.GET.matches(method)
            && path.matches("/api/v1/wallet/topups/[A-Za-z0-9_-]{1,100}/receipt");
}
```

Include this predicate in banned resolution access. Suspended users already permit safe methods, but the explicit predicate documents banned access.

- [ ] **Step 4: Run receipt and policy tests**

Run: `backend\mvnw.cmd -f backend\pom.xml "-Dtest=TopUpReceiptIntegrationTest,AccountAccessPolicyTest" test`

- [ ] **Step 5: Commit redirect and policy changes**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/TopUpController.java backend/src/main/java/com/example/horseracingtournamentsystem/security/AccountAccessPolicy.java backend/src/test
git commit -m "fix: preserve verified top-up return references"
```

### Task 3: Build the reusable payment result dialog

**Files:**
- Modify: `frontend/src/types/wallet.ts`
- Modify: `frontend/src/api/walletApi.ts`
- Create: `frontend/src/pages/wallet/PaymentResultDialog.tsx`
- Test: `frontend/src/pages/wallet/PaymentResultDialog.test.tsx`

- [ ] **Step 1: Write failing component tests**

Use four named tests: `renders amount balance and receipt actions for success`, `states that no successful credit was recorded for failure`, `offers retry without claiming an outcome when receipt is unavailable`, and `hides try again when top-up capability is false`. Supply complete `PaymentResultState` fixtures and assert callbacks with Vitest spies.

- [ ] **Step 2: Add typed API support**

```ts
export type TopUpReceipt = {
  txnRef: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  amount: number;
  balanceAfter: number | null;
  walletTransactionId: number | null;
  processedAt: string | null;
  failureReason: string | null;
};

getTopUpReceipt: async (txnRef: string) =>
  (await httpClient.get<TopUpReceipt>(`/wallet/topups/${encodeURIComponent(txnRef)}/receipt`)).data,
```

- [ ] **Step 3: Implement all dialog variants**

Use `Modal` as the accessible shell, with mobile panel styling overridden to bottom alignment only if the shared shell is extended through a `placement` prop. Render success, failed, pending, and unavailable content from a discriminated prop:

```ts
type PaymentResultState =
  | { kind: "loading"; txnRef: string }
  | { kind: "receipt"; receipt: TopUpReceipt }
  | { kind: "unavailable"; txnRef: string; message: string };
```

Do not trigger top-up or wallet mutation inside this component. Expose callbacks `onClose`, `onRetryReceipt`, `onTryAgain`, and `onViewTransaction`.

- [ ] **Step 4: Run component tests**

Run: `npm --prefix frontend test -- PaymentResultDialog.test.tsx --run`

- [ ] **Step 5: Commit the dialog**

```powershell
git add frontend/src/types/wallet.ts frontend/src/api/walletApi.ts frontend/src/pages/wallet/PaymentResultDialog.tsx frontend/src/pages/wallet/PaymentResultDialog.test.tsx
git commit -m "feat: add verified payment result dialog"
```

### Task 4: Integrate the result lifecycle into WalletPage

**Files:**
- Modify: `frontend/src/pages/wallet/WalletPage.tsx`
- Modify: `frontend/src/pages/wallet/WalletPage.test.tsx`

- [ ] **Step 1: Replace the banner test with lifecycle tests**

Add mocked `getTopUpReceipt` and verify:

Use four named tests: `loads a verified receipt and removes consumed result parameters`, `keeps unrelated search parameters when consuming a result`, `does not request a receipt without txnRef`, and `opens add-money sheet from failed result only when capability permits`.

Use a small `LocationProbe` component in the test router to assert the final search string rather than mocking React Router internals.

- [ ] **Step 2: Consume URL state exactly once**

On mount, capture `topup` and `txnRef`, remove only those keys through `setSearchParams(next, { replace: true })`, set a loading result state, and call `walletApi.getTopUpReceipt(txnRef)`. On success, refresh summary/ledger and show the receipt. On failure, show unavailable state while preserving the captured reference.

- [ ] **Step 3: Wire dialog actions**

- `Done`: close result.
- `Retry`: call only `getTopUpReceipt` again.
- `Try again`: close result and open `TopUpSheet` only when `capabilities.canTopUp && !walletLocked`.
- `View transaction`: close result, set ledger filter to `topup`, and scroll/focus the ledger row whose transaction ID equals `receipt.walletTransactionId`.

- [ ] **Step 4: Run focused wallet tests and build**

```powershell
npm --prefix frontend test -- PaymentResultDialog.test.tsx WalletPage.test.tsx --run
npm --prefix frontend run build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit WalletPage integration**

```powershell
git add frontend/src/pages/wallet/WalletPage.tsx frontend/src/pages/wallet/WalletPage.test.tsx
git commit -m "feat: show top-up receipts after payment return"
```

### Task 5: Final focused verification

**Files:**
- Verify only

- [ ] **Step 1: Run backend finance and enforcement suites once**

```powershell
backend\mvnw.cmd -f backend\pom.xml "-Dtest=TopUpReceiptIntegrationTest,WalletEnforcementIntegrationTest,AccountAccessPolicyTest" test
```

- [ ] **Step 2: Run frontend wallet tests and build once**

```powershell
npm --prefix frontend test -- PaymentResultDialog.test.tsx WalletPage.test.tsx --run
npm --prefix frontend run build
git diff --check
```

- [ ] **Step 3: Record manual payment-return checks**

Verify success, failed/cancelled, unavailable receipt, refresh-after-consumption, and restricted-account receipt access against a local VNPay sandbox return. Do not repeat automated suites if only the external sandbox is unavailable.
