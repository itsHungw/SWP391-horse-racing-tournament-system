# Account Enforcement Appeal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let suspended and banned users submit and track one appeal for their current enforcement decision through the shared dispute system.

**Architecture:** A dedicated `/me/account-appeal` controller derives the requester and latest enforcement history from authentication, then delegates dispute creation to a focused account-appeal service. The shared dispute table stores the case; a locked history row plus a PostgreSQL partial unique index prevents duplicates. The restricted page renders a specialized appeal card and responsive modal rather than exposing the generic spectator form.

**Tech Stack:** Java 21, Spring Boot, Spring Data JPA, PostgreSQL/Flyway, React, TypeScript, Tailwind CSS, Vitest

---

### Task 1: Add the account-appeal domain constraints

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/dispute/enums/DisputeReferenceType.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/dispute/enums/DisputeRole.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/dispute/repository/DisputeRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserStatusHistoryRepository.java`
- Create: `backend/src/main/resources/db/migration/V29__account_enforcement_appeal_guard.sql`

- [ ] **Step 1: Add the account-specific enum values**

```java
// DisputeReferenceType
ACCOUNT_ENFORCEMENT

// DisputeRole
ACCOUNT_HOLDER
```

- [ ] **Step 2: Add repository lookups for duplicate and current appeal data**

```java
boolean existsByRequesterIdAndReferenceTypeAndReferenceId(
        Long requesterId, DisputeReferenceType referenceType, Long referenceId);

Optional<Dispute> findByRequesterIdAndReferenceTypeAndReferenceId(
        Long requesterId, DisputeReferenceType referenceType, Long referenceId);
```

Add a locked latest-history query:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("""
       SELECT h FROM UserStatusHistory h
       WHERE h.user.id = :userId
       ORDER BY h.changedAt DESC, h.id DESC
       """)
List<UserStatusHistory> findLatestByUserIdForUpdate(
        @Param("userId") Long userId, Pageable pageable);
```

The service calls this method with `PageRequest.of(0, 1)` and uses the first result. This avoids non-portable JPQL `LIMIT` syntax while retaining a pessimistic lock.

- [ ] **Step 3: Add the production database uniqueness guard**

```sql
CREATE UNIQUE INDEX uq_disputes_account_enforcement_decision
    ON disputes (requester_id, reference_type, reference_id)
    WHERE reference_type = 'ACCOUNT_ENFORCEMENT';
```

- [ ] **Step 4: Compile the backend**

Run: `backend\mvnw.cmd -f backend\pom.xml -DskipTests package`

Expected: exit code 0 and no duplicate Flyway migration version.

- [ ] **Step 5: Commit the domain guard**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/dispute backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserStatusHistoryRepository.java backend/src/main/resources/db/migration/V29__account_enforcement_appeal_guard.sql
git commit -m "feat: add account appeal domain guard"
```

### Task 2: Implement the owner-scoped appeal API with TDD

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/dispute/dto/CreateAccountAppealRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/dispute/dto/AccountAppealResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/dispute/service/AccountAppealService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/dispute/controller/AccountAppealController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/dispute/service/DisputeService.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/dispute/AccountAppealIntegrationTest.java`

- [ ] **Step 1: Write failing integration tests**

Cover these exact cases with MockMvc and authenticated JWTs:

```java
@Test void suspendedUserCreatesAppealForLatestDecision() { /* expect 201, decisionStatus SUSPENDED, appeal OPEN */ }
@Test void bannedUserCreatesAppealForLatestDecision() { /* expect 201 */ }
@Test void duplicateAppealForSameDecisionReturnsConflict() { /* second POST expects 409 */ }
@Test void activeUserWithoutRestrictedDecisionCannotAppeal() { /* expects 409 */ }
@Test void suppliedDecisionIdCannotOverrideServerSelectedDecision() { /* include another ID, assert response uses latest owned decision */ }
@Test void resolvingAppealDoesNotChangeAccountOrWalletStatus() { /* admin resolves, then assert original states */ }
```

Use request JSON containing only:

```json
{
  "description": "The activity was mine and I can provide supporting context.",
  "evidenceUrls": ["/api/v1/files/download/evidence-1"]
}
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `backend\mvnw.cmd -f backend\pom.xml "-Dtest=AccountAppealIntegrationTest" test`

Expected: compilation or 404 failures because the account-appeal API does not exist.

- [ ] **Step 3: Add validated DTOs**

```java
public record CreateAccountAppealRequest(
        @NotBlank @Size(max = 3000) String description,
        @Size(max = 5) List<@NotBlank @Size(max = 512) String> evidenceUrls) {}

