# Role Dashboard Participation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow personal users to hold multiple global roles, choose dashboard context from the public header profile pill, and prevent one user from actively joining the same tournament through more than one personal role.

**Architecture:** Keep existing domain tables as the source of participation truth. Add a small backend guard service that checks active owner, jockey, and referee records before creating or activating participation. Update the client header to expose role dashboards from the authenticated profile dropdown without adding a login interstitial.

**Tech Stack:** Spring Boot, Spring MVC integration tests, Spring Data JPA repositories, React, React Router, Vitest, Testing Library.

---

## File Structure

- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/UserRolePolicy.java` to distinguish personal roles from organizer business role.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/UserRoleRequestService.java` to allow multiple personal role requests and block personal requests for organizer accounts.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AdminRoleRequestService.java` to keep approval-time organizer conflict protection.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/enums/TournamentParticipationRole.java`.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentParticipationGuardService.java`.
- Modify `TournamentRegistrationRepository`, `JockeyTournamentApplicationRepository`, `TournamentParticipantRepository`, and `RefereeContractRepository` only where a missing existence query is needed.
- Modify `TournamentRegistrationService`, `JockeyPoolApplicationService`, and `RefereeContractService` to call the guard.
- Modify backend integration tests in existing test classes and add a focused referee contract conflict test if none exists.
- Create `frontend/src/components/client/ClientHeader.test.tsx` or extend `frontend/src/App.test.tsx` for header behavior.
- Modify `frontend/src/components/client/ClientHeader.tsx` for the profile pill dashboard switcher.
- Modify `frontend/src/routes/AppRouter.tsx` so owner routes require `HORSE_OWNER`.

## Task 1: Global Personal Role Policy

**Files:**
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/user/UserRoleRequestIntegrationTest.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/user/AdminRoleRequestIntegrationTest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/UserRolePolicy.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/UserRoleRequestService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AdminRoleRequestService.java`

- [x] **Step 1: Write failing integration tests**

Add tests proving an active personal role and a pending different personal role do not block another personal role request:

```java
@Test
void userCanRequestAnotherPersonalRoleWhenAlreadyHasActivePersonalRole() throws Exception {
    User user = userRepository.findWithUserRolesByEmail("quan@example.com").orElseThrow();
    Role jockeyRole = roleRepository.findByName("JOCKEY").orElseThrow();
    userRoleRepository.save(UserRole.active(user, jockeyRole, user));

    mockMvc.perform(post("/api/v1/role-requests")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {
                                "requestedRole": "HORSE_OWNER",
                                "reason": "I want to manage ownership workflows after joining the circuit.",
                                "resumeUrl": "https://example.com/resumes/owner.pdf"
                            }
                            """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requestedRole").value("HORSE_OWNER"))
            .andExpect(jsonPath("$.status").value("PENDING"));
}

@Test
void userCanRequestDifferentPersonalRoleWhenAnotherPersonalRequestIsPending() throws Exception {
    User user = userRepository.findByEmail("quan@example.com").orElseThrow();
    roleRequestRepository.save(RoleRequest.pending(
            user,
            "JOCKEY",
            "I have race-day experience and want to join tournament lineups.",
            "https://example.com/resumes/jockey.pdf"
    ));

    mockMvc.perform(post("/api/v1/role-requests")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {
                                "requestedRole": "REFEREE",
                                "reason": "I want to support tournament integrity and review workflows.",
                                "resumeUrl": "https://example.com/resumes/referee.pdf"
                            }
                            """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requestedRole").value("REFEREE"));
}
```

Add a test proving active `ORGANIZER` blocks personal role requests:

```java
@Test
void organizerAccountCannotRequestPersonalParticipationRole() throws Exception {
    Role organizerRole = roleRepository.save(Role.of("ORGANIZER", "Organizer"));
    User user = userRepository.findWithUserRolesByEmail("quan@example.com").orElseThrow();
    userRoleRepository.save(UserRole.active(user, organizerRole, user));

    mockMvc.perform(post("/api/v1/role-requests")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {
                                "requestedRole": "JOCKEY",
                                "reason": "I want to ride in selected championships.",
                                "resumeUrl": "https://example.com/resumes/jockey.pdf"
                            }
                            """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Organizer accounts cannot request personal participation roles"));
}
```

