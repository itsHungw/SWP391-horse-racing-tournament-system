# Referee Result Package — Single Submission Flow with Jockey Objections

## Problem

Two unrelated-looking issues turn out to be the same problem: the referee's post-race flow has
no single place where a result is assembled and handed over. Result, incidents, and the official
report are submitted through three different screens at three different times, and there is no
slot at all for a jockey who wants to object to the outcome.

### Current flow, as coded

```
/referee/races/:id/officiate         stage derived from race.status
  PRE_CHECKING → PreRaceChecklist  → POST /pre-checks → READY
  READY        → ReadyLineupPanel  → POST /start      → ONGOING
  ONGOING      → LiveRaceWorkspace → POST /finish     → FINISHED
                                     + sets `snapshot` (in memory only)
  FINISHED_DRAFT → branches on whether `snapshot` exists:
       has snapshot  → <RaceSummary>   with a "Confirm official result" button
       no snapshot   → fallback card with links to /results and /report

/referee/races/:id/results   SubmitResultsPage   → POST /results/submit
/referee/races/:id/report    IncidentReportsPage → POST /violations  (incident)
                                                 → POST /reports     (official report)

organizer → POST /confirm-results → RESULT_CONFIRMED → settlement job runs
          → "Send back" (reopenResults) → back to FINISHED
```

### Defects

**A. The UI misreports state.**

- A1. `RaceSummary`'s "Confirm official result" button calls `submitRaceResultPackage()`, which
  moves the race to `RESULT_SUBMITTED`. It submits; it does not confirm. Per BR-16 only the
  organizer confirms.
  ([RaceSummary.tsx:150](../../../frontend/src/pages/referee/race-day/RaceSummary.tsx))
- A2. On success the page writes a status the backend never returned:
  `onConfirmed={() => setRace((c) => ({ ...c, status: "RESULT_CONFIRMED" }))}`
  ([RefereeOfficiatePage.tsx:425](../../../frontend/src/pages/referee/RefereeOfficiatePage.tsx)).
  The stepper lights up "Confirmed" and the referee believes the race is finished. A page reload
  reverts it, because the server still says `RESULT_SUBMITTED` — the UI contradicts itself.
- A3. After submitting, nothing tells the referee that the organizer must still act, and nothing
  links onward to the report screen.

**B. Two parallel submission paths that produce different data.**

- B1. `RaceSummary.confirmResultPackage()` and `SubmitResultsPage.handleSave()` both POST to
  `/races/{id}/results/submit`, but the first derives placings from live finish times and sends a
  report title/summary, while the second takes hand-typed placings and sends no report at all.
  Nothing indicates which path is canonical.
- B2. `snapshot` is only ever set by `proceedToPostRace()` and is never loaded from the server.
  After a reload the referee lands in the fallback card and every live time, penalty and incident
  from the race is gone; they must retype the entire result by hand.

**C. Report and incidents are detached from the result.**

- C1. `submitResults` already creates a `RefereeReport` with status `SUBMITTED`
  ([RefereeRaceDayService.java:245-257](../../../backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java)).
  A later "Save official report" on `/report` overwrites that same row (unique constraint on
  `race_id + referee_id`), so the report can change after the organizer has read it.
- C2. Incidents logged on `/report` after submission are not part of the package the organizer
  reviews, so they can be recorded and never seen.
- C3. The link to `/report` exists only inside the fallback card, which only appears when
  `snapshot` has been lost. A referee following the normal path never sees it.

**D. The Appeals Board is dead UI.** `RaceSummary` takes `appeals = []`, `RefereeOfficiatePage`
passes nothing, and no API, table, or write path exists. It also sits behind the `draftUpdated`
flag, so it is both empty and hidden. Its *behaviour* — blocking submission until appeals are
cleared — is the right idea and is what this spec replaces it with.

**E. Send-back is a dead end for the referee.** `reopenResultsForOrganizer` requires a reason,
stores it, notifies the referee, and returns the race to `FINISHED`
([RaceService.java:356-378](../../../backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java)).
The referee then lands on the fallback card, which does not display the reason anywhere.

**F. Wrong data is written to the database.**

- F1. `RaceSummary` maps every non-DSQ runner in `outOfRace` to `DID_NOT_FINISH`
  ([RaceSummary.tsx:175](../../../frontend/src/pages/referee/race-day/RaceSummary.tsx)).
  Scratched runners carry status `DNS` (via `buildScratchedRunners`) and are persisted as
  "did not finish" even though `ResultFinishStatus.WITHDRAWN` exists for exactly this case.
  DNS and DNF are not interchangeable: a scratched horse never started.
- F2. Both arrays in `confirmResultPackage` send `jockeyName: ""`.

**G. Incidents and reports are write-only in practice.** `ViolationRepository` does declare
`findAllByRace_IdOrderByOccurredAtAsc`, but it has no callers anywhere in the codebase, and no
endpoint exposes violations or the referee report to the organizer. Whatever the referee records
today cannot be seen by anyone.

## Goals

1. One screen assembles the whole result package — placings, incidents and objections, official
   report — and hands it over with one action.