public record AccountAppealResponse(
        Long decisionId,
        UserStatus decisionStatus,
        String decisionReason,
        LocalDateTime decisionAt,
        DisputeResponse appeal) {}
```

- [ ] **Step 4: Implement account-appeal orchestration**

`AccountAppealService.getCurrent(User)` loads the latest history and its linked dispute. `create(User, request)` locks the latest history row, requires current and decision statuses to be `SUSPENDED` or `BANNED`, rejects any existing linked dispute, and creates:

```java
Dispute.builder()
    .requester(user)
    .requesterRole(DisputeRole.ACCOUNT_HOLDER)
    .handlerRole(DisputeRole.ADMIN)
    .referenceType(DisputeReferenceType.ACCOUNT_ENFORCEMENT)
    .referenceId(history.getId())
    .category(DisputeCategory.DISCIPLINARY)
    .title("Appeal of " + history.getNewStatus() + " decision")
    .description(request.description().trim())
    .build();
```

Reuse a package-visible or public `DisputeService.toResponse(Dispute)` mapper and its attachment creation rules instead of duplicating response mapping.

- [ ] **Step 5: Add the authenticated controller**

```java
@RestController
@RequestMapping("/api/v1/me/account-appeal")
@RequiredArgsConstructor
class AccountAppealController {
    private final AccountAppealService accountAppealService;
    private final UserRepository userRepository;

