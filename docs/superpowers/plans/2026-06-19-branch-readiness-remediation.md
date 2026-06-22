# Branch Readiness Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `feat/forget-password` transactionally safe, concurrency-safe, regression-free, dependency-clean, and ready for a scoped merge.

**Architecture:** `AuthService` owns the password-reset transaction, while Spring Data JPA pessimistic locks serialize token issuance and consumption. The in-memory rate limiter keeps its current fixed-window semantics but moves to a bounded Caffeine cache and trusts forwarded client identity only from configured proxies. Existing race and frontend regressions are resolved against the approved product contracts before dependency and Git hygiene gates run.

**Tech Stack:** Java 21, Spring Boot 4, Spring Data JPA, SQL Server/H2, Caffeine 3, JUnit 5, MockMvc, React 19, React Router, Vitest, Testing Library, Vite.

---

## File Map

Password-reset safety:

- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/exception/PasswordResetRejectedException.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/repository/PasswordResetTokenRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/AuthPasswordResetIntegrationTest.java`

Rate-limit hardening:

- Modify: `backend/pom.xml`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/AppSecurityProperties.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/RateLimitingFilter.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application.yml`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/security/RateLimitingFilterTest.java`

Backend regression restoration:

- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/controller/RaceController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/repository/RaceRepository.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/race/RaceIntegrationTest.java`

Frontend regression restoration:

- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/pages/admin/AdminTournamentDetailPage.test.tsx`
- Modify: `frontend/src/pages/admin/AdminTournamentListPage.test.tsx`
- Modify: `frontend/src/pages/referee/SubmitResultsPage.test.tsx`
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`
- Modify production components only if a reproduced user flow is actually broken.

Dependency and branch hygiene:

- Modify: `frontend/package-lock.json`
- Verify all modified and untracked feature/remediation paths.

---

### Task 1: Lock Password-Reset Token State

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/exception/PasswordResetRejectedException.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/repository/PasswordResetTokenRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenService.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenServiceTest.java`

- [ ] **Step 1: Add failing unit coverage for the rejection type**

Update the token-service tests so invalid, expired, and locked reset tokens throw
`PasswordResetRejectedException` with the existing public error codes.

```java
assertThatThrownBy(() -> service.consumePasswordResetToken(user, "000000"))
        .isInstanceOf(PasswordResetRejectedException.class)
        .hasMessage("INVALID_PASSWORD_RESET_TOKEN");
```

- [ ] **Step 2: Run the focused test and confirm red**

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=OneTimeTokenServiceTest" test
```

Expected: compilation failure because the dedicated exception does not exist.

- [ ] **Step 3: Add the dedicated rejection exception**

```java
package com.example.horseracingtournamentsystem.auth.exception;

public class PasswordResetRejectedException extends IllegalArgumentException {

    public PasswordResetRejectedException(String message) {
        super(message);
    }
}
```

- [ ] **Step 4: Add pessimistic repository queries**

Keep existing non-locking methods only when used outside reset mutation paths.
Add explicit locked queries:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("""
        select token from PasswordResetToken token
        where token.user.id = :userId
          and token.tokenHash = :tokenHash
          and token.usedAt is null
        """)
Optional<PasswordResetToken> findActiveMatchingForUpdate(Long userId, String tokenHash);

@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("""
        select token from PasswordResetToken token
        where token.user.id = :userId
          and token.usedAt is null
        order by token.createdAt desc
        """)
List<PasswordResetToken> findActiveForUpdate(Long userId, Pageable pageable);
```

Use `PageRequest.of(0, 1)` for the latest-token failed-attempt path. Issuance is
serialized by the existing `UserRepository.findByEmailForUpdate(...)`, so its
active-token invalidation can safely use the locked active-token query.

- [ ] **Step 5: Route reset rejections through the new exception**

Replace the three password-reset `IllegalArgumentException` constructions in
`OneTimeTokenService` with `PasswordResetRejectedException`. Use the locked
repository queries for matching-token consumption and latest-token failure
tracking.

- [ ] **Step 6: Run the focused token tests and confirm green**

```powershell
.\mvnw.cmd "-Dtest=OneTimeTokenServiceTest" test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 7: Commit the lock primitives**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/auth/exception/PasswordResetRejectedException.java backend/src/main/java/com/example/horseracingtournamentsystem/auth/repository/PasswordResetTokenRepository.java backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenService.java backend/src/test/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenServiceTest.java
git commit -m "fix(auth): lock password reset token state"
```

---

### Task 2: Make Reset Success Atomic and Concurrency-Safe

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/AuthPasswordResetIntegrationTest.java`

