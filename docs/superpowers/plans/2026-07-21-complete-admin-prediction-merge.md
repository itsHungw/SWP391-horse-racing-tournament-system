# Complete Admin Prediction Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the in-progress `develop` into `feature/admin-prediction` merge buildable, restore a green test suite, and conclude it with a merge commit.

**Architecture:** Preserve the resolved merge result. Add explicit prediction DTO types at the UI aggregation boundary, then update stale frontend assertions to match the intentional Referee branding, account-status session contract, authentication branding, and verified top-up receipt flow already present in production code.

**Tech Stack:** React 19, TypeScript 5.8, Vitest/Testing Library, Spring Boot 4, Maven, Git.

---

### Task 1: Restore Admin Prediction type safety

**Files:**
- Modify: `frontend/src/pages/admin/AdminPredictionsWorkspace.tsx:1-180`
- Test: `frontend/src/pages/admin/AdminPredictionsWorkspace.test.tsx`

- [x] **Step 1: Verify the failing build**

Run: `cd frontend && npm run build`

Expected: FAIL with `tRaces is of type unknown` and implicit `any` errors.

- [x] **Step 2: Use the API response type through state and grouping**

Import `AdminRaceSummary` as a type, declare `races` as `AdminRaceSummary[]`, and reduce into `Record<string, AdminRaceSummary[]>`.

- [x] **Step 3: Verify the focused UI tests and build**

Run: `cd frontend && npm test -- --run src/pages/admin/AdminPredictionsWorkspace.test.tsx src/pages/admin/AdminRacePredictionDetailPage.test.tsx`

Expected: PASS, 2 tests.

Run: `cd frontend && npm run build`

Expected: PASS.

### Task 2: Align stale frontend tests with merged product contracts

**Files:**
- Modify: `frontend/src/layouts/RefereeLayout.test.tsx`
- Modify: `frontend/src/utils/authSession.test.ts`
- Modify: `frontend/src/pages/auth/ForgotPasswordPage.test.tsx`
- Modify: `frontend/src/pages/wallet/WalletPage.test.tsx`

- [x] **Step 1: Preserve the observed RED evidence**

The full Vitest run must fail on the four named files before edits: Referee branding, account status, championship partner wording, and removed top-up status banner.

- [x] **Step 2: Update assertions to user-visible behavior**

Assert the `AQUEDUCT` Referee heading, the default persisted `ACTIVE` account status, and `Certified Championship Partner` shared by login and recovery.

- [x] **Step 3: Exercise the verified receipt flow**

Mock `getTopUpReceipt`, navigate with both `topup` and `txnRef`, and assert the accessible `Top-up result` dialog and successful receipt content.

- [x] **Step 4: Verify the four focused test files**

Run: `cd frontend && npm test -- --run src/layouts/RefereeLayout.test.tsx src/utils/authSession.test.ts src/pages/auth/ForgotPasswordPage.test.tsx src/pages/wallet/WalletPage.test.tsx`

Expected: PASS.

### Task 3: Repair account-enforcement integration fixtures

**Files:**
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/blog/AdminBlogIntegrationTest.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/common/error/GlobalExceptionHandlerIntegrationTest.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/organization/OrganizationIntegrationTest.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/user/AdminRoleRequestIntegrationTest.java`

- [x] **Step 1: Reproduce the authentication failures**

The full backend suite returned 12 unexpected `401` responses because fixtures persisted users before activating their email status.

- [x] **Step 2: Persist active fixture state**

Create pending users, call `verifyEmail()`, then save them so the account-enforcement filter loads `ACTIVE` from the database.

- [x] **Step 3: Verify the affected integration tests**

Run: `cd backend && .\mvnw.cmd "-Dtest=AdminBlogIntegrationTest,GlobalExceptionHandlerIntegrationTest,OrganizationIntegrationTest,AdminRoleRequestIntegrationTest" test`

Expected: PASS, 15 tests.

### Task 4: Verify and conclude the merge

**Files:**
- Stage all resolved merge files and the fixes above.

- [x] **Step 1: Run full frontend verification**

Run: `cd frontend && npm test -- --run`

Expected: PASS, 0 failures.

Run: `cd frontend && npm run build`

Expected: PASS.

- [x] **Step 2: Run full backend verification**

Run: `cd backend && .\mvnw.cmd test`

Expected: PASS, 0 failures.

- [x] **Step 3: Validate the merge index**

Run: `git diff --check && git diff --cached --check && git ls-files -u`

Expected: no whitespace errors and no unmerged entries.

- [x] **Step 4: Conclude the merge**

Run: `git add <modified files> && git commit -m "Merge branch 'develop' into feature/admin-prediction"`

Expected: a two-parent merge commit and a clean worktree.
