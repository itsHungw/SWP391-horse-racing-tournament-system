# Admin Championship Backend Lifecycle Design

## Purpose

This spec defines the backend lifecycle needed to connect the Admin Championship UI to real business behavior.

The UI is already close enough to begin backend integration. The risk now is lifecycle ambiguity: when to create rounds, when registrations close, when participants lock, when race operations start, and how standings are produced.

This spec answers:

1. Which phase is this championship in?
2. Which actions are allowed now?
3. Which action should admin perform next?
4. Which backend data is the source of truth for each workspace?

## Naming Boundary

Use a practical naming boundary.

Database and core backend naming stays as-is:

- `tournaments`
- `races`
- `tournament_registrations`

Existing backend entities stay as-is:

- `Tournament`
- `Race`
- `TournamentRegistration`
- `JockeyInvitation`

Entities that may need to be added in v1:

- `JockeyTournamentApplication`
- `TournamentParticipant`
- `RaceResult` or equivalent result record

Entities that are not required in v1:

- New contract table

Admin product language can use:

- Championship
- Round
- Season
- Control Center
- Standings

New admin facade APIs may use `championships` and `rounds` in the URL, but they should map internally to existing `Tournament` and `Race` services/entities.

Important rule:

```txt
Championship and Round are admin-facing product language.
They map to existing Tournament and Race domain entities.
Do not rename database tables, JPA entities, repositories, or existing legacy routes in this phase.
```

## Existing Backend Reality

Current backend already has:

- `/api/v1/admin/tournaments`
- `/api/v1/admin/races`
- `/api/v1/admin/tournament-registrations`
- `/api/v1/owner/tournament-registrations`
- `TournamentService`
- `RaceService`
- `TournamentRegistrationService`

Current `Tournament` statuses include:

```txt
DRAFT
OPEN_REGISTRATION
CLOSED_REGISTRATION
ONGOING
COMPLETED
POSTPONED
```

Current `Race` statuses include:

```txt
SCHEDULED
CHECKING
READY
ONGOING
FINISHED
RESULT_SUBMITTED
RESULT_CONFIRMED
PUBLISHED
CANCELLED
```

Do not rename existing status values unless a later migration explicitly chooses to do so.

## Domain Model

Conceptually:

```txt
Championship = Tournament
Round = Race
```

A championship is a season. A round is one scheduled race event inside the season.

Participants compete across all rounds, points accumulate after published results, and final standings are produced when the championship is completed.

## Source Of Truth

| UI Surface | Source of truth |
| --- | --- |
| Championship header | `Tournament` plus workspace next-action computation |
| Tentative/official schedule | `Race` records plus computed `isOfficial` |
| Horse registration review | `TournamentRegistration` |
| Jockey pool review | `JockeyTournamentApplication` |
| Assignment contract review | `JockeyInvitation` reinterpreted as tournament assignment contract |
| Participant list | `TournamentParticipant` |
| Round control | `Race` plus participant/result readiness |
| Race result | `RaceResult` or equivalent result records |
| Standings | Published race results grouped by `TournamentParticipant` |

Backend should expose standings as DTOs. FE should not calculate standings from raw race rows.

## Point Systems Boundary

There are two different point systems in the product. They must not share configuration tables.

### Championship Standing Points

These are competitive points for `TournamentParticipant` standings.

Used for:

- Championship standings
- Participant rank
- Round result scoring
- Final championship table

V1 uses a fixed global scoring system:

| Finish Position | Points |
| --- | ---: |
| 1 | 25 |
| 2 | 18 |
| 3 | 15 |
| 4 | 12 |
| 5 | 10 |
| 6 | 8 |
| 7 | 6 |
| 8 | 4 |
| 9 | 2 |
| 10 | 1 |
| 11+ | 0 |

Rules:

- Points are awarded to `TournamentParticipant` based on published finishing position in each round.
- Standings are recalculated from published results.
- The system is fixed in v1.
- Admin cannot customize championship standing points in v1.
- Do not create point rule templates in v1.