- [ ] **Step 1: Add a token-reuse integration test**

Request an OTP, reset successfully, then submit the same OTP again. Assert the
second request returns 400 and the first password remains valid.

- [ ] **Step 2: Add a rollback integration test**

Provide a test-primary `PasswordEncoder` that delegates normally but throws
`IllegalStateException` for the exact value `TriggerRollback123`. Submit a valid
OTP with that new password, assert 500, then assert the token remains unused and
the old password still authenticates.

```java
if ("TriggerRollback123".contentEquals(rawPassword)) {
    throw new IllegalStateException("TEST_PASSWORD_ENCODING_FAILURE");
}
```

- [ ] **Step 3: Add concurrent consume and issuance tests**

Use a two-thread `ExecutorService` and a `CountDownLatch` start gate:

- two resets with the same valid OTP produce exactly one success;
- two reset-code requests for the same active user leave exactly one unused token.

Use thread-safe collections in `TestEmailSender`.

- [ ] **Step 4: Run the integration class and confirm red**

```powershell
.\mvnw.cmd "-Dtest=AuthPasswordResetIntegrationTest" test
```

Expected: rollback and/or concurrency assertions fail with the current split
repository transactions.

- [ ] **Step 5: Add the outer transaction boundary**

```java
@Transactional(
        rollbackFor = Exception.class,
        noRollbackFor = PasswordResetRejectedException.class
)
public void resetPassword(ResetPasswordRequest request) {
    // existing validate, consume, encode/save, revoke/saveAll sequence
}
```

Annotate `verifyPasswordResetCode(...)` with a transaction that also preserves
`PasswordResetRejectedException` state. In `requestPasswordReset(...)`, replace
the normal user lookup with `findByEmailForUpdate(...)` so concurrent issuance is
serialized before old tokens are invalidated.

- [ ] **Step 6: Run password-reset integration and focused auth suites**

```powershell
.\mvnw.cmd "-Dtest=AuthPasswordResetIntegrationTest,OneTimeTokenServiceTest,AuthEntityMappingTest,SmtpEmailSenderTest" test
```

Expected: all selected tests pass.

- [ ] **Step 7: Commit atomic reset behavior**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java backend/src/test/java/com/example/horseracingtournamentsystem/auth/AuthPasswordResetIntegrationTest.java
git commit -m "fix(auth): make password reset consumption atomic"
```

---

### Task 3: Bound and Harden the Rate Limiter

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/AppSecurityProperties.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/RateLimitingFilter.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application.yml`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/security/RateLimitingFilterTest.java`

- [ ] **Step 1: Add failing trusted-proxy tests**

Prove that an untrusted peer cannot rotate `X-Forwarded-For` to bypass a limit,
and that a configured trusted proxy can identify two distinct clients.

```java
firstRequest.setRemoteAddr("203.0.113.10");
firstRequest.addHeader("X-Forwarded-For", "198.51.100.1");

secondRequest.setRemoteAddr("203.0.113.10");
secondRequest.addHeader("X-Forwarded-For", "198.51.100.2");
```

With no trusted proxies, the second request must be limited because both keys are
`203.0.113.10`.

- [ ] **Step 2: Add failing cache-bound and expiry tests**

Construct the filter with a controllable Caffeine `Ticker`, insert more keys than
the configured maximum, call `cleanUp()`, and assert estimated size is bounded.
Advance the ticker past the configured cache TTL and assert a new request starts a
fresh window.

- [ ] **Step 3: Run the filter tests and confirm red**

```powershell
.\mvnw.cmd "-Dtest=RateLimitingFilterTest" test
```

- [ ] **Step 4: Add Caffeine**

Add the Spring-Boot-managed dependency:

```xml
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>
```

- [ ] **Step 5: Add rate-limit storage and proxy properties**

```java
private long cacheMaximumSize = 50_000;
private long cacheTtlSeconds = 1_200;
private List<String> trustedProxies = List.of();
```

Bind them under `app.security.rate-limit` in main and test YAML. Validate in the
filter constructor that `cacheTtlSeconds` is greater than or equal to every rule
window.

- [ ] **Step 6: Replace the unbounded map**

```java
this.buckets = Caffeine.newBuilder()
        .maximumSize(limits.getCacheMaximumSize())
        .expireAfterWrite(Duration.ofSeconds(limits.getCacheTtlSeconds()))
        .ticker(ticker)
        .build();