- [x] **Step 2: Verify RED**

Run:

```bash
cd backend
./mvnw -Dtest=UserRoleRequestIntegrationTest test
```

Expected: tests that allow multiple personal roles fail with the old specialist lock.

- [x] **Step 3: Implement role policy**

Change `UserRolePolicy` to expose `PERSONAL_ROLES`, `BUSINESS_ROLES`, `isPersonalRole`, and `hasActiveBusinessRole`. Remove the "any specialist role blocks all specialist roles" behavior from submit and approval services. Keep duplicate pending checks for the same requested role.

In `UserRoleRequestService.submit`, add:

```java
if (UserRolePolicy.isPersonalRole(requestedRole) && UserRolePolicy.hasActiveBusinessRole(user)) {
    throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Organizer accounts cannot request personal participation roles");
}
```

In `AdminRoleRequestService.approve`, add the same organizer conflict before assignment.

- [x] **Step 4: Verify GREEN**

Run:

```bash
cd backend
./mvnw -Dtest=UserRoleRequestIntegrationTest,AdminRoleRequestIntegrationTest test
```

Expected: role request tests pass.

## Task 2: Tournament Participation Guard

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/enums/TournamentParticipationRole.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentParticipationGuardService.java`
- Modify: `TournamentRegistrationRepository.java`
- Modify: `TournamentParticipantRepository.java`
- Modify: `TournamentRegistrationService.java`
- Modify: `JockeyPoolApplicationService.java`
- Modify: `RefereeContractService.java`
- Modify tests: `TournamentRegistrationIntegrationTest.java`, `JockeyPoolApplicationIntegrationTest.java`, and a referee contract integration test.

- [x] **Step 1: Write failing conflict tests**

Add owner-vs-jockey conflict test in `TournamentRegistrationIntegrationTest` by assigning the owner user the jockey role and saving a pending jockey application for the same tournament, then posting owner registration and expecting `409`.

Add jockey-vs-owner conflict test in `JockeyPoolApplicationIntegrationTest` by assigning the jockey user the owner role and saving an active owner registration for the same tournament, then posting a jockey pool application and expecting `409`.

Add referee acceptance conflict test by creating a pending referee contract for a user who already has owner or jockey active participation in that tournament, then accepting the contract and expecting `409`.

Expected message:

```text
You are already participating in this tournament as HORSE_OWNER. Use that dashboard or leave that participation before joining with another role.
```

- [x] **Step 2: Verify RED**

Run the narrow backend tests:

```bash
cd backend
./mvnw -Dtest=TournamentRegistrationIntegrationTest,JockeyPoolApplicationIntegrationTest test
```

Expected: new conflict tests fail because no cross-role guard exists.

- [x] **Step 3: Implement guard service**

Create:

```java
public enum TournamentParticipationRole {
    HORSE_OWNER,
    JOCKEY,
    REFEREE
}
```

Create a service with:

```java
public void assertNoConflictingParticipation(
        Long tournamentId,
        User user,
        TournamentParticipationRole requestedRole
) {
    findActiveParticipationRole(tournamentId, user)
            .filter(existingRole -> existingRole != requestedRole)
            .ifPresent(existingRole -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "You are already participating in this tournament as " + existingRole
                                + ". Use that dashboard or leave that participation before joining with another role.");
            });
}
```

The service checks active owner registrations, active jockey applications or participants, and active referee contracts using repository existence queries.

- [x] **Step 4: Wire guard into services**

Call the guard:

```java
participationGuard.assertNoConflictingParticipation(
        tournament.getId(),
        owner,
        TournamentParticipationRole.HORSE_OWNER
);
```

Use equivalent calls in jockey apply, referee invite, and referee accept.

- [x] **Step 5: Verify GREEN**

Run:

```bash
cd backend
./mvnw -Dtest=TournamentRegistrationIntegrationTest,JockeyPoolApplicationIntegrationTest test
```

Then run any referee contract test added for this task.

Expected: new conflict tests pass.

## Task 3: Profile Pill Dashboard Switcher

**Files:**
- Modify: `frontend/src/components/client/ClientHeader.tsx`
- Modify: `frontend/src/App.test.tsx` or create `frontend/src/components/client/ClientHeader.test.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`

- [x] **Step 1: Write failing frontend tests**

Add tests that render a multi-role session and open the account menu:

```tsx
setClientSession(createTokenWithRoles(["SPECTATOR", "HORSE_OWNER", "JOCKEY", "REFEREE", "ORGANIZER"]), "Multi Role", "multi@example.com");
render(<App />);
fireEvent.click(screen.getByRole("button", { name: /account/i }));