Future v2 options:

- F1-style template
- MotoGP-style template
- Custom per-championship scoring table

### User Reward Points

These are gamification currency for users.

Examples:

- Blog read reward
- First registration bonus
- Prediction entry cost
- Prediction reward
- Manual admin adjustment

These belong in the separate Admin Points module.

Important rule:

```txt
User Reward Points are gamification currency.
Race Standing Points are competitive championship scoring.
They are separate systems and must not share configuration tables.
```

## TournamentParticipant V1

`TournamentParticipant` is the key entity for the championship redesign. It represents the official horse and jockey pairing that competes through the season.

Recommended fields:

```txt
id
tournament_id
tournament_registration_id
horse_id
jockey_id
owner_id
status
created_at
updated_at
```

Recommended statuses:

```txt
ACTIVE
WITHDRAWN
DISQUALIFIED
```

Recommended unique constraints:

```txt
unique(tournament_id, horse_id)
unique(tournament_id, jockey_id)
```

Meaning:

- One horse can appear only once in a championship.
- One jockey can ride only one horse in the same championship.
- Standings and results should reference the participant pair, not only horse or jockey separately.

Participant creation in v1 should come from accepted `jockey_invitations` records that reference the tournament and tournament registration. The important rule is that official standings are based on `TournamentParticipant`.

## JockeyTournamentApplication V1

`JockeyTournamentApplication` represents a jockey applying to become visible in the championship jockey pool.

It is different from a role request:

```txt
Role Request = user asks to become a JOCKEY in the system.
Jockey Pool Application = approved jockey asks to join one championship pool.
```

Recommended fields:

```txt
id
tournament_id
jockey_id
status
message
reviewed_by
reviewed_at
rejection_reason
created_at
updated_at
withdrawn_at
```

Recommended statuses:

```txt
PENDING
APPROVED_FOR_POOL
REJECTED
WITHDRAWN
```

Recommended unique constraint:

```txt
unique(tournament_id, jockey_id)
```

Eligibility rules:

```txt
User must have active JOCKEY role.
Jockey racing passport/profile should be complete if that profile exists in v1.
Championship must be in OPEN_REGISTRATION.
Jockey must not already have an active application for the same championship.
```

Meaning:

- `PENDING` means admin still needs to review the jockey for this championship pool.
- `APPROVED_FOR_POOL` means owners can select this jockey when sending an assignment contract for the same championship.
- `APPROVED_FOR_POOL` does not mean the jockey is an official participant.
- Official participant status only begins after an accepted assignment contract is converted into `TournamentParticipant` during participant lock.

## JockeyInvitation As Tournament Assignment Contract

The database already has `jockey_invitations`, but its original meaning is race-level invitation.

Old meaning:

```txt
Owner invites Jockey for one Race.
```

New v1 meaning:

```txt
Owner sends Tournament Assignment Contract to Jockey for one Horse in one Championship.
```

Do not create a new contract table in v1. Reuse `jockey_invitations` and evolve it carefully.

Required spec rule:

```txt
jockey_invitations is retained as a legacy/reusable table.
In v1 it is reinterpreted as Tournament Assignment Contract.
race_id is legacy and nullable.
New championship-level logic must use tournament_id and tournament_registration_id as source context.
```

Recommended DB update:

```txt
jockey_invitations
- id
- tournament_id nullable first
- tournament_registration_id nullable first
- race_id nullable / legacy
- horse_id
- owner_id
- jockey_id
- status
- message
- agreement_url
- agreement_file_name
- read_at
- accepted_at
- rejected_at
- rejection_reason
- created_at
- updated_at
```

Migration strategy:

1. Add `tournament_id` nullable.
2. Add `tournament_registration_id` nullable.
3. Add agreement/read/decision metadata columns.
4. Make `race_id` nullable if the current schema allows it.
5. Keep old race-level records readable.
6. Later backfill and enforce stricter constraints for new championship-level contracts.

Important rules:

```txt
jockey_invitations is not the official participant.
ACCEPTED contract is not the locked participant.
TournamentParticipant is the official horse-jockey pair.
race_participants is only a per-round projection.
Owner can only send a new championship-level contract to a jockey that is APPROVED_FOR_POOL for the same tournament.
Owner can only send a contract for an APPROVED horse registration.
```

Final v1 flow:

```txt
JockeyTournamentApplication APPROVED_FOR_POOL
+ TournamentRegistration APPROVED
-> Owner selects approved jockey from the same championship pool
-> Owner sends jockey_invitations assignment contract
-> Jockey ACCEPTED
-> Admin locks participants
-> Create TournamentParticipant
-> Generate RaceParticipant per round if needed
```

## Championship Lifecycle

Use one primary tournament state machine, with UI labels translated to championship language.

```txt
DRAFT
-> OPEN_REGISTRATION
-> CLOSED_REGISTRATION
-> PARTICIPANTS_LOCKED
-> ONGOING
-> COMPLETED
```

`PARTICIPANTS_LOCKED` is the one new tournament status this spec recommends adding. It is needed to separate "registration is closed" from "official horse-jockey pairs are locked".

UI can display:

```txt
ONGOING = Racing
```

### DRAFT

Admin is setting up the championship.

Allowed:

- Edit championship setup
- Create scheduled rounds
- Edit scheduled rounds
- Delete scheduled rounds
- Open registration

Not allowed:

- Owner horse registration
- Tournament assignment contract creation
- Participant lock
- Race operations
- Result publishing

### OPEN_REGISTRATION

The championship is open for entry.

Allowed:

- Owner registers horses
- Jockey applies to the championship pool
- Admin reviews horse registrations
- Admin reviews jockey pool applications
- Admin creates or edits tentative rounds
- Admin closes registration

Owner and Jockey can see the tentative schedule.

UI wording:

```txt
Tentative Schedule
Subject to participant lock
```

Not allowed:

- Start race operations
- Publish results
- Complete championship

### CLOSED_REGISTRATION

New registrations are closed.

Allowed:

- Admin reviews remaining pending horse registrations
- Admin reviews remaining pending jockey pool applications
- Owner sends tournament assignment contract to eligible jockey
- Jockey accepts or rejects contract
- Admin locks participants when all requirements are ready

Not allowed:

- New horse registrations
- New jockey pool applications
- Race operations
- Result publishing

### PARTICIPANTS_LOCKED

Horse and jockey pairings are official.

Allowed:

- Finalize official `TournamentParticipant` records
- Mark schedule as official in DTOs with `isOfficial = true`
- Start championship racing

At this phase, the schedule becomes official.

UI wording:

```txt
Official Schedule
```

Not allowed:

- New registration
- Changing participant horse or jockey without a future explicit exception flow

### ONGOING

The championship is actively running. UI can label this as `Racing`.

Allowed:

- Open Round Control Center
- Start checks
- Mark ready
- Start race
- Finish race
- Submit results
- Confirm results
- Publish results
- Update standings after publish
- Complete championship when all rounds are published

Not allowed:

- Edit locked participant pairs
- Delete rounds
- Edit round schedule except postpone/cancel with reason

### COMPLETED

The championship is finished.

Allowed:

- View final standings
- View results
- View participants
- View history/audit

Not allowed:

- Operational edits
- New registrations
- New contracts
- New race operations

## Round Lifecycle

Use the existing race status values in v1.

```txt
SCHEDULED
-> CHECKING
-> READY
-> ONGOING
-> FINISHED
-> RESULT_SUBMITTED
-> RESULT_CONFIRMED
-> PUBLISHED
```

Optional terminal states:

```txt
CANCELLED
POSTPONED if added later
```

Do not add `LOCKED` as a `Race.status` in v1. It would force extra enum, badge, seed, FE, and test changes.

Instead, expose official schedule as a DTO field:

```txt
isOfficial = tournament.status in [PARTICIPANTS_LOCKED, ONGOING, COMPLETED]
```

If the product later needs per-round official overrides, add a persisted `is_official` column then. It is not required for the first backend integration.