```

Use `buckets.asMap().compute(...)` for fixed-window updates so the count check and
increment remain atomic per key. Default `clientKey(...)` to `getRemoteAddr()`;
read and normalize `X-Forwarded-For` only when the direct peer is in
`trustedProxies`.

- [ ] **Step 7: Run filter and security integration tests**

```powershell
.\mvnw.cmd "-Dtest=RateLimitingFilterTest,AuthPasswordResetIntegrationTest" test
```

Expected: all selected tests pass.

- [ ] **Step 8: Commit rate-limit hardening**

```powershell
git add backend/pom.xml backend/src/main/java/com/example/horseracingtournamentsystem/security/AppSecurityProperties.java backend/src/main/java/com/example/horseracingtournamentsystem/security/RateLimitingFilter.java backend/src/main/resources/application.yml backend/src/test/resources/application.yml backend/src/test/java/com/example/horseracingtournamentsystem/security/RateLimitingFilterTest.java
git commit -m "fix(security): bound and harden application rate limits"
```

---

### Task 4: Restore the Backend Race Contract

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/controller/RaceController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/repository/RaceRepository.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/race/RaceIntegrationTest.java`

- [ ] **Step 1: Align stale tests with the approved discovery design**

Remove mandatory `serverNow` assertions. Replace the obsolete
`/races/calendar-summary` test with `GET /api/v1/races/search` coverage using
`scope`, `from`, and `to`, asserting both races for the visible day are returned.

- [ ] **Step 2: Retain the failing horse/jockey filter test**

Do not weaken `publicResultDiscoveryFiltersOfficialResultsByHorseAndJockey`.
It proves a real server-side filtering requirement and must remain red until the
query accepts and applies both filters.

- [ ] **Step 3: Add request parameters through controller and service**

Add optional `horse` and `jockey` request parameters to `searchPublic(...)`, pass
normalized empty strings through `RaceService.searchPublicRaces(...)`, and add the
same parameters to `RaceRepository.searchPublic(...)`.

- [ ] **Step 4: Apply filters with correlated `exists` subqueries**

Add matching predicates to both the select and count JPQL:

```sql
and (:horse = '' or exists (
    select participant.id from RaceParticipant participant
    where participant.race = r
      and lower(participant.horse.name) like lower(concat('%', :horse, '%'))
))
and (:jockey = '' or exists (
    select participant.id from RaceParticipant participant
    where participant.race = r
      and participant.jockey is not null
      and lower(participant.jockey.fullName) like lower(concat('%', :jockey, '%'))
))
```

- [ ] **Step 5: Run the isolated race suite**

```powershell
.\mvnw.cmd "-Dtest=RaceIntegrationTest" test
```

Expected: 13 tests pass with zero failures.

- [ ] **Step 6: Run the full backend suite**

```powershell
.\mvnw.cmd test
```

Expected: zero failures and zero errors.