expect(screen.getByRole("link", { name: /owner dashboard/i })).toHaveAttribute("href", "/owner/dashboard");
expect(screen.getByRole("link", { name: /jockey dashboard/i })).toHaveAttribute("href", "/jockey/dashboard");
expect(screen.getByRole("link", { name: /referee dashboard/i })).toHaveAttribute("href", "/referee/dashboard");
expect(screen.getByText(/business workspace/i)).toBeInTheDocument();
expect(screen.getByRole("link", { name: /organizer dashboard/i })).toHaveAttribute("href", "/organizer");
```

Add a route guard test:

```tsx
window.history.pushState({}, "", "/owner/dashboard");
setClientSession(createTokenWithRoles(["SPECTATOR"]), "Fan User", "fan@example.com");
render(<App />);
expect(screen.getByRole("heading", { name: /owner workspace is not active/i })).toBeInTheDocument();
```

- [x] **Step 2: Verify RED**

Run:

```bash
cd frontend
npm test -- --run App.test.tsx
```

Expected: new tests fail because the account menu only has a single `Dashboard` link and owner routes are auth-only.

- [x] **Step 3: Implement switcher UI**

Replace the single dashboard link with grouped dashboard links. Keep existing wallet/profile/logout behavior. The desktop and mobile account menus should expose the same role choices.

Minimum labels:

```text
Personal dashboards
Spectator Mode
Owner Dashboard
Jockey Dashboard
Referee Dashboard
Business workspace
Organizer Dashboard
```

Keep `ADMIN` dashboard access if present as a platform workspace to avoid regression.

- [x] **Step 4: Guard owner routes**

Replace owner `authRoute` entries in `AppRouter.tsx` with a `RequireRoleRoute role="HORSE_OWNER"` helper.

- [x] **Step 5: Verify GREEN**

Run:

```bash
cd frontend
npm test -- --run App.test.tsx
npm run build
```

Expected: frontend tests and build pass.

## Task 4: Full Verification

**Files:**
- No new files expected.

- [x] **Step 1: Run backend focused suite**

```bash
cd backend
./mvnw -Dtest=UserRoleRequestIntegrationTest,AdminRoleRequestIntegrationTest,TournamentRegistrationIntegrationTest,JockeyPoolApplicationIntegrationTest,RefereeContractIntegrationTest test
```

- [x] **Step 2: Run frontend focused suite**

```bash
cd frontend
npm test -- --run App.test.tsx
npm run build
```

- [x] **Step 3: Review diff**

```bash
git diff --stat
git diff --check
```

Expected: no whitespace errors; changes limited to role policy, participation guard, routes, header, tests, spec, and plan.

## Self-Review

Spec coverage:
- Multi-role personal users are covered by Task 1.
- Organizer lane separation is covered by Task 1 and Task 3.
- One active role per tournament is covered by Task 2.
- Public-first profile pill switcher is covered by Task 3.
- Tests and verification are covered by Tasks 1-4.

Placeholder scan:
- No TBD/TODO/placeholder steps remain.

Type consistency:
- `TournamentParticipationRole.HORSE_OWNER`, `JOCKEY`, and `REFEREE` match global role names and expected error messages.

## Execution Evidence

- Backend focused suite passed: `33` tests, `0` failures, `0` errors.
- Frontend focused suite passed: `18` tests, `0` failures.
- Frontend production build completed with the existing Vite chunk-size warning.
- `git diff --check` completed with no whitespace errors.

## UX Amendment: 2026-06-28

- Profile pill was adjusted to show wallet balance instead of `Public workspace`.
- Dashboard choices were collapsed behind a current-dashboard selector so role links only appear after opening `Change dashboard workspace`.
- Frontend role-request UI was updated to match backend policy: a pending or active personal role only blocks that same role, not other personal role applications.