2. A jockey who believes they were fouled, or that the referee penalised them unfairly, has their
   objection recorded in that package as a first-class row that the organizer will read.
3. The referee decides the objection on the spot, records the decision, and submits it.
4. The organizer can see objections when ratifying, and send the package back with a reason the
   referee can actually read.
5. The UI never claims a state the backend did not return.

## Non-goals

- **No new table and no new column.** The objection is recorded through the existing `violations`
  table. See "Data convention" for why this is now sufficient.
- **No late objections.** Objections are accepted only while the referee is assembling the package
  (race status `FINISHED`). Once submitted, an objection cannot be added. This mirrors real racing,
  where a rider must object immediately rather than after the result stands.
- **No second appeal tier.** There is no escalation to admin, and no path to reverse a result once
  the organizer has confirmed it. Settlement runs at `RESULT_CONFIRMED`
  ([RaceService.java:660-661](../../../backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java)),
  and the objection window closes before that, so no payout ever has to be clawed back.
- **No money, wallet, or prediction changes.**
- **Live state is still not persisted.** Defect B2 is only partly mitigated here (by making the
  server-backed screen canonical); persisting the live snapshot is a separate piece of work.

## Decisions

| Question | Decision | Why |
|---|---|---|
| Who decides an objection? | The referee, on the spot, but recording is mandatory | Matches the on-day authority of racing stewards; also the only workable option once late objections are refused, since the referee is the only official present |
| Can an objection be filed after submission? | No | Removes the need for a pending state and for any guard blocking the organizer |
| Who checks the referee? | The organizer, via send-back | The objection — including "the referee penalised me unfairly" — is in the package the organizer reads. No separate appeal tier needed |
| Which screen submits? | `SubmitResultsPage` (`/results`) only | It loads from the server, so it survives a reload; it already handles the read-only state after submission |
| Where is the objection stored? | Existing `violations` table | With the referee deciding immediately and no late filing, an objection has no lifecycle. It is a record, not a workflow — which is what `Violation` already models |

## Design

### 1. Single submission screen

`SubmitResultsPage` becomes the only place a result package is submitted. It grows three sections
and one submit action:

```
┌─ RESULT PACKAGE ────────────────────────────────┐
│  1. Finish order        existing grouped layout │
│  2. Incidents & objections   new                │
│  3. Official report     title + summary         │
│                                                  │
│        [ Submit package to organizer ]          │
└──────────────────────────────────────────────────┘
```

`RaceSummary` on the officiate page is demoted to a **draft view**. Its submit button is replaced
by a link to `/referee/races/:id/results`, removing the duplicate submission path (B1). The dead
Appeals Board block is deleted (D).

The report fields move into this screen and are sent as `reportTitle` / `reportSummary` in the
existing `SubmitResultsRequest`, so the report is written exactly once, at submission (C1). The
standalone "Save official report" form on `/report` is removed; `/report` keeps only incident
logging, for incidents noticed before the package is assembled.

### 2. Objection recording — two forms

The referee opens "Record objection" from section 2. The form has two variants, chosen by whether
another runner is involved.

**Form A — objection against another runner** (interference, blocking, crowding):

| Field | Control |
|---|---|
| Raised by | dropdown of participants |
| Against | dropdown of participants |
| Foul type | dropdown: interference / crossing / contact / improper whip use / other |
| Video mark | optional, seconds |
| Detail | free text |
| Severity | LOW / MEDIUM / HIGH |
| Decision | dropdown: no change / rider penalty / result amended |

