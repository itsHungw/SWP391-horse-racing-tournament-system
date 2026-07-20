# Wallet Enforcement UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make suspended status truthful in the admin list and turn wallet freezing into a clear, reversible, independently audited admin decision.

**Architecture:** Add immutable wallet-status history and a dedicated admin wallet-control service/API. Account suspension may call the same wallet service atomically, while standalone lock/unlock remains available from the account-enforcement panel. Frontend uses the shared status pill and presents exact withdrawal consequences instead of a generic wallet-lock checkbox.

**Tech Stack:** Java 21, Spring Boot 4, Spring Data JPA, Flyway, React 19, TypeScript, Tailwind CSS.

---

### Task 1: Add audited wallet lock/unlock API

**Files:**
- Create: `backend/src/main/resources/db/migration/V27__wallet_status_history.sql`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WalletStatusHistory.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WalletStatusHistoryRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WalletControlResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WalletStatusHistoryResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WalletEnforcementService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/AdminWalletEnforcementController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WalletEnforcementIntegrationTest.java`

- [ ] Write focused tests for `ACTIVE -> LOCKED -> ACTIVE`, duplicate transition conflict, audit order, and self-action denial.
- [ ] Add `wallet_status_history` containing user, old/new status, public reason, internal note, actor, and timestamp.
- [ ] Implement `getControl`, `lock`, `unlock`, and `history`; create a zero-balance wallet when the target does not have one.
- [ ] Expose `GET wallet-control`, `POST wallet/lock`, `POST wallet/unlock`, and `GET wallet-status-history` under `/api/v1/admin/users/{userId}`.
- [ ] Run once: `backend\\mvnw.cmd -Dtest=WalletEnforcementIntegrationTest test`.

### Task 2: Reuse wallet enforcement during suspension

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AccountEnforcementService.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/user/AccountEnforcementIntegrationTest.java`

- [ ] Replace direct `Wallet.lock()` mutation with `WalletEnforcementService.lockForSuspension(...)` so wallet audit is written in the account transaction.
- [ ] Keep `lockWallet=false` as the default financial choice and keep restore independent from wallet unlock.
- [ ] Extend the existing focused integration test to assert wallet status and wallet audit after suspension.

### Task 3: Correct user status presentation

**Files:**
- Modify: `frontend/src/components/office/StatusPill.tsx`
- Modify: `frontend/src/pages/admin/AdminUserListPage.tsx`

- [ ] Add explicit `SUSPENDED`, `BANNED`, `PENDING_EMAIL_VERIFY`, and `INACTIVE` tones/labels to the shared status primitive.
- [ ] Replace the list's fallback ternary with `StatusPill`.
- [ ] Add Suspended and Inactive filter options.

### Task 4: Clarify financial access and add reversible wallet controls

**Files:**
- Modify: `frontend/src/types/adminUser.ts`
- Modify: `frontend/src/api/adminUserApi.ts`
- Modify: `frontend/src/pages/admin/components/AccountEnforcementModal.tsx`
- Modify: `frontend/src/pages/admin/components/AccountEnforcementPanel.tsx`
- Create: `frontend/src/pages/admin/components/WalletEnforcementModal.tsx`

- [ ] Replace the suspend checkbox with two radio-style choices: keep withdrawals available (default) or freeze new withdrawals.
- [ ] Fetch and show current wallet status plus a plain-language capability summary.
- [ ] Add standalone freeze/restore withdrawal actions with required public reason, optional internal note, conflict handling, and disabled duplicate submit.
- [ ] Show wallet-status timeline separately from account-status timeline.

### Task 5: Focused verification and commit

**Files:** All files above.

- [ ] Run `git diff --check`.
- [ ] Run backend focused wallet/account integration tests once.
- [ ] Run `frontend\\npm run build` once; if the known post-build Windows libuv assertion recurs after Vite reports success, record it without looping.
- [ ] Run `backend\\mvnw.cmd -DskipTests package` once.
- [ ] Commit as `feat: clarify and audit wallet enforcement`.
