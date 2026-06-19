# Branch Readiness Remediation Design

Date: 2026-06-19
Status: APPROVED FOR WRITTEN REVIEW

## Goal

Bring `feat/forget-password` to a clean, reviewable branch state without expanding
the work into a full production-hardening program.

This remediation must:

- make password reset atomic on its successful path;
- prevent concurrent OTP issuance, reuse, and failed-attempt races;
- close the current rate-limit spoofing and unbounded-memory weaknesses;
- restore the backend and frontend test baselines to green by fixing each
  regression according to its approved product contract;
- remove the two currently reported high-severity frontend dependency findings;
- leave a clean, intentionally scoped Git diff that can be committed and merged.

## Scope

### In Scope

- Password-reset transaction boundaries and error semantics.
- Database locking for password-reset token issuance and consumption.
- Failed OTP attempt persistence under rejected requests.
- Trusted-proxy handling for rate-limit client identity.
- Bounded, expiring in-memory rate-limit buckets.
- The four stable failures in `RaceIntegrationTest`.
- The eight stable frontend failures in five test files.
- Targeted remediation of the `form-data` and `vite` audit findings.
- Focused tests, full test suites, production frontend build, diff hygiene, and
  branch cleanup.

### Deferred

- Migration of legacy horse evidence and medical documents away from public
  `/uploads/**` access.
- Redis or gateway-backed distributed rate limiting.
- Full dependency-scanning infrastructure for Maven and containers.
- Frontend bundle splitting and performance optimization.
- Production Swagger/OpenAPI exposure policy and `open-in-view` cleanup.
- Unrelated UI redesigns or domain refactors.

Deferred items remain production-hardening backlog and do not block closing the
forgot-password feature branch.

## Verified Baseline

The remediation starts from the following reproduced state:

- focused password-reset backend suite: 16 tests passing;
- focused auth frontend suite: 11 tests passing;
- full backend suite: 173 tests, 4 failures, 1 skipped;
- full frontend suite: 223 tests, 8 failures;
- frontend production build: successful, with a non-blocking large-chunk warning;
- `npm audit --omit=dev`: 2 high findings (`form-data`, `vite`);
- `git diff --check`: passing;
- working tree: 19 modified files plus intended untracked feature files.

The full-suite failures reproduce when their suites run in isolation. They are
not caused by test-order contamination.

## Design Decisions

### 1. Use One Service-Level Success Transaction

`AuthService.resetPassword(...)` owns the transaction that covers:

1. loading the active user;
2. locking and consuming the matching password-reset token;
3. hashing and changing the password;
4. revoking every active refresh session;
5. flushing all changes.

Any unexpected exception on this success path rolls back the token consumption,
password change, and session revocation together.

Expected reset rejection is different from an unexpected failure. A wrong OTP
must increment and persist `failed_attempts`, even though the API returns
`400 Bad Request`. Introduce a dedicated password-reset rejection exception and
configure the outer transaction so this specific exception does not roll back.
Do not apply `noRollbackFor = IllegalArgumentException.class`, because that class
is too broad and would weaken rollback guarantees for unrelated programming and
validation errors.

The intended transaction declaration is equivalent to:

```java
@Transactional(
        rollbackFor = Exception.class,
        noRollbackFor = PasswordResetRejectedException.class
)
```

Spring Data recommends defining multi-repository transactions at a service
facade. The repository lock queries therefore execute inside this active outer
transaction.

### 2. Serialize OTP Issuance and Consumption with Pessimistic Locks

Use `LockModeType.PESSIMISTIC_WRITE` rather than optimistic retry for this phase.
One-time token operations are short, low-volume critical sections, and the
desired behavior is for a competing request to wait and then observe the updated
`used_at` or lock state.

Add dedicated locking repository queries instead of changing general-purpose
lookups used by unrelated auth flows:

- lock the user row before invalidating old tokens and issuing a new OTP;
- lock the matching unused token before successful consumption;
- lock the latest unused token before incrementing a wrong-attempt counter.

Locking the user row is required because locking existing token rows alone cannot
serialize two first-time issuance requests when no token row exists yet.

After a concurrent successful reset, the waiting request must observe no usable
token and return the same generic reset rejection. After five serialized wrong
attempts, the token remains locked even if later requests submit the correct OTP.

### 3. Keep Reset Errors Generic at the API Boundary

Internal exceptions may distinguish invalid, expired, locked, and concurrently
consumed tokens for tests and logging. The public response must continue to avoid
account enumeration and return the existing generic reset error contract.

Do not log raw OTPs in production. The development-only logging sender may retain
its current behavior because it is activated only when real mail is disabled,
but production configuration must continue to use the SMTP sender.

### 4. Trust No Forwarding Header by Default

`RateLimitingFilter` must not accept `X-Forwarded-For` solely because the header
is present. The default client key is `request.getRemoteAddr()`.

Forwarded client identity is accepted only when the direct peer address belongs
to an explicit `app.security.trusted-proxies` allowlist supplied by the deployment.
When trusted, use only the first normalized address from `X-Forwarded-For`.

Setting `server.forward-headers-strategy=framework` alone is not considered a
security boundary; the edge proxy must strip client-supplied forwarding headers,
and the application still needs an explicit trust decision.

### 5. Bound the In-Memory Rate-Limit Store

Replace the unbounded `ConcurrentHashMap<String, Bucket>` with a Caffeine
`Cache<String, Bucket>` configured with:

- a configurable maximum size, default `50_000` keys;
- time-based expiry at least as long as the largest configured rate-limit window
  plus a safety margin;
- a default expiry of 20 minutes for the current 15-minute auth windows.

Caffeine officially supports `maximumSize(...)` and `expireAfterWrite(...)` in
its builder. Expiring buckets earlier than the configured rate window is not
allowed because it would silently weaken the limit.

This remains a single-instance best-effort limiter. Cross-instance consistency
is explicitly deferred to Redis or an edge gateway.

## Regression Restoration

### Backend: `RaceIntegrationTest`

The four failures are not caused by `RateLimitingFilter`:

1. two assertions expect `serverNow`, while the approved public-racing design
   treats server clock metadata as optional;
2. `/api/v1/races/calendar-summary` is captured by `/{id}` and returns 500, while
   the approved Phase 1 calendar design uses the normal paginated race list for
   the visible date range rather than a calendar-summary endpoint;
3. the official-result horse/jockey filter returns two rows instead of one,
   showing that the advertised server-side filter is not being applied correctly.

Remediation follows the approved product contract:

- remove stale `serverNow` assertions rather than introducing an undocumented
  mandatory response field;
- replace the obsolete calendar-summary test with visible-range pagination
  coverage against `GET /api/v1/races`;
- fix the real horse/jockey filtering defect and retain a regression test proving
  only matching official results are returned.

Tests must not be changed merely to silence failures; each changed assertion must
reference the current discovery design or observable user behavior.

### Frontend

The eight failures fall into three categories:

- stale copy/layout assertions in `App.test.tsx`,
  `AdminTournamentDetailPage.test.tsx`, and
  `AdminTournamentListPage.test.tsx`;
- submit-result tests that no longer complete the current confirmation/validation
  flow, leaving `submitRaceResultPackage` uncalled;
- two spectator-prediction tests using an ambiguous accessible query because both
  the step rail and action control are named `Review ticket`.

For each failure, first reproduce the user flow and compare it with the current
component. Update stale assertions only when current behavior matches the approved
UX. Fix production behavior when the user cannot complete the flow. Accessible
selectors must identify the actionable button without depending on CSS classes or
DOM position.

## Dependency Hardening

Do not run a blind major-version upgrade.

1. Capture `npm audit --omit=dev --json` before changes.
2. Inspect the proposed `npm audit fix --dry-run` result.
3. Update the lockfile to a non-vulnerable `form-data` release through the Axios
   dependency tree.
4. Update Vite and compatible Vite plugins within the smallest supported range
   that clears the reported advisories.
5. Run focused frontend tests, the full frontend suite, `npm run build`, and a
   second production-only audit.

Acceptance requires zero high or critical findings in the production dependency
audit. A major Vite migration is out of scope unless no compatible patched release
exists; in that case, record it as a blocker instead of forcing an unsafe upgrade.

## Git Hygiene and Commit Strategy

Preserve all existing user work. Do not discard files with `git checkout`,
`git restore`, reset, or cleanup commands during remediation.

Classify every modified and untracked path as one of:

- forgot-password implementation;
- branch-readiness remediation;
- pre-existing unrelated user work.

Stage explicit paths or use `git add -p` after reviewing every hunk. Unrelated
work remains unstaged and is reported to the user. Use small reviewable commits:

1. `fix(auth): make password reset consumption atomic`
2. `fix(security): bound and harden application rate limits`
3. `fix(racing): restore public race API contract tests`
4. `test(frontend): align critical flows with current behavior`
5. `chore(frontend): remediate high severity dependencies`

A final squash is optional and must be a deliberate integration choice, not part
of the implementation steps.

## Test Strategy

### Password Reset

Add integration coverage for:

- successful reset consumes the OTP, updates the password, and revokes sessions;
- forced failure after token consumption rolls back token, password, and sessions;
- wrong OTP persists one failed attempt while returning 400;
- five wrong attempts lock the token;
- concurrent correct submissions yield exactly one success;
- concurrent OTP issuance leaves exactly one active token;
- an old OTP is invalid after resend;
- an already used OTP cannot be reused.

Concurrency tests use real Spring transactions and the test database rather than
Mockito-only verification.

### Rate Limiting

Add tests for:

- untrusted `X-Forwarded-For` cannot change the client key;
- trusted proxy forwarding uses the normalized client IP;
- forgot, verify, and reset endpoints retain their dedicated limits;
- cache size is bounded;
- an expired bucket is removed and a new window begins;
- bucket expiry is never shorter than the applicable rule window.

### Regression and Build Gates

The branch is ready only when all commands pass:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd test

cd ..\frontend
npm test -- --run
npm run build
npm audit --omit=dev --audit-level=high

cd ..
git diff --check
git status --short --branch
```

## Acceptance Criteria

The remediation is complete when:

- password reset has one atomic success transaction;
- expected OTP rejection persists its attempt counter;
- concurrent issuance leaves one active OTP;
- concurrent consumption permits one successful password reset;
- raw forwarding headers cannot bypass rate limiting from an untrusted peer;
- rate-limit state is bounded and expires no earlier than its policy window;
- all backend and frontend tests pass with zero failures;
- the frontend production build succeeds;
- the production npm audit reports zero high or critical findings;
- `git diff --check` passes;
- every working-tree path is classified and only intended changes are staged;
- legacy private-file migration remains documented as deferred backlog.