- [ ] **Step 7: Commit backend regression fixes**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/race/controller/RaceController.java backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java backend/src/main/java/com/example/horseracingtournamentsystem/race/repository/RaceRepository.java backend/src/test/java/com/example/horseracingtournamentsystem/race/RaceIntegrationTest.java
git commit -m "fix(racing): restore public race discovery contract"
```

---

### Task 5: Restore the Frontend Test Baseline

**Files:**
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/pages/admin/AdminTournamentDetailPage.test.tsx`
- Modify: `frontend/src/pages/admin/AdminTournamentListPage.test.tsx`
- Modify: `frontend/src/pages/referee/SubmitResultsPage.test.tsx`
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`
- Modify production components only when the current user flow is broken.

- [ ] **Step 1: Reproduce the five failing files together**

```powershell
cd frontend
npm test -- --run src/App.test.tsx src/pages/admin/AdminTournamentDetailPage.test.tsx src/pages/admin/AdminTournamentListPage.test.tsx src/pages/referee/SubmitResultsPage.test.tsx src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx
```

Expected: the same 8 failures recorded in the spec.

- [ ] **Step 2: Update stale admin assertions to observable current behavior**

Use accessible headings, tabs, links, status text, and operation controls that
exist in the current admin shell. Do not restore deleted marketing copy solely to
satisfy tests.

- [ ] **Step 3: Complete the submit-results confirmation flow in tests**

Read the current validation and confirmation controls, populate all required
fields, submit the form, and click the uniquely named confirmation action before
asserting `submitRaceResultPackage(...)` arguments. If the confirmation action is
not uniquely accessible, fix its accessible name in production and assert by role.

- [ ] **Step 4: Disambiguate spectator review actions**

Scope the query to the wizard action region or give the step-rail control a
distinct accessible name. The test must click the enabled action button and keep
the duplicate-horse validation assertion intact.

- [ ] **Step 5: Run the five files until green**

Expected: 28 tests pass with zero failures.

- [ ] **Step 6: Run the full frontend suite**

```powershell
npm test -- --run
```

Expected: 223 tests pass with zero failures.

- [ ] **Step 7: Commit frontend regression fixes**

```powershell
git add frontend/src/App.test.tsx frontend/src/pages/admin/AdminTournamentDetailPage.test.tsx frontend/src/pages/admin/AdminTournamentListPage.test.tsx frontend/src/pages/referee/SubmitResultsPage.test.tsx frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx
git commit -m "test(frontend): align critical flows with current behavior"
```

Include any production component path in the explicit `git add` only if Step 3 or
Step 4 proves a real accessibility or interaction defect.

---

### Task 6: Remediate the Two High Dependency Findings

**Files:**
- Modify: `frontend/package-lock.json`
- Modify: `frontend/package.json` only if the smallest safe compatible range requires it.

- [ ] **Step 1: Capture current audit evidence**

```powershell
cd frontend
npm audit --omit=dev --json
npm ls form-data vite --all
npm audit fix --dry-run
```

Expected before remediation: high findings for `form-data@4.0.5` and
`vite@6.4.2`.

- [ ] **Step 2: Apply the smallest compatible update**

Run `npm audit fix` only after reviewing the dry run. If it proposes a major
framework upgrade, update the affected direct dependency deliberately instead and
reinstall. Do not use `--force`.

- [ ] **Step 3: Verify dependency resolution**

```powershell
npm ls form-data vite --all
npm audit --omit=dev --audit-level=high
```

Expected: zero high and critical findings.

- [ ] **Step 4: Verify frontend after lockfile changes**

```powershell
npm test -- --run
npm run build
```

Expected: full frontend suite and production build pass.

- [ ] **Step 5: Commit dependency remediation**

```powershell
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): remediate high severity dependencies"
```

If `package.json` is unchanged, stage only the lockfile.

---

### Task 7: Final Branch Verification and Hygiene

**Files:**
- Verify every modified and untracked path.
- Update: `docs/superpowers/specs/2026-06-19-branch-readiness-remediation-design.md`
- Update: `docs/superpowers/plans/2026-06-19-branch-readiness-remediation.md`

- [ ] **Step 1: Run the complete backend gate**

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd test
```

Expected: zero failures and errors.

- [ ] **Step 2: Run the complete frontend gate**

```powershell
cd ..\frontend
npm test -- --run
npm run build
npm audit --omit=dev --audit-level=high
```

Expected: zero test failures, build exit 0, audit exit 0.

- [ ] **Step 3: Verify the diff and classify the working tree**

```powershell
cd ..
git diff --check
git status --short --branch
git diff --stat
```

Review every path. Do not run destructive restore, reset, checkout, or cleanup
commands. Keep unrelated user work unstaged and report it.

- [ ] **Step 4: Commit the remediation documentation if still uncommitted**

```powershell
git add docs/superpowers/specs/2026-06-19-branch-readiness-remediation-design.md docs/superpowers/plans/2026-06-19-branch-readiness-remediation.md
git commit -m "docs: record branch readiness remediation"
```

- [ ] **Step 5: Report branch readiness**

Report exact backend/frontend test counts, build status, dependency audit result,
`git diff --check`, remaining unstaged paths, and commit list. Do not call the
branch ready if any required gate is red.