### SCHEDULED

The round is scheduled. It can be tentative or official depending on `isOfficial`.

Allowed:

- Owner/Jockey can view it as tentative during `OPEN_REGISTRATION`
- Admin can edit it before participants are locked
- Admin can start checks only when tournament is `ONGOING`

UI wording:

```txt
Tentative Schedule when isOfficial = false
Official Schedule when isOfficial = true
```

### CHECKING

Admin/referee is checking race-day readiness.

Allowed:

- Mark ready
- Cancel/postpone with reason if future scope supports it

### READY

The round is cleared to start.

Allowed:

- Start race

### ONGOING

The race is currently in progress.

Allowed:

- Finish race

### FINISHED

The race is finished and waiting for result entry.

Allowed:

- Submit results

### RESULT_SUBMITTED

Results have been entered but not confirmed.

Allowed:

- Confirm results

### RESULT_CONFIRMED

Results are confirmed and ready to publish.

Allowed:

- Publish results

### PUBLISHED

Results are official.

System behavior:

- Calculate championship standing points using the fixed v1 table
- Update standings
- Trigger prediction settlement if the prediction module is connected

Not allowed:

- Edit results without a future correction/audit flow

## Schedule Rule

Rounds should be created before or during `OPEN_REGISTRATION`.

Reason:

- Owner needs to know if the horse can participate.
- Jockey needs to know if they are available.
- Admin needs a schedule to communicate the season.
- A championship should not require users to register blind.

Rule:

```txt
Rounds are created before or during OPEN_REGISTRATION as tentative schedule.
Owner and jockey can see tentative rounds before deciding to register/apply.
Rounds become official only after participants are locked.
Race operations start only when championship enters ONGOING phase.
```

## Workflow Summary

```txt
1. Admin creates Tournament
   tournament.status = DRAFT

2. Admin creates Race records
   race.status = SCHEDULED
   round.isOfficial = false

3. Admin opens registration
   tournament.status = OPEN_REGISTRATION

4. Owner registers horse
   tournament_registration.status = PENDING

5. Jockey applies to championship pool
   jockey_tournament_application.status = PENDING

6. Admin reviews horse registrations
   tournament_registration.status = APPROVED / REJECTED

7. Admin reviews jockey pool applications
   jockey_tournament_application.status = APPROVED_FOR_POOL / REJECTED

8. Admin closes registration
   tournament.status = CLOSED_REGISTRATION

9. Owner sends tournament assignment contract to eligible jockey
   assignment_contract.status = PENDING

10. Jockey accepts contract
   assignment_contract.status = ACCEPTED
   participant candidate is ready

11. Admin locks participants
   tournament.status = PARTICIPANTS_LOCKED
   tournament_participants are created or finalized
   scheduled races remain SCHEDULED
   round.isOfficial = true

12. Admin starts racing
    tournament.status = ONGOING

13. For each round:
    SCHEDULED
    -> CHECKING
    -> READY
    -> ONGOING
    -> FINISHED
    -> RESULT_SUBMITTED
    -> RESULT_CONFIRMED
    -> PUBLISHED

14. When result is published:
    update standings
    settle predictions if applicable

15. After all rounds are published:
    Admin completes championship
    tournament.status = COMPLETED
```

## State Transition Rules

### Tournament Transitions

Allowed:

```txt
DRAFT -> OPEN_REGISTRATION
OPEN_REGISTRATION -> CLOSED_REGISTRATION
CLOSED_REGISTRATION -> PARTICIPANTS_LOCKED
PARTICIPANTS_LOCKED -> ONGOING
ONGOING -> COMPLETED
```

Possible existing exception:

```txt
OPEN_REGISTRATION -> POSTPONED
CLOSED_REGISTRATION -> POSTPONED
ONGOING -> POSTPONED
POSTPONED -> OPEN_REGISTRATION or ONGOING depending previous state
```

Do not allow:

- `DRAFT -> ONGOING`
- `OPEN_REGISTRATION -> ONGOING`
- `CLOSED_REGISTRATION -> ONGOING`
- `PARTICIPANTS_LOCKED -> COMPLETED`
- `COMPLETED -> any operational state`

### Race Transitions

Allowed:

```txt
SCHEDULED -> CHECKING
CHECKING -> READY
READY -> ONGOING
ONGOING -> FINISHED
FINISHED -> RESULT_SUBMITTED
RESULT_SUBMITTED -> RESULT_CONFIRMED
RESULT_CONFIRMED -> PUBLISHED
```

Do not allow:

- `SCHEDULED -> CHECKING` before tournament is `ONGOING`
- `SCHEDULED -> ONGOING`
- `RESULT_SUBMITTED -> PUBLISHED`
- `PUBLISHED -> any normal operational state`

## Allowed Actions By Phase

| Phase | Admin | Owner | Jockey |
| --- | --- | --- | --- |
| `DRAFT` | Create/edit championship, create/edit/delete scheduled rounds, open registration | No registration | View nothing or public info only |
| `OPEN_REGISTRATION` | Review horse registrations, review jockey pool applications, create/edit tentative rounds, close registration | Register horse | Apply to championship pool, view tentative schedule |
| `CLOSED_REGISTRATION` | Finish reviews, monitor contracts, lock participants | Send contract to eligible jockey | Accept/reject contract |
| `PARTICIPANTS_LOCKED` | Start racing, view official schedule | View official schedule | View official schedule |
| `ONGOING` | Round Control Center, publish results, update standings | View schedule/results | View schedule/results |
| `COMPLETED` | View final records | View final standings | View final standings |

## API Facade

The facade should support the FE command center without forcing the FE to infer lifecycle from many separate endpoints.

### Sprint 1 Priority

The first backend integration should implement:

```txt
GET /api/v1/admin/championships/{id}/workspace
```

This API is the heart of the Admin Championship Workspace because it feeds:

- header
- overview
- phase
- current round
- next action
- Continue Operations
- readiness counts

### Championship Workspace

```txt
GET /api/v1/admin/championships/{id}/workspace
```

Maps internally to `Tournament`.

Response shape:

```json
{
  "id": 7,
  "name": "Summer Championship 2026",
  "code": "SUMMER_2026",
  "location": "Belmont Park",
  "status": "ONGOING",
  "phase": "ONGOING",
  "phaseLabel": "Racing",
  "currentRound": {
    "id": 41,
    "name": "Round 1 - Belmont Stakes",
    "code": "SUM_R1",
    "status": "SCHEDULED",
    "isOfficial": true,
    "raceDateTime": "2026-06-06T11:00:00"
  },
  "nextAction": {
    "code": "START_CHECKS",
    "label": "Start Operational Checks",
    "target": "ROUND_CONTROL_CENTER",
    "roundId": 41
  },
  "counts": {
    "pendingRegistrations": 2,
    "approvedRegistrations": 18,
    "participants": 12,
    "rounds": 8,
    "publishedRounds": 3
  },
  "readiness": {
    "hasRounds": true,
    "registrationsClosed": true,
    "participantsLocked": true,
    "standingsReady": true
  }
}
```

### Championship Rounds

```txt
GET  /api/v1/admin/championships/{id}/rounds
POST /api/v1/admin/championships/{id}/rounds
```

Maps internally to `RaceService`.

Create payload can use existing race request fields:

```json
{
  "name": "Round 3 - Saigon Sprint",
  "code": "SUM_R3",
  "raceDateTime": "2026-06-20T11:00:00",
  "distanceMeters": 1400,
  "maxParticipants": 12
}
```

The backend should inject `tournamentId` from the path.

### Championship Applications

In product UI, championship applications can be grouped together to reduce navigation overload:

```txt
Applications
├─ Horse Registrations
└─ Jockey Pool Applications
```

Backend endpoints should stay explicit.

### Championship Horse Registrations

```txt
GET /api/v1/admin/championships/{id}/horse-registrations
```

Returns registrations scoped to the championship.