**Form B — objection with no opposing party** (referee's own penalty, track condition, equipment):

| Field | Control |
|---|---|
| Raised by | dropdown of participants |
| Subject | dropdown: referee decision / track condition / equipment / other |
| Detail | free text |
| Severity | LOW / MEDIUM / HIGH |
| Decision | dropdown: no change / rider penalty / result amended |

The three decisions are deliberate, and the middle one matters: an objection can be *upheld*
without the placings changing — the offender is penalised but finished ahead regardless. Only
"result amended" sends the referee back to section 1 to change the finish order.

Once recorded, an objection cannot be deleted from the UI; only its text and decision are editable
before submission. This is what makes the organizer's oversight meaningful — a referee cannot make
an objection against their own decision disappear.

### 3. Data convention — reusing `violations`

`ViolationRequest` already accepts `violationType` and `penalty`
([ViolationRequest.java](../../../backend/src/main/java/com/example/horseracingtournamentsystem/referee/dto/ViolationRequest.java));
the frontend simply never sends them today. No DTO, entity, or migration change is required.

| `violationType` | `participant` means | Written by |
|---|---|---|
| `OBJECTION_INTERFERENCE` | the runner objected **against** | Form A |
| `OBJECTION_GENERAL` | the runner **raising** the objection | Form B |
| `INCIDENT` | the runner the referee observed | incident form |

Encoding the meaning of `participant` in `violationType` removes the ambiguity that would
otherwise come from having one column serve both roles.

`penalty` stores the decision as a stable code: `NO_CHANGE`, `RIDER_PENALTY`, `RESULT_AMENDED`.
`severity` keeps its existing `LOW` / `MEDIUM` / `HIGH` values.

`description` is composed by the frontend from the dropdowns so it reads as a sentence:

```
[Objection] Emma Collins (Aurora Belle) vs Liam Carter (Midnight Sovereign)
Foul: interference — video mark 47s
Detail: crowded at the turn out of the back straight
Decision: RIDER_PENALTY
```

The dropdowns exist so the referee picks rather than types, and so the wording is consistent
across races. The stored value is still text.

### 4. Organizer visibility

Today nothing reads violations back (defect G). Add:

- `ViolationRepository.findAllByRace_IdOrderByOccurredAtAsc(Long raceId)`
- A read endpoint on the organizer race controller returning, for one race: the violations
  (incidents and objections), and the `RefereeReport` title/summary.

The organizer's ratification panel then shows, above Confirm / Send back:

- a badge with the objection count when greater than zero, so it cannot be skimmed past
- the objection list with who raised it, against whom, and the referee's decision
- the referee's report summary

The organizer's decision stays unchanged: **Confirm** (→ `RESULT_CONFIRMED`, settlement runs) or
**Send back** with a reason. Nothing blocks Confirm — objections are already decided by the time
they arrive. The organizer sends back only when they disagree with how one was handled.

### 5. Send-back loop

`markReopened(reason)` currently assigns the reason to `RaceResult.note` for every row
([RaceResult.java:177-180](../../../backend/src/main/java/com/example/horseracingtournamentsystem/result/entity/RaceResult.java)),
destroying the per-runner notes written at submission ("Manual total time override from race
summary.", "Disqualified during live race control."). Store the reason on
`RefereeReport.rejectionReason` instead — that column already exists and is currently unused, and
the reason belongs to the package rather than to any single runner. `RaceResult.note` is left
untouched.

`RefereeReport` declares `rejectionReason` but exposes no method that writes it, so add
`markReturned(String reason)` and have `submit(...)` clear it. `reopenResultsForOrganizer` loads
the report for the race and calls `markReturned` instead of looping over `RaceResult` rows.

`SubmitResultsPage` then shows a banner while `rejectionReason` is set:

> **Returned by the organizer** — reason: …

with the previously submitted values loaded, so the referee edits rather than retypes. Submitting
again clears `rejectionReason` and moves the race back to `RESULT_SUBMITTED`.

### 6. Corrections shipped alongside

These are small and belong with this change because they touch the same screens:

- **A1** — rename the `RaceSummary` action to a link to `/results`; the word "confirm" only ever
  appears on the organizer's side.
- **A2** — delete the `onConfirmed` status override. The screen reflects whatever status the
  server returned.
- **A3** — after a successful submission, state that the package is awaiting organizer
  confirmation, matching what the backend actually did.
- **F1** — map `DNS` to `WITHDRAWN`, `DSQ` to `DISQUALIFIED`, and only genuine non-finishers to
  `DID_NOT_FINISH`. Fix the display label in `RaceSummary`, which currently renders `DNS` as
  "DNF", and the test that asserts that behaviour.
- **F2** — send the real `jockeyName`.

## Testing

Frontend (vitest + RTL):

- Submitting the package sends placings, objections, and report in one request.
- The screen shows "awaiting organizer confirmation" after submit, and never renders a confirmed
  state the server did not return.
- Form A requires both a complainant and an accused runner; Form B requires a complainant and a
  subject.
- A recorded objection cannot be removed before submission.
- Choosing "result amended" surfaces the finish-order section for editing.
- A returned package renders the organizer's reason and pre-fills the previous values.
- A scratched runner is submitted as `WITHDRAWN` and displayed as "DNS", not "DNF".

Backend (integration):

- Violations of every `violationType` are persisted with `participant`, `penalty`, and `severity`
  intact and are returned by the new organizer read endpoint.
- Sending a package back writes `RefereeReport.rejectionReason` and leaves every
  `RaceResult.note` unchanged.
- Resubmitting after a send-back clears `rejectionReason` and returns the race to
  `RESULT_SUBMITTED`.
- Submission is still rejected unless the race is `FINISHED` (existing BR-16 guard, unchanged).

## Follow-ups, deliberately out of scope

- **Persisting live race state** (defect B2). The live clock, penalties, and finish times exist
  only in browser memory; a reload during or right after a race loses them. Making
  `SubmitResultsPage` canonical reduces the damage but does not fix the cause.
- **Objections raised by horse owners.** Owners are not at the track and would need their own
  authenticated form with ownership validation. Excluded to keep this round to one screen.
- **An appeal tier above the organizer.** Real racing has an independent appeal board precisely
  because the official who records an objection may be its subject. That protection is absent
  here by choice; it would need to sit outside the race-day flow.
- **`SpectatorDisputeController` accepts `referenceType` and `referenceId` from the client with no
  ownership check**, so a spectator can file a dispute pointing at another user's transaction or
  prediction. Unrelated to this change, but it should not be copied.
