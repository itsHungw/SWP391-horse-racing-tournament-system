# Account Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement managed-B2B2C account suspension and ban with auditable admin transitions, restricted authentication, centralized mutation blocking, wallet-safe settlement, and dedicated user/admin frontend surfaces.

**Architecture:** Keep current `UserStatus` and `WalletStatus`, add immutable status history, and represent account state in an account-aware Spring Security principal loaded from the database on every request. A central enforcement filter permits reads and a small wallet/resolution allowlist while denying non-active business mutations. Frontend session state carries `accountStatus`, routes banned users to a restricted center, and gives admins explicit transition modals instead of editing status through the profile form.

**Tech Stack:** Java 21, Spring Boot 4.0.6, Spring Security, Spring Data JPA, Flyway/PostgreSQL, React 19, React Router 7, TypeScript, Axios, Vitest.

---

### Task 1: Persist account status decisions and expose explicit admin transitions

**Files:**
- Create: `backend/src/main/resources/db/migration/V26__user_status_history.sql`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/UserStatusHistory.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserStatusHistoryRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/request/AccountStatusTransitionRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/request/SuspendAccountRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/UserStatusHistoryResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AccountEnforcementService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/controller/AdminUserController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/request/UpdateUserProfileAdminRequest.java`
- Create test: `backend/src/test/java/com/example/horseracingtournamentsystem/user/AccountEnforcementIntegrationTest.java`

- [ ] Write focused integration tests covering `ACTIVE -> SUSPENDED -> ACTIVE`, `SUSPENDED -> BANNED`, `BANNED -> SUSPENDED`, invalid transitions, self-action, and last-active-admin protection.
- [ ] Add `user_status_history` with `user_id`, old/new status, public reason, internal note, actor, timestamp, and wallet-lock flag; indexes must support user timeline queries.
- [ ] Add entity/repository and map history to a response that exposes internal notes only on admin endpoints.
- [ ] Implement transactional methods:

```java
AdminUserDetailResponse suspend(Long targetId, SuspendAccountRequest request, String actorEmail);
AdminUserDetailResponse restore(Long targetId, AccountStatusTransitionRequest request, String actorEmail);
AdminUserDetailResponse ban(Long targetId, AccountStatusTransitionRequest request, String actorEmail);
AdminUserDetailResponse reopen(Long targetId, AccountStatusTransitionRequest request, String actorEmail);
List<UserStatusHistoryResponse> history(Long targetId);
```

- [ ] Enforce exact transitions, prevent self-enforcement, protect the last active admin, and write user status plus audit row in one transaction.
- [ ] Remove `status` from generic admin profile updates so status changes cannot bypass audit.
- [ ] Add `POST /{id}/suspend|restore|ban|reopen` and `GET /{id}/status-history` to `AdminUserController`.
- [ ] Run once: `cd backend && ./mvnw -Dtest=AccountEnforcementIntegrationTest test` (Windows: `mvnw.cmd`). Expected: focused tests pass.
- [ ] Commit: `feat: add auditable account enforcement transitions`.

### Task 2: Authenticate suspended and banned identities with current database status

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/security/AccountAwareUserDetails.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/CustomUserDetailsService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/JwtAuthenticationFilter.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/response/LoginResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/response/AuthResponse.java`
- Modify test: `backend/src/test/java/com/example/horseracingtournamentsystem/security/CustomUserDetailsServiceTest.java`
- Modify test: `backend/src/test/java/com/example/horseracingtournamentsystem/security/JwtAuthenticationFilterTest.java`
- Modify test: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/AuthLoginIntegrationTest.java`

- [ ] Add tests proving `ACTIVE`, `SUSPENDED`, and `BANNED` are enabled identities, while pending verification and inactive accounts cannot authenticate.
- [ ] Implement an immutable principal containing `userId`, email, password, `UserStatus`, and authorities including `ACCOUNT_<STATUS>`.
- [ ] Continue loading the user from the database in every JWT request so an admin decision applies on the next request without waiting for token expiry.
- [ ] Permit local/OAuth login and refresh for suspended/banned users; retain existing rejection for pending/inactive users.
- [ ] Return `accountStatus`, `email`, and `fullName` in login and refresh responses.
- [ ] Run once: `cd backend && mvnw.cmd -Dtest=CustomUserDetailsServiceTest,JwtAuthenticationFilterTest,AuthLoginIntegrationTest test`. Expected: focused tests pass.
- [ ] Commit: `feat: authenticate restricted account identities`.

### Task 3: Centralize suspended/banned access policy and restriction summary

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/security/AccountAccessPolicy.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/security/AccountStatusEnforcementFilter.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/AccountRestrictionResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/controller/AccountRestrictionController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/RestAccessDeniedHandler.java`
- Create test: `backend/src/test/java/com/example/horseracingtournamentsystem/security/AccountStatusEnforcementIntegrationTest.java`

- [ ] Test that suspended users can read authenticated owned/role data but receive `403 ACCOUNT_SUSPENDED` for unsafe business methods.
- [ ] Test that banned users can access only public endpoints, `/me/account-restriction`, wallet summary/history/withdrawal routes, and logout; normal workspaces return `403 ACCOUNT_BANNED`.
- [ ] Implement default-deny mutation rules for non-active accounts and an explicit allowlist for withdrawal create/cancel and logout.
- [ ] Return stable JSON `{ "code": "ACCOUNT_SUSPENDED|ACCOUNT_BANNED", "message": "..." }` without converting authenticated denial to 401.
- [ ] Implement `GET /api/v1/me/account-restriction` using latest public status reason and wallet status; never return internal notes.
- [ ] Do not update participant, assignment, race, or result state from account enforcement code.
- [ ] Run once: `cd backend && mvnw.cmd -Dtest=AccountStatusEnforcementIntegrationTest test`. Expected: focused tests pass.
- [ ] Commit: `feat: enforce restricted account capabilities`.

