# Manual test — referee result package & rider objections

Walkthrough for testing the flow by hand against a real backend. Use it to verify changes and as
the script for a live demo.

Accounts (dev seed, all share the password `123456789`):

| Role | Email |
|---|---|
| Referee | `referee@horseracing.com` (Jonathan Whitmore) |
| Organizer | `organizer1@horseracing.com` (owns Royal Ascendancy Cup 2026) |

---

## 0. Start the stack

Three pieces, in this order.

```bash
docker compose up -d postgres
```

Backend — must be launched through the script, because Spring Boot does not read `.env` natively:

```bash
powershell -File run-backend.ps1
```

Wait for `Started BackendApplication` in the output. Then the frontend:

```bash
cd frontend && npm run dev
```

If every `/api/v1/*` call fails with `ECONNREFUSED`, the backend is not up yet — the frontend
alone is not enough to test this flow.

---

## 1. Full path — race day from scratch

Best for a demo: it shows the live clock feeding the result.

Pick any race in `SCHEDULED` status assigned to the referee:

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "select id, name, status from races where referee_id=(select id from users where email='referee@horseracing.com') and status='SCHEDULED' order by id limit 5;"
```

Log in as the **referee**, then open `/referee/races/<id>/officiate`.

1. **Pre-race checks** — mark runners passed or scratched, then *Mark race ready*.
   A scratched runner needs a reason before the button unlocks.
2. **Ready** — *Confirm & Enter Live Control*.
3. **Live control** — the clock runs. Try:
   - *Finish \<horse\>* on each runner as it crosses
   - *Disqualify \<horse\>* on one runner
   - the flag buttons (safety car, red flag) — the clock must **not** jump forward when you resume
4. When every runner is settled, *PROCEED TO POST-RACE*.
5. **Draft finish order** — check the scratched runner appears under
   *Did not start / did not finish / disqualified* labelled **DNS**, not DNF. Adjust a total time with
   *Update Time* if you want; rows only reorder after you save the override.
6. *Continue to submit results* — this hands the live times over; the next screen must arrive
   **pre-filled**, not empty.

Continue at section 3.

## 2. Short path — objections only

Skips race day. Use a race already in `FINISHED`:

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "select id, name from races where status='FINISHED' and referee_id=(select id from users where email='referee@horseracing.com');"
```

Log in as the referee and go straight to `/referee/races/<id>/results`.

Note: reaching this screen directly means no live draft is handed over, so the finish times start
empty and you type them yourself. That is expected — the handoff only happens via the button in
section 1 step 6.

---

## 3. The result package screen

Everything the organizer receives is assembled here.

**Finish order** — every finished runner needs a position and a time. Duplicate positions are
rejected before the request is sent.

**Incidents and objections** — record what a rider raised at weigh-in. Two variants:

- *Against another runner* — needs the accused runner, a foul type, optionally a video mark
- *No opposing runner* — for the referee's own penalty, track condition, or equipment

Check these behaviours:

| Do this | Expect |
|---|---|
| Leave *Against* empty on an interference objection, press Record | `Select the runner being objected against.` |
| Leave *Detail* empty, press Record | `Describe what happened.` |
| Record one objection | `1 objection recorded`, and **no delete button** — the referee cannot make it disappear |
| Switch to *No opposing runner* | *Against* and *Foul type* vanish, *Subject* appears |

Set a **Decision** on each objection. The middle option matters most — *Rider penalty, result
stands* means the objection was upheld but the placings do not change.

**Official report** — fill the summary. It is submitted with the package, not separately.

Press **Submit package to organizer**. The message must read *"Package submitted. Awaiting
organizer confirmation."* — if it ever says "confirmed", that is a bug: only the organizer confirms.

The form then locks and shows *Results submitted — awaiting organizer confirmation.*

---

## 4. Organizer side

Log in as the organizer. Either surface works — both show the same panel:

- `/organizer/results` → pick the championship → open the round
- `/organizer/tournaments/<id>` → round drawer → *Organizer Result Ratification*

Check:

- an amber **`N objection(s)`** badge, so it cannot be skimmed past
- each objection's text and the referee's decision, in words rather than a code
- the **Referee report** summary
- **Confirm Results** is *not* blocked — objections arrive already ruled on

### Send back

Press **Send back** and type a reason.

The race returns to `FINISHED` and the referee gets a notification. Reopen the referee's
`/referee/races/<id>/results`: an amber banner shows **Returned by the organizer** with that
reason, and the previously submitted values are still in the form so nothing has to be retyped.

Fix something, submit again — the banner clears, and the objection is **not** duplicated.

### Confirm

Press **Confirm Results**. This is the point of no return: the race moves to `RESULT_CONFIRMED`
and the settlement job is created, which is when prediction payouts happen. Nothing after this
reverses bets — which is exactly why objections are only accepted before it.

---

## 5. Verifying in the database

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "select violation_type, participant_id, penalty, severity, left(description, 60) from violations where race_id=<id>;"
```

Expect `OBJECTION_INTERFERENCE` or `OBJECTION_GENERAL` with the decision in `penalty`
(`NO_CHANGE` / `RIDER_PENALTY` / `RESULT_AMENDED`).

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "select left(summary,60), rejection_reason from referee_reports where race_id=<id>;"
```

`rejection_reason` holds the organizer's send-back reason and clears on resubmit.

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "select participant_id, result_status, position, note from race_results where race_id=<id> order by position;"
```

Two things to confirm here:

- a scratched runner is stored as `WITHDRAWN`, never `DID_NOT_FINISH`
- per-runner `note` values survive a send-back — the reason must not overwrite them

---

## 6. Resetting for another run

Dev database only. This bypasses the state machine, so never point it at anything real.

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "update races set status='FINISHED' where id=<id>; delete from violations where race_id=<id>; update referee_reports set rejection_reason=null where race_id=<id>;"
```

To rerun the whole race day instead, also clear the results and put the race back to `SCHEDULED`:

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "delete from race_results where race_id=<id>; update races set status='SCHEDULED' where id=<id>;"
```

---

## Known noise

- The frontend suite fails one or two random files per full run (a different file each time) and
  passes when those files run alone. Pre-existing on `develop`, unrelated to this flow.
- Live race state — clock, penalties, finish times — lives only in browser memory. Reloading during
  or right after a race loses it, and the draft handoff has nothing to pass on. Tracked separately.
