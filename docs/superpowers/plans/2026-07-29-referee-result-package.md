# Referee Result Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `SubmitResultsPage` the single place a referee assembles and submits a race result — placings, incidents and jockey objections, and the official report — and give the organizer both the visibility to review it and a send-back loop the referee can act on.

**Architecture:** Frontend-heavy. Objections reuse the existing `violations` table via the already-accepted-but-never-sent `violationType` and `penalty` fields, so there is no migration. The backend gains one read endpoint (violations + report for the organizer) and one behaviour fix (send-back reason moves off `RaceResult.note` onto `RefereeReport.rejectionReason`).

**Tech Stack:** React 19 + TypeScript + Tailwind + vitest/RTL (frontend); Spring Boot + JPA + MockMvc (backend).

## Global Constraints

- **No new table and no new column.** Objections are rows in `violations`.
- `violationType` values, exactly: `OBJECTION_INTERFERENCE`, `OBJECTION_GENERAL`, `INCIDENT`.
- `penalty` decision codes, exactly: `NO_CHANGE`, `RIDER_PENALTY`, `RESULT_AMENDED`.
- `severity` keeps its existing values: `LOW`, `MEDIUM`, `HIGH`.
- Objections may only be recorded while `race.status === "FINISHED"`. There is no late-objection path and nothing ever blocks the organizer's Confirm button.
- Never touch settlement. `predictionService.createSettlementJob` fires at `RESULT_CONFIRMED` and stays untouched.
- The referee UI must never display a race status the backend did not return.
- Backend integration tests follow the existing pattern: `@SpringBootTest @AutoConfigureMockMvc @Transactional`, which rolls back per test. Do not add `TestDatabaseCleaner` — that is only needed for non-`@Transactional` tests.
- Frontend tests mock with `vi.spyOn(refereeApi, "fn").mockResolvedValue(...)` after a module-level `vi.mock("../../api/refereeApi")`.

**Prerequisite:** `develop` must already be merged into `fix/referee-confirm-result` and `npm install` re-run before starting Task 1.

---

## File Structure

**Backend**

| File | Responsibility |
|---|---|
| `referee/repository/ViolationRepository.java` | gains one finder so violations can be read back |
| `referee/dto/RaceIncidentResponse.java` (new) | one violation, flattened for the organizer |
| `race/dto/response/RaceReviewPackageResponse.java` (new) | violations + report summary for one race |
| `race/controller/OrganizerRaceController.java` | new `GET /{id}/review-package` |
| `race/service/RaceService.java` | builds the review package; send-back writes to the report |
| `referee/entity/RefereeReport.java` | gains `markReturned` / clears on `submit` |
| `referee/dto/RefereeRaceResponse.java` | gains `returnedReason` |
| `referee/service/RefereeRaceDayService.java` | `mapRace` populates `returnedReason` |

**Frontend**

| File | Responsibility |
|---|---|
| `api/refereeApi.ts` | objection payload types, `returnedReason` on `RaceSummary` |
| `api/racingApi.ts` | organizer review-package fetch |
| `pages/referee/race-day/ObjectionForm.tsx` (new) | the two objection form variants |
| `pages/referee/SubmitResultsPage.tsx` | the single submission screen |
| `pages/referee/race-day/RaceSummary.tsx` | demoted to a draft view |
| `pages/referee/RefereeOfficiatePage.tsx` | stops overriding race status |
| `pages/organizer/OrganizerResultsPage.tsx` | shows objections before ratifying |

---

## Task 1: Stop the UI reporting states and statuses the backend never returned

Defects A1, A2, F1, F2. Frontend only, no new API. Ships correctness immediately and is independently valuable even if nothing else lands.

**Files:**
- Modify: `frontend/src/pages/referee/RefereeOfficiatePage.tsx:425`
- Modify: `frontend/src/pages/referee/race-day/refereeRaceDayModels.ts` (`LiveRunner` gains `jockeyName`)
- Modify: `frontend/src/pages/referee/race-day/refereeRaceDayState.ts` (both runner builders populate it)
- Modify: `frontend/src/pages/referee/race-day/RaceSummary.tsx` (out-of-race label, submit payload)
- Test: `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `LiveRunner.jockeyName: string`; `outOfRaceStatusLabel(status: LiveRunner["status"]): string` and `outOfRaceResultStatus(status: LiveRunner["status"]): ParticipantResultEntry["status"]`, both exported from `RaceSummary.tsx`

> `LiveRunner` currently has no `jockeyName` field, which is why both submit paths send `jockeyName: ""`. Adding it is a prerequisite for fixing F2, not an optional extra.

- [ ] **Step 1: Write the failing tests**

`RefereeOfficiatePage.test.tsx` currently imports only `fireEvent, render, screen` from
`@testing-library/react` and defines its render helper as `renderPage()`. Add `waitFor` to that
import before writing the tests below.

In `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`, replace the existing
`expect(screen.getByText("DNF")).toBeInTheDocument();` assertion inside the test
`"shows did-not-finish and disqualified runners as read-only"` with:

```tsx
expect(screen.getByText("DNS")).toBeInTheDocument();
expect(screen.getByText("DSQ")).toBeInTheDocument();
```

Then add two new tests to the same file:

```tsx
it("submits a scratched runner as WITHDRAWN, not DID_NOT_FINISH", async () => {
  const submitSpy = vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();

  render(
    <RaceSummary
      raceId={9}
      snapshot={{
        elapsedMilliseconds: 62_345,
        leaderboard: [
          {
            participantId: 7,
            horseName: "Golden Arrow",
            gateNumber: 1,
            progressPercent: 100,
            speedMultiplier: 1,
            status: "RUNNING",
            finishMilliseconds: 62_345,
          },
        ],
        outOfRace: [
          {
            participantId: 5,
            horseName: "Thunderstrike",
            gateNumber: 2,
            progressPercent: 0,
            speedMultiplier: 1,
            status: "DNS",
          },
        ],
        incidents: [],
      }}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: /update finish order/i }));
  fireEvent.click(screen.getByRole("button", { name: /submit package to organizer/i }));

  await waitFor(() => expect(submitSpy).toHaveBeenCalled());
  const payload = submitSpy.mock.calls[0][1];
  const scratched = payload.results.find((entry) => entry.participantId === 5);
  expect(scratched?.status).toBe("WITHDRAWN");
});