Optional query params:

```txt
status=PENDING|APPROVED|REJECTED|WITHDRAWN
page=0
size=10
```

Existing global route can remain:

```txt
GET /api/v1/admin/tournament-registrations
```

### Championship Jockey Pool Applications

```txt
GET  /api/v1/admin/championships/{id}/jockey-pool-applications
POST /api/v1/jockey/championships/{id}/pool-applications
POST /api/v1/admin/championships/{id}/jockey-pool-applications/{applicationId}/approve
POST /api/v1/admin/championships/{id}/jockey-pool-applications/{applicationId}/reject
POST /api/v1/jockey/championships/{id}/pool-applications/{applicationId}/withdraw
```

Admin list supports:

```txt
status=PENDING|APPROVED_FOR_POOL|REJECTED|WITHDRAWN
page=0
size=10
```

Owner jockey selection should use only approved pool members:

```txt
GET /api/v1/owner/championships/{id}/jockey-pool
```

This returns jockeys with `JockeyTournamentApplication.status = APPROVED_FOR_POOL` for the same championship.

### Championship Participants

```txt
GET /api/v1/admin/championships/{id}/participants
POST /api/v1/admin/championships/{id}/participants/lock
```

`lock` validates:

- Championship is `CLOSED_REGISTRATION`
- No blocking pending registrations
- No blocking pending jockey pool applications that admin chooses to require before lock
- Required tournament assignment contracts are accepted
- There is at least one official participant candidate
- Rounds intended for the season exist

On success:

- Create/finalize `TournamentParticipant`
- Move tournament to `PARTICIPANTS_LOCKED`

Do not change race status on participant lock. Return `isOfficial = true` in DTOs instead.

### Championship Standings

```txt
GET /api/v1/admin/championships/{id}/standings
```

Returns season standings based on published round results.

### Round Control Center

```txt
GET /api/v1/admin/rounds/{id}/control-center
```

Maps internally to `Race`.

Response shape:

```json
{
  "round": {
    "id": 41,
    "tournamentId": 7,
    "name": "Round 1 - Belmont Stakes",
    "status": "SCHEDULED",
    "isOfficial": true,
    "raceDateTime": "2026-06-06T11:00:00",
    "distanceMeters": 1600,
    "maxParticipants": 12
  },
  "championship": {
    "id": 7,
    "name": "Summer Championship 2026",
    "status": "ONGOING",
    "phaseLabel": "Racing"
  },
  "participants": [],
  "resultStatus": "NOT_ENTERED",
  "nextAction": {
    "code": "START_CHECKS",
    "label": "Start Checks"
  }
}
```

### Round Actions

Use specific action routes for the new facade.

```txt
POST /api/v1/admin/rounds/{id}/start-checks
POST /api/v1/admin/rounds/{id}/mark-ready
POST /api/v1/admin/rounds/{id}/start-race
POST /api/v1/admin/rounds/{id}/finish-race
POST /api/v1/admin/rounds/{id}/submit-results
POST /api/v1/admin/rounds/{id}/confirm-results
POST /api/v1/admin/rounds/{id}/publish-results
```

Existing route can remain:

```txt
PUT /api/v1/admin/races/{id}/status
```

The action routes are clearer for the new lifecycle UI and easier to validate.

## Next Action Computation

The workspace API should compute `nextAction` server-side.

Suggested logic:

```txt
if tournament.status = DRAFT and no rounds:
  nextAction = CREATE_ROUND

if tournament.status = DRAFT and has rounds:
  nextAction = OPEN_REGISTRATION

if tournament.status = OPEN_REGISTRATION and pending registrations > 0:
  nextAction = REVIEW_HORSE_REGISTRATIONS

if tournament.status = OPEN_REGISTRATION and pending jockey pool applications > 0:
  nextAction = REVIEW_JOCKEY_POOL

if tournament.status = OPEN_REGISTRATION and registration window should close:
  nextAction = CLOSE_REGISTRATION

if tournament.status = CLOSED_REGISTRATION and pending reviews exist:
  nextAction = REVIEW_REMAINING_REGISTRATIONS

if tournament.status = CLOSED_REGISTRATION and participants are ready:
  nextAction = LOCK_PARTICIPANTS

if tournament.status = PARTICIPANTS_LOCKED:
  nextAction = START_RACING

if tournament.status = ONGOING:
  nextAction = next action of current active round

if all rounds are PUBLISHED:
  nextAction = COMPLETE_CHAMPIONSHIP

if tournament.status = COMPLETED:
  nextAction = REVIEW_STANDINGS
```