    @GetMapping
    AccountAppealResponse get(Authentication auth) {
        return accountAppealService.getCurrent(currentUser(auth));
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    AccountAppealResponse create(@Valid @RequestBody CreateAccountAppealRequest request, Authentication auth) {
        return accountAppealService.create(currentUser(auth), request);
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
```

- [ ] **Step 6: Run the focused tests and confirm GREEN**

Run: `backend\mvnw.cmd -f backend\pom.xml "-Dtest=AccountAppealIntegrationTest" test`

Expected: all six tests pass.

- [ ] **Step 7: Commit the API**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/dispute backend/src/test/java/com/example/horseracingtournamentsystem/dispute/AccountAppealIntegrationTest.java
git commit -m "feat: add owner-scoped account appeals"
```

### Task 3: Permit only the required restricted-account operations

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/AccountAccessPolicy.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/security/AccountAccessPolicyTest.java`

- [ ] **Step 1: Write a policy matrix test**

Create a parameterized matrix for suspended/banned GET and POST on `/api/v1/me/account-appeal`, plus denied POST `/api/v1/spectator/disputes` and denied DELETE `/api/v1/files/evidence-1`. Add a separate upload test that sets `category=DISPUTE_EVIDENCE` and expects true, then changes it to `AVATAR` and expects false.

For upload, include query `category=DISPUTE_EVIDENCE` and require the policy to inspect that exact category; a generic file upload must remain denied.

- [ ] **Step 2: Run the policy test and confirm RED**

Run: `backend\mvnw.cmd -f backend\pom.xml "-Dtest=AccountAccessPolicyTest" test`

- [ ] **Step 3: Add exact allowlist predicates**

```java
private boolean isAccountAppealAccess(String method, String path) {
    return path.equals("/api/v1/me/account-appeal")
            && (isSafe(method) || HttpMethod.POST.matches(method));
}

private boolean isAppealEvidenceUpload(HttpServletRequest request) {
    return HttpMethod.POST.matches(request.getMethod())
            && request.getRequestURI().equals("/api/v1/files/upload")
            && "DISPUTE_EVIDENCE".equalsIgnoreCase(request.getParameter("category"));
}
```

Apply both predicates to suspended and banned branches without adding a broad prefix.

- [ ] **Step 4: Run policy and appeal tests**

Run: `backend\mvnw.cmd -f backend\pom.xml "-Dtest=AccountAccessPolicyTest,AccountAppealIntegrationTest" test`

Expected: all tests pass.

- [ ] **Step 5: Commit the policy**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/security/AccountAccessPolicy.java backend/src/test/java/com/example/horseracingtournamentsystem/security/AccountAccessPolicyTest.java
git commit -m "fix: allow narrow restricted account appeals"
```

### Task 4: Build the specialized restricted-page appeal UI

**Files:**
- Create: `frontend/src/api/accountAppealApi.ts`
- Create: `frontend/src/pages/account/AccountAppealCard.tsx`
- Create: `frontend/src/pages/account/AccountAppealModal.tsx`
- Modify: `frontend/src/pages/account/AccountRestrictedPage.tsx`
- Test: `frontend/src/pages/account/AccountRestrictedPage.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Mock `accountAppealApi` and cover:

Use four named tests: `opens a specialized appeal form for a decision without an appeal`, `preserves the explanation when submission fails`, `shows under review and removes duplicate submit action`, and `shows an admin resolution without changing account copy`. Each test mocks both restriction and appeal GET calls before rendering the authenticated route.

- [ ] **Step 2: Run the test and confirm RED**

Run: `npm --prefix frontend test -- AccountRestrictedPage.test.tsx --run`

- [ ] **Step 3: Add typed API functions**

```ts
export type AccountAppeal = {
  decisionId: number;
  decisionStatus: "SUSPENDED" | "BANNED";
  decisionReason: string;
  decisionAt: string;
  appeal: DisputeResponse | null;
};

export const getCurrentAccountAppeal = () => httpClient.get<AccountAppeal>("/me/account-appeal").then(r => r.data);
export const submitAccountAppeal = (description: string, evidenceUrls: string[]) =>
  httpClient.post<AccountAppeal>("/me/account-appeal", { description, evidenceUrls }).then(r => r.data);
```

- [ ] **Step 4: Implement card and responsive dialog states**

`AccountAppealCard` maps `OPEN`, `IN_PROGRESS`, and `ESCALATED` to `Under review`; terminal statuses show `resolutionNote`. `AccountAppealModal` contains the read-only decision summary, one explanation textarea, optional image upload through `disputeApi.uploadEvidence`, the non-automatic-unlock notice, preserved values after failure, and an in-place success state.

Use desktop centered positioning and mobile bottom alignment:

```tsx
<div className="fixed inset-0 z-50 flex items-end bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
  <section role="dialog" aria-modal="true" aria-labelledby="appeal-title" className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:max-w-xl sm:rounded-3xl">
    <h2 id="appeal-title">Appeal this decision</h2>
    <p>Submitting an appeal does not automatically restore account or wallet access.</p>
  </section>
</div>
```

- [ ] **Step 5: Integrate into the restricted page**

Fetch account restriction and current appeal together after authentication. Render the card below decision details. On successful submission, replace local appeal state with the response and leave account/wallet state unchanged.

- [ ] **Step 6: Run the focused UI tests and production build**

Run:

```powershell
npm --prefix frontend test -- AccountRestrictedPage.test.tsx --run
npm --prefix frontend run build
```

Expected: tests and build pass.

- [ ] **Step 7: Commit the user appeal UI**

```powershell
git add frontend/src/api/accountAppealApi.ts frontend/src/pages/account
git commit -m "feat: add restricted account appeal UX"
```

### Task 5: Add admin enforcement context and complete verification

**Files:**
- Modify: `frontend/src/pages/admin/components/AdminDisputeDetailModal.tsx`
- Modify: `frontend/src/api/disputeApi.ts`
- Test: `frontend/src/pages/admin/components/AdminDisputeDetailModal.test.tsx`

- [ ] **Step 1: Write a failing admin-context test**

Render an `ACCOUNT_ENFORCEMENT` dispute, mock `getAdminUserStatusHistory(requesterId)`, and expect `Account enforcement`, the original decision reason matched by `referenceId`, and a link to `/admin/users/{requesterId}`. Assert that changing dispute status calls only `updateDisputeStatus`, never an account enforcement endpoint.

- [ ] **Step 2: Add frontend enum support and context UI**

Extend types with `ACCOUNT_HOLDER` and `ACCOUNT_ENFORCEMENT`. For account appeals, load status history through the existing admin-user API, match the item whose ID equals the dispute `referenceId`, render the context block and `Review account enforcement` link, and keep status resolution controls unchanged.

- [ ] **Step 3: Run all focused feature checks once**

```powershell
backend\mvnw.cmd -f backend\pom.xml "-Dtest=AccountAppealIntegrationTest,AccountAccessPolicyTest,AccountEnforcementIntegrationTest,WalletEnforcementIntegrationTest" test
npm --prefix frontend test -- AccountRestrictedPage.test.tsx AdminDisputeDetailModal.test.tsx --run
npm --prefix frontend run build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit admin context**

```powershell
git add frontend/src/api/disputeApi.ts frontend/src/pages/admin/components/AdminDisputeDetailModal.tsx frontend/src/pages/admin/components/AdminDisputeDetailModal.test.tsx
git commit -m "feat: show enforcement context in appeal review"
```