it("does not claim the organizer confirmed the result after the referee submits", async () => {
  vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();
  vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
    id: 3,
    name: "Race 2",
    code: "R-2026-3",
    distanceMeters: 1300,
    status: "FINISHED",
  });

  renderPage();

  expect(await screen.findByText("Race 2")).toBeInTheDocument();
  expect(screen.queryByText("RESULT_CONFIRMED")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/pages/referee/RefereeOfficiatePage.test.tsx`
Expected: FAIL — `Unable to find an element with the text: DNS`, and the submit payload asserts `DID_NOT_FINISH`.

- [ ] **Step 3: Implement the mapping helpers and use them**

First give `LiveRunner` a jockey name. In `refereeRaceDayModels.ts` add `jockeyName: string;` to the
`LiveRunner` type, and in `refereeRaceDayState.ts` populate it in both builders:

```ts
// inside buildLiveRunners(...).map and buildScratchedRunners(...).map
jockeyName: participant.jockeyName,
```

Then in `frontend/src/pages/referee/race-day/RaceSummary.tsx`, add near the top:

```tsx
export function outOfRaceStatusLabel(status: LiveRunner["status"]): string {
  if (status === "DSQ") return "DSQ";
  if (status === "DNS") return "DNS";
  return "DNF";
}

export function outOfRaceResultStatus(status: LiveRunner["status"]): ParticipantResultEntry["status"] {
  if (status === "DSQ") return "DISQUALIFIED";
  if (status === "DNS") return "WITHDRAWN";
  return "DID_NOT_FINISH";
}

function outOfRaceNote(status: LiveRunner["status"]): string {
  if (status === "DSQ") return "Disqualified during live race control.";
  if (status === "DNS") return "Scratched at pre-race check; did not start.";
  return "Removed during live race control.";
}
```

Replace the badge expression in the "Did not finish / disqualified" list:

```tsx
{outOfRaceStatusLabel(runner.status)}
```

Replace the `removedEntries` mapping inside `confirmResultPackage`:

```tsx
const removedEntries: ParticipantResultEntry[] = snapshot.outOfRace.map((runner) => ({
  participantId: runner.participantId,
  horseName: runner.horseName,
  jockeyName: runner.jockeyName ?? "",
  position: "",
  rawFinishTimeSeconds: "",
  penaltySeconds: 0,
  finishTimeSeconds: "",
  status: outOfRaceResultStatus(runner.status),
  note: outOfRaceNote(runner.status),
}));
```

and fix the same empty field in `finishedEntries` in the same function:

```tsx
jockeyName: row.runner.jockeyName,
```

Change the section heading from `Did not finish / disqualified` to
`Did not start / did not finish / disqualified`.

In `frontend/src/pages/referee/RefereeOfficiatePage.tsx:425`, delete the status override so the
prop becomes a reload rather than a lie:

```tsx
onConfirmed={() => void load()}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/referee`
Expected: PASS, all files.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/referee && git commit -m "fix: stop referee UI reporting DNS as DNF and faking RESULT_CONFIRMED"
```

---

## Task 2: Expose violations and the referee report to the organizer

Defect G. Without this, an objection is written and nobody can read it.

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/referee/repository/ViolationRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/referee/dto/RaceIncidentResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/dto/response/RaceReviewPackageResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/controller/OrganizerRaceController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/race/OrganizerReviewPackageIntegrationTest.java`

**Interfaces:**
- Consumes: nothing
- Produces: `GET /api/v1/organizer/races/{id}/review-package` returning `RaceReviewPackageResponse(String reportTitle, String reportSummary, String returnedReason, List<RaceIncidentResponse> incidents)`; `RaceIncidentResponse(Long id, String violationType, Long participantId, String horseName, String jockeyName, String description, String penalty, String severity, LocalDateTime occurredAt)`

- [ ] **Step 1: Write the failing test**

Create `backend/src/test/java/com/example/horseracingtournamentsystem/race/OrganizerReviewPackageIntegrationTest.java`.
Copy the entity-setup block from `RefereeRaceResultValidationIntegrationTest` (same package layout,
same repositories) so the test owns a tournament, race, referee, organizer, horse and participant.
Then:

```java
@Test
@WithMockUser(username = "organizer@test.local", roles = {"ORGANIZER"})
void returnsIncidentsAndReportForTheOrganizer() throws Exception {
    violationRepository.save(Violation.create(
            race, participant, referee,
            "OBJECTION_INTERFERENCE",
            "[Objection] Emma Collins vs Liam Carter",
            "RIDER_PENALTY",
            "HIGH"
    ));

    mockMvc.perform(get("/api/v1/organizer/races/" + race.getId() + "/review-package"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.incidents.length()").value(1))
            .andExpect(jsonPath("$.incidents[0].violationType").value("OBJECTION_INTERFERENCE"))
            .andExpect(jsonPath("$.incidents[0].penalty").value("RIDER_PENALTY"))
            .andExpect(jsonPath("$.incidents[0].horseName").value(participant.getHorse().getName()));
}
```

Add the static imports `MockMvcRequestBuilders.get` and `MockMvcResultMatchers.jsonPath`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && ./mvnw test -Dtest=OrganizerReviewPackageIntegrationTest`
Expected: FAIL — 404, no handler for `/review-package`.

- [ ] **Step 3: Implement the read path**

`ViolationRepository.java`:

```java
List<Violation> findAllByRace_IdOrderByOccurredAtAsc(Long raceId);
```

Create `referee/dto/RaceIncidentResponse.java`:

```java
package com.example.horseracingtournamentsystem.referee.dto;

import java.time.LocalDateTime;

public record RaceIncidentResponse(
        Long id,
        String violationType,
        Long participantId,
        String horseName,
        String jockeyName,
        String description,
        String penalty,
        String severity,
        LocalDateTime occurredAt
) {
}
```

Create `race/dto/response/RaceReviewPackageResponse.java`:

```java
package com.example.horseracingtournamentsystem.race.dto.response;

import com.example.horseracingtournamentsystem.referee.dto.RaceIncidentResponse;
import java.util.List;

public record RaceReviewPackageResponse(
        String reportTitle,
        String reportSummary,
        String returnedReason,
        List<RaceIncidentResponse> incidents
) {
}
```

In `RaceService.java`, add `private final ViolationRepository violationRepository;` and
`private final RefereeReportRepository refereeReportRepository;` to the injected fields, then:

```java
@Transactional(readOnly = true)
public RaceReviewPackageResponse getOrganizerReviewPackage(Long id, String organizerEmail) {
    Race race = requireOrganizerRace(id, organizerEmail);
    List<RaceIncidentResponse> incidents = violationRepository
            .findAllByRace_IdOrderByOccurredAtAsc(race.getId())
            .stream()
            .map(violation -> {
                RaceParticipant participant = violation.getParticipant();
                return new RaceIncidentResponse(
                        violation.getId(),
                        violation.getViolationType(),
                        participant == null ? null : participant.getId(),
                        participant == null ? null : participant.getHorse().getName(),
                        participant == null || participant.getJockey() == null
                                ? null
                                : participant.getJockey().getFullName(),
                        violation.getDescription(),
                        violation.getPenalty(),
                        violation.getSeverity(),
                        violation.getOccurredAt()
                );
            })
            .toList();

    return refereeReportRepository.findByRace_Id(race.getId())
            .map(report -> new RaceReviewPackageResponse(
                    report.getTitle(), report.getSummary(), report.getRejectionReason(), incidents))
            .orElseGet(() -> new RaceReviewPackageResponse(null, null, null, incidents));
}
```

Add to `RefereeReportRepository`:

```java
Optional<RefereeReport> findByRace_Id(Long raceId);
```

Add to `OrganizerRaceController.java`:

```java
@GetMapping("/{id}/review-package")
public RaceReviewPackageResponse reviewPackage(@PathVariable Long id, Authentication authentication) {
    return raceService.getOrganizerReviewPackage(id, authentication.getName());
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && ./mvnw test -Dtest=OrganizerReviewPackageIntegrationTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src && git commit -m "feat: expose race incidents and referee report to the organizer"
```

---

## Task 3: Send-back stores its reason on the report, not on every result note

Defect E, plus the note-destruction bug in `markReopened`.

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/referee/entity/RefereeReport.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java:356-378`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/referee/dto/RefereeRaceResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java:337-355`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/race/OrganizerReviewPackageIntegrationTest.java`

**Interfaces:**
- Consumes: `RefereeReportRepository.findByRace_Id` from Task 2
- Produces: `RefereeReport.markReturned(String reason)`; `RefereeRaceResponse.returnedReason()`

- [ ] **Step 1: Write the failing test**

Append to `OrganizerReviewPackageIntegrationTest`:

```java
@Test
@WithMockUser(username = "organizer@test.local", roles = {"ORGANIZER"})
void sendingBackKeepsPerRunnerNotesAndRecordsTheReasonOnTheReport() throws Exception {
    race.updateStatus(RaceStatus.RESULT_SUBMITTED);
    raceRepository.save(race);
    RaceResult result = raceResultRepository.findByRace_IdAndParticipant_Id(
            race.getId(), participant.getId()).orElseThrow();
    String originalNote = result.getNote();

    mockMvc.perform(post("/api/v1/organizer/races/" + race.getId() + "/reopen-results")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"Objection handling looks wrong\"}"))
            .andExpect(status().isOk());

    RaceResult after = raceResultRepository.findByRace_IdAndParticipant_Id(
            race.getId(), participant.getId()).orElseThrow();
    assertThat(after.getNote()).isEqualTo(originalNote);
    assertThat(refereeReportRepository.findByRace_Id(race.getId()).orElseThrow().getRejectionReason())
            .isEqualTo("Objection handling looks wrong");
}
```

The test needs a `RaceResult` row and a `RefereeReport` row for the race; create both in setup via
`RaceResult.create(race, participant, referee)` with a note of `"Manual total time override."` and
`RefereeReport.create(race, referee)` submitted with any title and summary.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && ./mvnw test -Dtest=OrganizerReviewPackageIntegrationTest`
Expected: FAIL — the note has been replaced by the reason and `getRejectionReason()` is `null`.

- [ ] **Step 3: Implement**

In `RefereeReport.java`, add:

```java
public void markReturned(String reason) {
    this.rejectionReason = reason;
    this.status = STATUS_SUBMITTED;
    this.updatedAt = LocalDateTime.now();
}
```

and clear it inside the existing `submit(...)` by adding `this.rejectionReason = null;`.

In `RaceService.reopenResultsForOrganizer`, replace the loop over `RaceResult` rows with:

```java
refereeReportRepository.findByRace_Id(id)
        .ifPresent(report -> report.markReturned(trimmed));
```

Leave `race.updateStatus(RaceStatus.FINISHED)` and the existing `notificationService.notify(...)`
call exactly as they are. `RaceResult.markReopened` becomes unused — delete it from
`RaceResult.java`.

Add `String returnedReason` as the final component of `RefereeRaceResponse`, and in
`RefereeRaceDayService.mapRace` pass:

```java
refereeReportRepository.findByRace_Id(race.getId())
        .map(RefereeReport::getRejectionReason)
        .orElse(null)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && ./mvnw test -Dtest=OrganizerReviewPackageIntegrationTest,RefereeRaceResultValidationIntegrationTest,RaceIntegrationTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src && git commit -m "fix: send-back reason no longer overwrites per-runner result notes"
```

---

## Task 4: Frontend API types for objections and the returned reason

Pure type/plumbing task so later UI tasks compile against fixed names.

**Files:**
- Modify: `frontend/src/api/refereeApi.ts`
- Modify: `frontend/src/api/racingApi.ts`

**Interfaces:**
- Consumes: endpoints from Tasks 2 and 3
- Produces: `ObjectionKind`, `ObjectionDecision`, `RaceObjectionDraft`, `buildObjectionDescription`, `RaceSummary.returnedReason`, `RaceIncident`, `RaceReviewPackage`, `getOrganizerReviewPackage`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/api/objectionDescription.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildObjectionDescription } from "./refereeApi";

describe("buildObjectionDescription", () => {
  it("composes an interference objection with both parties and the video mark", () => {
    expect(
      buildObjectionDescription({
        kind: "OBJECTION_INTERFERENCE",
        raisedByName: "Emma Collins (Aurora Belle)",
        againstName: "Liam Carter (Midnight Sovereign)",
        foulType: "interference",
        videoMarkSeconds: 47,
        detail: "crowded at the turn",
        decision: "RIDER_PENALTY",
      })
    ).toBe(
      "[Objection] Emma Collins (Aurora Belle) vs Liam Carter (Midnight Sovereign)\n" +
        "Foul: interference — video mark 47s\n" +
        "Detail: crowded at the turn\n" +
        "Decision: RIDER_PENALTY"
    );
  });

  it("composes a general objection without an accused runner", () => {
    expect(
      buildObjectionDescription({
        kind: "OBJECTION_GENERAL",
        raisedByName: "Emma Collins (Aurora Belle)",
        subject: "referee decision",
        detail: "5s penalty was not justified",
        decision: "NO_CHANGE",
      })
    ).toBe(
      "[Objection] Emma Collins (Aurora Belle) — target: referee decision\n" +
        "Detail: 5s penalty was not justified\n" +
        "Decision: NO_CHANGE"
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/api/objectionDescription.test.ts`
Expected: FAIL — `buildObjectionDescription` is not exported.

- [ ] **Step 3: Implement**

Append to `frontend/src/api/refereeApi.ts`:

```ts
export type ObjectionKind = "OBJECTION_INTERFERENCE" | "OBJECTION_GENERAL";
export type ObjectionDecision = "NO_CHANGE" | "RIDER_PENALTY" | "RESULT_AMENDED";

export type RaceObjectionDraft = {
  kind: ObjectionKind;
  raisedByParticipantId: number;
  raisedByName: string;
  againstParticipantId?: number;
  againstName?: string;
  foulType?: string;
  subject?: string;
  videoMarkSeconds?: number | "";
  detail: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  decision: ObjectionDecision;
};

export function buildObjectionDescription(draft: Partial<RaceObjectionDraft>): string {
  if (draft.kind === "OBJECTION_INTERFERENCE") {
    const mark = draft.videoMarkSeconds === "" || draft.videoMarkSeconds == null
      ? ""
      : ` — video mark ${draft.videoMarkSeconds}s`;
    return [
      `[Objection] ${draft.raisedByName} vs ${draft.againstName}`,
      `Foul: ${draft.foulType}${mark}`,
      `Detail: ${draft.detail}`,
      `Decision: ${draft.decision}`,
    ].join("\n");
  }

  return [
    `[Objection] ${draft.raisedByName} — target: ${draft.subject}`,
    `Detail: ${draft.detail}`,
    `Decision: ${draft.decision}`,
  ].join("\n");
}
```

Widen `ViolationEntry` so the two new fields can be sent, and add `returnedReason` to
`RaceSummary`:

```ts
export type ViolationEntry = {
  offenderId: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  violationType?: string;
  penalty?: string;
};
```

```ts
export type RaceSummary = {
  id: number;
  name: string;
  code: string;
  distanceMeters: number;
  status: string;
  scheduledAt?: string;
  venue?: string;
  returnedReason?: string | null;
};
```

Append to `frontend/src/api/racingApi.ts`:

```ts
export type RaceIncident = {
  id: number;
  violationType: string | null;
  participantId: number | null;
  horseName: string | null;
  jockeyName: string | null;
  description: string;
  penalty: string | null;
  severity: string | null;
  occurredAt: string | null;
};

export type RaceReviewPackage = {
  reportTitle: string | null;
  reportSummary: string | null;
  returnedReason: string | null;
  incidents: RaceIncident[];
};

export async function getOrganizerReviewPackage(id: number): Promise<RaceReviewPackage> {
  const response = await httpClient.get<RaceReviewPackage>(`/organizer/races/${id}/review-package`);
  return response.data;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/api/objectionDescription.test.ts && npx tsc --noEmit -p tsconfig.json`
Expected: PASS and no type errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api && git commit -m "feat: add objection payload types and organizer review-package client"
```

---

## Task 5: The objection form

**Files:**
- Create: `frontend/src/pages/referee/race-day/ObjectionForm.tsx`
- Test: `frontend/src/pages/referee/race-day/ObjectionForm.test.tsx`

**Interfaces:**
- Consumes: `RaceObjectionDraft`, `ObjectionKind`, `ObjectionDecision` from Task 4; `ParticipantVerification` from `refereeApi`
- Produces: `<ObjectionForm participants={ParticipantVerification[]} onRecord={(draft: RaceObjectionDraft) => void} />`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/referee/race-day/ObjectionForm.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ObjectionForm } from "./ObjectionForm";

const participants = [
  { participantId: 7, horseName: "Aurora Belle", jockeyName: "Emma Collins", jockeyWeight: 55, gearOk: true, healthOk: true, status: "PASSED" as const },
  { participantId: 4, horseName: "Midnight Sovereign", jockeyName: "Liam Carter", jockeyWeight: 56, gearOk: true, healthOk: true, status: "PASSED" as const },
];

describe("ObjectionForm", () => {
  it("requires an accused runner for an interference objection", () => {
    const onRecord = vi.fn();
    render(<ObjectionForm onRecord={onRecord} participants={participants} />);

    fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "crowded at the turn" } });
    fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

    expect(onRecord).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Select the runner being objected against.");
  });

  it("records an interference objection with both parties", () => {
    const onRecord = vi.fn();
    render(<ObjectionForm onRecord={onRecord} participants={participants} />);

    fireEvent.change(screen.getByLabelText("Raised by"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Against"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "crowded at the turn" } });
    fireEvent.change(screen.getByLabelText("Decision"), { target: { value: "RIDER_PENALTY" } });
    fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

    expect(onRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "OBJECTION_INTERFERENCE",
        raisedByParticipantId: 7,
        againstParticipantId: 4,
        decision: "RIDER_PENALTY",
      })
    );
  });

  it("switches to the no-opposing-party form and drops the Against field", () => {
    const onRecord = vi.fn();
    render(<ObjectionForm onRecord={onRecord} participants={participants} />);

    fireEvent.click(screen.getByRole("radio", { name: /no opposing runner/i }));

    expect(screen.queryByLabelText("Against")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/referee/race-day/ObjectionForm.test.tsx`
Expected: FAIL — cannot resolve `./ObjectionForm`.

- [ ] **Step 3: Implement**

Create `frontend/src/pages/referee/race-day/ObjectionForm.tsx` with this shape:

```tsx
import { useState } from "react";
import {
  ObjectionDecision,
  ObjectionKind,
  ParticipantVerification,
  RaceObjectionDraft,
} from "../../../api/refereeApi";

const FOUL_TYPES = ["interference", "crossing", "contact", "improper whip use", "other"];
const SUBJECTS = ["referee decision", "track condition", "equipment", "other"];
const DECISIONS: { value: ObjectionDecision; label: string }[] = [
  { value: "NO_CHANGE", label: "No change to result" },
  { value: "RIDER_PENALTY", label: "Rider penalty, result stands" },
  { value: "RESULT_AMENDED", label: "Result amended" },
];

function nameOf(participants: ParticipantVerification[], id: number | "") {
  const found = participants.find((p) => p.participantId === Number(id));
  return found ? `${found.jockeyName} (${found.horseName})` : "";
}

export function ObjectionForm({
  participants,
  onRecord,
}: {
  participants: ParticipantVerification[];
  onRecord: (draft: RaceObjectionDraft) => void;
}) {
  const [kind, setKind] = useState<ObjectionKind>("OBJECTION_INTERFERENCE");
  const [raisedBy, setRaisedBy] = useState<number | "">(participants[0]?.participantId ?? "");
  const [against, setAgainst] = useState<number | "">("");
  const [foulType, setFoulType] = useState(FOUL_TYPES[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [videoMarkSeconds, setVideoMarkSeconds] = useState<number | "">("");
  const [detail, setDetail] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [decision, setDecision] = useState<ObjectionDecision>("NO_CHANGE");
  const [error, setError] = useState<string | null>(null);

  const record = () => {
    if (raisedBy === "") return setError("Select the runner raising the objection.");
    if (kind === "OBJECTION_INTERFERENCE" && against === "")
      return setError("Select the runner being objected against.");
    if (!detail.trim()) return setError("Describe what happened.");

    setError(null);
    onRecord({
      kind,
      raisedByParticipantId: Number(raisedBy),
      raisedByName: nameOf(participants, raisedBy),
      againstParticipantId: kind === "OBJECTION_INTERFERENCE" ? Number(against) : undefined,
      againstName: kind === "OBJECTION_INTERFERENCE" ? nameOf(participants, against) : undefined,
      foulType: kind === "OBJECTION_INTERFERENCE" ? foulType : undefined,
      subject: kind === "OBJECTION_GENERAL" ? subject : undefined,
      videoMarkSeconds: kind === "OBJECTION_INTERFERENCE" ? videoMarkSeconds : undefined,
      detail: detail.trim(),
      severity,
      decision,
    });
    setDetail("");
    setVideoMarkSeconds("");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <fieldset className="flex flex-wrap gap-4">
        <legend className="sr-only">Objection type</legend>
        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
          <input
            checked={kind === "OBJECTION_INTERFERENCE"}
            name="objection-kind"
            onChange={() => setKind("OBJECTION_INTERFERENCE")}
            type="radio"
          />
          Against another runner
        </label>
        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
          <input
            checked={kind === "OBJECTION_GENERAL"}
            name="objection-kind"
            onChange={() => setKind("OBJECTION_GENERAL")}
            type="radio"
          />
          No opposing runner
        </label>
      </fieldset>

      <label className="mt-4 block text-xs font-black uppercase tracking-[0.16em] text-slate-500" htmlFor="objection-raised-by">
        Raised by
      </label>
      <select
        className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-black"
        id="objection-raised-by"
        onChange={(event) => setRaisedBy(Number(event.target.value))}
        value={raisedBy}
      >
        {participants.map((participant) => (
          <option key={participant.participantId} value={participant.participantId}>
            {participant.jockeyName} ({participant.horseName})
          </option>
        ))}
      </select>

      {/* Against + Foul type + Video mark: same label/select shape, rendered only when
          kind === "OBJECTION_INTERFERENCE". Against starts empty so the required-field
          validation can fire. Subject: same shape, rendered only for OBJECTION_GENERAL.
          Detail (textarea), Severity and Decision selects always render. */}

      {error ? <p className="mt-3 text-sm font-black text-rose-700" role="alert">{error}</p> : null}

      <button
        className="mt-4 min-h-11 rounded-md bg-[#007a68] px-4 text-sm font-black text-white"
        onClick={record}
        type="button"
      >
        Record objection
      </button>
    </div>
  );
}
```

Fill in the commented block following the exact same `<label htmlFor>` + control pairing so
`getByLabelText` resolves each one. The labels must read exactly `Against`, `Foul type`,
`Video mark`, `Subject`, `Detail`, `Severity`, `Decision`. Field inventory:

- always: `Raised by` (select of participants, value = `participantId`), `Detail` (textarea),
  `Severity` (select `LOW`/`MEDIUM`/`HIGH`), `Decision` (select with options
  `NO_CHANGE` "No change to result", `RIDER_PENALTY` "Rider penalty, result stands",
  `RESULT_AMENDED` "Result amended")
- interference only: `Against` (select of participants), `Foul type` (select: `interference`,
  `crossing`, `contact`, `improper whip use`, `other`), `Video mark` (number input, seconds)
- general only: `Subject` (select over `SUBJECTS`)

The validation order and messages are already encoded in `record()` above; do not reorder them,
because the first test asserts the interference message specifically.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/pages/referee/race-day/ObjectionForm.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/referee/race-day/ObjectionForm.tsx frontend/src/pages/referee/race-day/ObjectionForm.test.tsx && git commit -m "feat: add referee objection form with interference and general variants"
```

---

## Task 6: Fold objections and the report into the single submission screen

Defects B1, C1, C3, plus the objection feature itself.

**Files:**
- Modify: `frontend/src/pages/referee/SubmitResultsPage.tsx`
- Modify: `frontend/src/pages/referee/IncidentReportsPage.tsx` (drop the duplicate report form)
- Test: `frontend/src/pages/referee/SubmitResultsPage.test.tsx`
- Test: `frontend/src/pages/referee/IncidentReportsPage.test.tsx`

**Interfaces:**
- Consumes: `ObjectionForm` (Task 5), `buildObjectionDescription`, `RaceObjectionDraft`, `submitViolation`, `submitRaceResultPackage`, `getRaceParticipants`
- Produces: nothing downstream

- [ ] **Step 1: Write the failing tests**

Add to `frontend/src/pages/referee/SubmitResultsPage.test.tsx`:

```tsx
it("submits recorded objections as violations before submitting the package", async () => {
  vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
  vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
    id: 1, name: "Race 2", code: "R-1", distanceMeters: 1300, status: "FINISHED",
  });
  vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([
    { participantId: 1, horseName: "Thunderstrike", jockeyName: "Julian Sterling", jockeyWeight: 55, gearOk: true, healthOk: true, status: "PASSED" },
  ]);
  const violationSpy = vi.spyOn(refereeApi, "submitViolation").mockResolvedValue();
  vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();

  renderPage();

  expect(await screen.findByText("Submit race results")).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("1"), { target: { value: "1" } });
  fireEvent.change(screen.getByPlaceholderText("94.25"), { target: { value: "94.5" } });

  fireEvent.click(screen.getByRole("radio", { name: /no opposing runner/i }));
  fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "penalty was not justified" } });
  fireEvent.click(screen.getByRole("button", { name: /record objection/i }));
  fireEvent.click(screen.getAllByRole("button", { name: /submit package to organizer/i })[0]);

  await waitFor(() => expect(violationSpy).toHaveBeenCalled());
  expect(violationSpy).toHaveBeenCalledWith(1, expect.objectContaining({
    violationType: "OBJECTION_GENERAL",
    penalty: "NO_CHANGE",
  }));
});

it("sends the official report together with the result package", async () => {
  vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
  vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
    id: 1, name: "Race 2", code: "R-1", distanceMeters: 1300, status: "FINISHED",
  });
  vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([]);
  const submitSpy = vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();

  renderPage();

  expect(await screen.findByText("Submit race results")).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("1"), { target: { value: "1" } });
  fireEvent.change(screen.getByPlaceholderText("94.25"), { target: { value: "94.5" } });
  fireEvent.change(screen.getByLabelText("Race summary and observations"), {
    target: { value: "Track clear, one objection dismissed." },
  });
  fireEvent.click(screen.getAllByRole("button", { name: /submit package to organizer/i })[0]);

  await waitFor(() => expect(submitSpy).toHaveBeenCalled());
  expect(submitSpy.mock.calls[0][1].reportSummary).toBe("Track clear, one objection dismissed.");
});

it("keeps a recorded objection visible with no way to delete it", async () => {
  vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
  vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
    id: 1, name: "Race 2", code: "R-1", distanceMeters: 1300, status: "FINISHED",
  });
  vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([
    { participantId: 1, horseName: "Thunderstrike", jockeyName: "Julian Sterling", jockeyWeight: 55, gearOk: true, healthOk: true, status: "PASSED" },
  ]);

  renderPage();

  expect(await screen.findByText("Submit race results")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: /no opposing runner/i }));
  fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "penalty was not justified" } });
  fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

  expect(screen.getByText(/1 objection recorded/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /remove objection/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/pages/referee/SubmitResultsPage.test.tsx`
Expected: FAIL — no objection radio, no report textarea, button still reads "Confirm result package".

- [ ] **Step 3: Implement**

In `SubmitResultsPage.tsx`:

- Add `getRaceParticipants(raceId)` to the existing `Promise.all` and hold it in
  `const [participants, setParticipants] = useState<ParticipantVerification[]>([])`.
- Add `const [objections, setObjections] = useState<RaceObjectionDraft[]>([])`,
  `const [reportTitle, setReportTitle] = useState(\`Race Report: R-${raceId}\`)` and
  `const [reportSummary, setReportSummary] = useState("")`.
- Render, below the finish-order card and only when `!isLocked`, a section headed
  `Incidents and objections` containing `<ObjectionForm participants={participants}
  onRecord={(draft) => setObjections((current) => [...current, draft])} />`, plus a list of
  recorded objections showing `{objections.length} objection(s) recorded` and, per row, the
  composed description and decision. Render no delete control.
- Render a third section headed `Official report` with a `Report title` input and a
  `Race summary and observations` textarea, both wired to the state above and both using
  `<label htmlFor>`.
- Rename every submit button to `Submit package to organizer`.
- In `handleSave`, before calling `submitRaceResultPackage`, post each objection:

```tsx
for (const objection of objections) {
  await submitViolation(raceId, {
    offenderId:
      objection.kind === "OBJECTION_INTERFERENCE"
        ? (objection.againstParticipantId as number)
        : objection.raisedByParticipantId,
    severity: objection.severity,
    description: buildObjectionDescription(objection),
    violationType: objection.kind,
    penalty: objection.decision,
  });
}
```

then include the report in the package:

```tsx
await submitRaceResultPackage(raceId, {
  results: mappedEntries as ParticipantResultEntry[],
  requiresAdminReview,
  reviewReason: requiresAdminReview ? reviewReason.trim() : null,
  reportTitle: reportTitle.trim(),
  reportSummary: reportSummary.trim(),
});
```

- Replace the success message with
  `"Package submitted. Awaiting organizer confirmation."` — never the word "confirmed".

Rewrite the read-only gate so it stops treating "not yet finished" as "already submitted":

```tsx
const LOCKED_STATUS_MESSAGES: Record<string, string> = {
  RESULT_SUBMITTED: "Submitted — awaiting organizer confirmation.",
  RESULT_CONFIRMED: "Confirmed by the organizer.",
  PUBLISHED: "Published.",
};

const isLocked = race != null && race.status in LOCKED_STATUS_MESSAGES;
const isNotReady = race != null && !isLocked && race.status !== "FINISHED";
const gateMessage = race == null
  ? ""
  : LOCKED_STATUS_MESSAGES[race.status]
    ?? (race.status === "CANCELLED"
      ? "This race was cancelled."
      : "This race has not finished yet — results cannot be submitted.");
```

Use `isLocked || isNotReady` everywhere the old `isReadOnly` was used.

Finally, remove the duplicate report entry point that causes defect C1. In
`frontend/src/pages/referee/IncidentReportsPage.tsx`, delete the entire "Official referee report"
`<section>`, its `handleReportSubmit`, the `reportTitle` / `reportSummary` / `reportMsg` state, and
the now-unused `submitRefereeReport` and `FileText` imports. The page keeps only incident logging,
and its grid drops to a single column. Update `IncidentReportsPage.test.tsx` accordingly: any
assertion touching the report form must go, and add

```tsx
expect(screen.queryByRole("button", { name: /save official report/i })).not.toBeInTheDocument();
```

The backend `POST /races/{raceId}/reports` endpoint stays — nothing calls it from the referee UI
any more, but removing a public endpoint is out of scope here.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/referee`
Expected: PASS, all files. The existing test named
`"renders read-only once results are already submitted"` still passes because
`RESULT_SUBMITTED` is in `LOCKED_STATUS_MESSAGES`; update its expected copy if it asserts the old
string.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/referee && git commit -m "feat: assemble placings, objections and report into one referee submission"
```

---

## Task 7: Demote RaceSummary to a draft view

Defects B1 and D.

**Files:**
- Modify: `frontend/src/pages/referee/race-day/RaceSummary.tsx`
- Modify: `frontend/src/pages/referee/RefereeOfficiatePage.tsx:420-426`
- Test: `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `RaceSummary` no longer accepts `appeals` or `onConfirmed`

- [ ] **Step 1: Write the failing test**

Replace the tests `"keeps official publish locked until appeals are resolved or rejected"`,
`"requires a rejection reason before dismissing an appeal"` and
`"locks the race summary after publishing official results"` in
`RefereeOfficiatePage.test.tsx` with:

```tsx
it("sends the referee to the submission screen instead of submitting from the draft view", () => {
  render(
    <MemoryRouter>
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 62_345,
          leaderboard: [
            {
              participantId: 7, horseName: "Golden Arrow", gateNumber: 1,
              progressPercent: 100, speedMultiplier: 1, status: "RUNNING",
              finishMilliseconds: 62_345,
            },
          ],
          outOfRace: [],
          incidents: [],
        }}
      />
    </MemoryRouter>
  );

  expect(screen.queryByRole("button", { name: /confirm official result/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/appeals board/i)).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /continue to submit results/i }))
    .toHaveAttribute("href", "/referee/races/9/results");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/referee/RefereeOfficiatePage.test.tsx`
Expected: FAIL — the confirm button and the Appeals Board still render.

- [ ] **Step 3: Implement**

In `RaceSummary.tsx`, delete `confirmResultPackage`, the `confirmed` / `submitting` /
`submitMessage` state, the `appeals` prop and the whole Appeals Board block, and the
`onConfirmed` prop. Replace the two header buttons with a single
`<Link to={\`/referee/races/${raceId}/results\`}>Continue to submit results</Link>`.
Keep the finish-order list, the manual time overrides, the referee notes textarea and the AI draft
button — they remain useful as a draft. Change the header subtitle to
`Draft finish order — review timing and penalties before submitting.`

In `RefereeOfficiatePage.tsx`, drop the `onConfirmed` prop from the `<RaceSummary>` call, and add
the `/report` link to the same block so it is reachable on the normal path, not only from the
fallback card.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/referee`
Expected: PASS, all files.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/referee && git commit -m "refactor: RaceSummary becomes a draft view with a single path to submission"
```

---

## Task 8: Show the organizer's send-back reason to the referee

Defect E2.

**Files:**
- Modify: `frontend/src/pages/referee/SubmitResultsPage.tsx`
- Test: `frontend/src/pages/referee/SubmitResultsPage.test.tsx`

**Interfaces:**
- Consumes: `RaceSummary.returnedReason` from Task 4, populated by Task 3
- Produces: nothing downstream

- [ ] **Step 1: Write the failing test**

```tsx
it("shows the organizer's reason when the package was sent back", async () => {
  vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
  vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([]);
  vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
    id: 1, name: "Race 2", code: "R-1", distanceMeters: 1300, status: "FINISHED",
    returnedReason: "Objection handling looks wrong",
  });

  renderPage();

  const banner = await screen.findByRole("alert");
  expect(banner).toHaveTextContent("Returned by the organizer");
  expect(banner).toHaveTextContent("Objection handling looks wrong");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/referee/SubmitResultsPage.test.tsx`
Expected: FAIL — no element with role `alert`.

- [ ] **Step 3: Implement**

In `SubmitResultsPage.tsx`, directly under the header, render:

```tsx
{race?.returnedReason ? (
  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4" role="alert">
    <p className="font-black text-amber-900">Returned by the organizer</p>
    <p className="mt-1 text-sm font-semibold text-amber-800">Reason: {race.returnedReason}</p>
  </div>
) : null}
```

The form already loads the previously submitted values through `getRaceResultEntries`, which
returns the saved `RaceResult` rows, so the referee edits rather than retypes. No extra work is
needed for pre-fill.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/referee/SubmitResultsPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/referee && git commit -m "feat: show the organizer's send-back reason on the submission screen"
```

---

## Task 9: Surface objections in the organizer's ratification panel

**Files:**
- Modify: `frontend/src/pages/organizer/OrganizerResultsPage.tsx`
- Test: `frontend/src/pages/organizer/OrganizerResultsPage.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `getOrganizerReviewPackage`, `RaceReviewPackage`, `RaceIncident` from Task 4
- Produces: nothing downstream

- [ ] **Step 1: Write the failing test**

```tsx
it("shows an objection count badge and the referee's decision before ratification", async () => {
  vi.spyOn(racingApi, "getOrganizerReviewPackage").mockResolvedValue({
    reportTitle: "Race Report: R-2026-3",
    reportSummary: "Track clear.",
    returnedReason: null,
    incidents: [
      {
        id: 1,
        violationType: "OBJECTION_INTERFERENCE",
        participantId: 4,
        horseName: "Midnight Sovereign",
        jockeyName: "Liam Carter",
        description: "[Objection] Emma Collins (Aurora Belle) vs Liam Carter (Midnight Sovereign)",
        penalty: "RIDER_PENALTY",
        severity: "HIGH",
        occurredAt: "2026-07-29T02:10:00",
      },
    ],
  });

  renderResultsPage();

  expect(await screen.findByText("1 objection")).toBeInTheDocument();
  expect(screen.getByText(/rider penalty, result stands/i)).toBeInTheDocument();
  expect(screen.getByText("Track clear.")).toBeInTheDocument();
});
```

Mirror the render helper and mocking style already used by the other organizer page tests in
`frontend/src/pages/organizer/`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/organizer/OrganizerResultsPage.test.tsx`
Expected: FAIL — `getOrganizerReviewPackage` is never called.

- [ ] **Step 3: Implement**

In `OrganizerResultsPage.tsx`, fetch the review package alongside the existing results load into
`const [reviewPackage, setReviewPackage] = useState<RaceReviewPackage>()`, and render this block
immediately above the Confirm / Send back buttons:

```tsx
const DECISION_LABELS: Record<string, string> = {
  NO_CHANGE: "No change to result",
  RIDER_PENALTY: "Rider penalty, result stands",
  RESULT_AMENDED: "Result amended",
};

const objections = (reviewPackage?.incidents ?? []).filter((incident) =>
  incident.violationType?.startsWith("OBJECTION")
);
```

```tsx
{objections.length > 0 ? (
  <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
    <p className="text-sm font-black text-amber-900">
      {objections.length} objection{objections.length === 1 ? "" : "s"}
    </p>
    <ul className="mt-3 space-y-2">
      {objections.map((objection) => (
        <li className="rounded-xl bg-white px-3 py-2" key={objection.id}>
          <p className="text-sm font-black text-slate-900">
            {objection.horseName} — {objection.jockeyName}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{objection.description}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wider text-amber-800">
            {DECISION_LABELS[objection.penalty ?? ""] ?? objection.penalty}
          </p>
        </li>
      ))}
    </ul>
  </section>
) : null}

{reviewPackage?.reportSummary ? (
  <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Referee report</h3>
    <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{reviewPackage.reportSummary}</p>
  </section>
) : null}
```

Do not gate the Confirm button on anything — objections arrive already decided.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/organizer`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/organizer && git commit -m "feat: show race objections and referee report before organizer ratification"
```

---

## Final verification

- [ ] Run the whole frontend suite: `cd frontend && npx vitest run`
- [ ] Run the whole backend suite: `cd backend && ./mvnw test`
- [ ] Start the dev server and walk the flow once by hand: finish a race → draft view links to
      `/results` → record one objection of each kind → submit → the screen says "awaiting organizer
      confirmation" and the stepper does **not** show Confirmed → organizer sees the badge and both
      objections → send back with a reason → the referee sees the amber banner with that reason and
      the previously submitted values still in the form.