Current round should be:

```txt
earliest non-published, non-cancelled round ordered by raceDateTime
```

## Visibility Rules

### Admin

Admin can see all lifecycle data.

### Owner

Owner can see:

- Open championships
- Tentative schedule in `OPEN_REGISTRATION`
- Their registrations
- Approved jockey pool members for championships where the owner has approved horse registrations
- Tournament assignment contract state
- Official schedule after `PARTICIPANTS_LOCKED`
- Results/standings after publish

Owner cannot see:

- Internal admin readiness checks
- Other owners' private registration notes

### Jockey

Jockey can see:

- Open championships
- Tentative schedule in `OPEN_REGISTRATION`
- Their championship pool application state
- Tournament assignment contract inbox
- Official schedule after committed participant lock
- Results/standings after publish

Jockey cannot see:

- Other jockey private contract/application details
- Internal admin readiness checks

### Send Assignment Contract

Allowed when:

- Championship is `CLOSED_REGISTRATION`
- Horse registration is `APPROVED`
- Jockey pool application is `APPROVED_FOR_POOL`
- Jockey belongs to the same championship pool
- Horse does not already have an accepted active contract in the same championship
- Jockey does not already have an accepted active contract in the same championship

On success:

- `jockey_invitations.status = PENDING`
- contract references `tournament_id` and `tournament_registration_id`

## Validation Rules

### Create Round

Allowed when tournament status is:

- `DRAFT`
- `OPEN_REGISTRATION`

Reject when:

- `PARTICIPANTS_LOCKED`
- `ONGOING`
- `COMPLETED`

Required:

- name
- code
- raceDateTime
- distanceMeters > 0
- maxParticipants >= 2

### Open Registration

Allowed when:

- Tournament is `DRAFT`
- Required tournament setup fields exist

Recommended:

- At least one round exists

On success:

- Tournament becomes `OPEN_REGISTRATION`
- Existing rounds remain `SCHEDULED`

### Close Registration

Allowed when:

- Tournament is `OPEN_REGISTRATION`

On success:

- Tournament becomes `CLOSED_REGISTRATION`
- New owner registrations are blocked

### Lock Participants

Allowed when:

- Tournament is `CLOSED_REGISTRATION`
- Participants are ready

On success:

- Tournament becomes `PARTICIPANTS_LOCKED`
- Official participant records are locked/finalized
- Race status values remain unchanged
- Round DTOs return `isOfficial = true`

### Start Racing

Allowed when:

- Tournament is `PARTICIPANTS_LOCKED`
- There is at least one scheduled round
- There is at least one participant

On success:

- Tournament becomes `ONGOING`

### Start Checks

Allowed when:

- Tournament is `ONGOING`
- Race is `SCHEDULED`
- Race DTO is official

On success:

- Race becomes `CHECKING`

### Publish Result

Allowed when:

- Tournament is `ONGOING`
- Race is `RESULT_CONFIRMED`

On success:

- Race becomes `PUBLISHED`
- Standings are recalculated using the fixed v1 championship standing points table
- Prediction settlement is triggered if prediction module is enabled

### Complete Championship

Allowed when:

- Tournament is `ONGOING`
- All non-cancelled rounds are `PUBLISHED`

On success:

- Tournament becomes `COMPLETED`

## Error Handling

Use clear business errors.

Examples:

```txt
Cannot start racing before participants are locked.
Cannot create a round after championship racing has started.
Cannot lock participants while registrations are still pending review.
Cannot send a contract to a jockey outside this championship pool.
Cannot send a contract before the horse registration is approved.
Cannot publish results before they are confirmed.
Cannot register horse after registration is closed.
```

Avoid generic errors like:

```txt
Invalid status transition.
Bad request.
Operation failed.
```

## Testing Strategy

### Backend Integration Tests

Add tests for:

- Tournament lifecycle transition success path
- Tournament invalid transition rejection
- Race lifecycle transition success path
- Race invalid transition rejection
- Create round allowed in `DRAFT`
- Create round allowed in `OPEN_REGISTRATION`
- Create round rejected in `ONGOING`
- Owner registration rejected after `CLOSED_REGISTRATION`
- Jockey pool application accepted in `OPEN_REGISTRATION`
- Jockey pool application rejected outside registration window
- Owner can only list approved jockeys from the same championship pool
- Owner cannot send contract to jockey outside the same championship pool
- Lock participants creates/finalizes `TournamentParticipant`
- Lock participants does not mutate race status to a new value
- Publish result updates standings
- Publish result awards 25 points for first place, 18 for second place, and 15 for third place

### API Facade Tests

Add tests for:

- `GET /api/v1/admin/championships/{id}/workspace`
- workspace response includes `phase`, `phaseLabel`, `currentRound`, `nextAction`, counts, readiness
- workspace current round uses earliest non-published round
- workspace round DTO includes `isOfficial`
- `GET /api/v1/admin/championships/{id}/horse-registrations` only returns scoped horse registrations
- `GET /api/v1/admin/championships/{id}/jockey-pool-applications` only returns scoped jockey applications
- `POST /api/v1/admin/championships/{id}/rounds` creates a `Race`
- round action routes update `Race` state correctly

### Frontend Contract Tests

Frontend API wrappers should assert:

- workspace API shape
- scoped horse registrations API
- scoped jockey pool application API
- scoped rounds API
- round action routes

## Implementation Order

Recommended order:

1. Add status constants for existing tournament/race strings.
2. Add `PARTICIPANTS_LOCKED` tournament status.
3. Add transition validation helpers.
4. Add `AdminChampionshipWorkspaceController`.
5. Add `AdminChampionshipWorkspaceService`.
6. Add workspace DTOs.
7. Add scoped horse registrations endpoint.
8. Add `JockeyTournamentApplication` entity/repository/service.
9. Add scoped jockey pool application endpoints.
10. Add approved jockey pool endpoint for owner contract selection.
11. Add scoped rounds facade endpoint.
12. Add `TournamentParticipant` entity/repository/service.
13. Add participant lock endpoint.
14. Add round control center DTO.
15. Add specific round action endpoints.
16. Add standings endpoint.
17. Connect FE to new facade APIs.

Sprint 1 should focus on the workspace API first:

```txt
GET /api/v1/admin/championships/{id}/workspace
```

Do not start by renaming entities.

## Non-Goals

- No database/entity rename from Tournament/Race to Championship/Round.
- No route migration of existing legacy endpoints.
- No generic role-request style `JockeyApplication`; v1 uses championship-scoped `JockeyTournamentApplication` only.
- No configurable championship standing point rules in v1.
- No mixing user reward points with championship standing points.
- No public championship page.
- No salary, betting, contract negotiation marketplace, or earnings feature.
- No leaderboard redesign.
- No analytics dashboard.
- No automated scheduler replacing explicit admin lifecycle controls in this phase.

## Final Decision

Proceed with a backend lifecycle facade.

Core stays:

```txt
Tournament / Race
```

Admin product language becomes:

```txt
Championship / Round
```

V1 scope is:

```txt
Workspace API first.
JockeyTournamentApplication formalized as championship pool application.
TournamentParticipant formalized.
Race status stays as-is.
Official schedule exposed through isOfficial DTO field.
Assignment contracts can only target approved jockeys from the same championship pool.
```

This gives the current UI a stable backend contract without risky full naming migration or unnecessary workflow expansion.