### Task 4: Separate locked-wallet user actions from system settlement credits

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WalletService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/Wallet.java`
- Create test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WalletServiceTest.java`
- Create test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalServiceTest.java`

- [ ] Add focused tests proving locked wallets reject `TOPUP`, `BET_PLACED`, `WITHDRAWAL_HOLD`, and ordinary admin/user debits while accepting idempotent `BET_PAYOUT`, `BET_REFUND`, and `WITHDRAWAL_REFUND` credits.
- [ ] Centralize transaction-origin classification in `WalletService`; do not scatter status bypasses through prediction/withdrawal services.
- [ ] Allow suspended/banned users to create a withdrawal only when their wallet is active; account status alone must not confiscate or transfer balance.
- [ ] Keep existing requested/approved withdrawals reviewable after account status changes.
- [ ] Run once: `cd backend && mvnw.cmd -Dtest=WalletServiceTest,WithdrawalServiceTest test`. Expected: focused tests pass.
- [ ] Commit: `fix: preserve settlement credits for locked wallets`.

### Task 5: Carry account status in the frontend session and route restricted users

**Files:**
- Modify: `frontend/src/api/authApi.ts`
- Modify: `frontend/src/api/httpClient.ts`
- Modify: `frontend/src/utils/authSession.ts`
- Modify: `frontend/src/hooks/useClientSession.ts`
- Create: `frontend/src/utils/accountCapabilities.ts`
- Create: `frontend/src/routes/RequireAccountAccessRoute.tsx`
- Create: `frontend/src/api/accountRestrictionApi.ts`
- Create: `frontend/src/pages/account/AccountRestrictedPage.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`
- Modify: `frontend/src/pages/auth/AuthPage.tsx`
- Modify test: `frontend/src/utils/authSession.test.ts`
- Modify test: `frontend/src/routes/RouteGuards.test.tsx`
- Create test: `frontend/src/pages/account/AccountRestrictedPage.test.tsx`

- [ ] Extend the session type with `accountStatus: "ACTIVE" | "SUSPENDED" | "BANNED"` and keep it synchronized after login/refresh.
- [ ] Add a single capability helper for workspace, mutation, top-up, withdrawal, and restriction access.
- [ ] Route banned users away from normal protected workspaces to `/account-restricted` with `replace`; suspended users retain read-only workspace navigation.
- [ ] Build the restricted page with status, public reason, timestamp, wallet state, allowed-action list, wallet/history links, and logout; do not show internal notes.
- [ ] Preserve page context for mutation-level 403 responses instead of globally navigating every 403.
- [ ] Run once: `cd frontend && npm test -- --run src/utils/authSession.test.ts src/routes/RouteGuards.test.tsx src/pages/account/AccountRestrictedPage.test.tsx --reporter=dot`. Expected: focused tests pass.
- [ ] Commit: `feat: add restricted account frontend flow`.

### Task 6: Replace generic admin ban controls with explicit enforcement UI

**Files:**
- Modify: `frontend/src/types/adminUser.ts`
- Modify: `frontend/src/api/adminUserApi.ts`
- Create: `frontend/src/pages/admin/components/AccountEnforcementPanel.tsx`
- Create: `frontend/src/pages/admin/components/AccountEnforcementModal.tsx`
- Modify: `frontend/src/pages/admin/AdminUserDetailPage.tsx`
- Modify test: `frontend/src/api/adminUserApi.test.ts`
- Create test: `frontend/src/pages/admin/AdminUserDetailPage.test.tsx`

- [ ] Add typed suspend/restore/ban/reopen API functions and status-history types.
- [ ] Remove account status from the profile form and remove the delete-as-ban flow.
- [ ] Render valid actions only for the current status; require public reason, optional internal note, optional wallet lock for suspension, and explicit confirmation for ban.
- [ ] Prevent self-action in UI while relying on backend safeguards as authority.
- [ ] Show immutable status timeline and an active-assignment warning that explicitly says suspension does not auto-DQ or rewrite race results.
- [ ] Keep transition conflicts/errors inside the modal and disable duplicate submit.
- [ ] Run once: `cd frontend && npm test -- --run src/api/adminUserApi.test.ts src/pages/admin/AdminUserDetailPage.test.tsx --reporter=dot`. Expected: focused tests pass.
- [ ] Commit: `feat: add admin account enforcement workspace`.

### Task 7: Focused integration verification and documentation alignment

**Files:**
- Modify: `docs/ba/2026-06-22-wallet-payments-ba.md`
- Modify: `docs/ba/2026-06-14-organizer-role-ba.md`

- [ ] Verify migration/entity fields and API/type names match the design spec.
- [ ] Run backend focused suite once for the new account enforcement, security, auth, and wallet tests; do not run the entire backend suite unless a shared-security regression requires it.
- [ ] Run frontend focused suite once for session, route, restricted page, admin enforcement, and existing error pages.
- [ ] Run one final `npm run build` and one backend `mvnw.cmd -DskipTests package` compile/package check.
- [ ] Record unrelated pre-existing failures without rerunning unchanged commands.
- [ ] Document that locked wallets accept system settlement/refund credits and that organizer penalties remain tournament-scoped; commit as `docs: align account enforcement behavior`.
