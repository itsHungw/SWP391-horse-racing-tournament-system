# Design Specification: Admin Predictions Audit and Monitoring Flow

## Goal & Product Context

The prediction game exists to increase spectator engagement around upcoming horse races without introducing real-money gambling or pool-based betting. Instead, spectators spend virtual, in-system points (earned via reading blogs or event rewards) to submit predictions.

This specification outlines:
1. The **Predictions Submission & Lifecycle** flow.
2. The **Asynchronous Settlement Flow** (Transactional Outbox Pattern) via a background scheduler.
3. The **Admin Predictions Audit & Monitoring Workspace**, designed to monitor predictions *grouped by Race/Round*, track execution logs, review errors, and retry failed settlement jobs.

---

## 1. Database Schema

The system uses Microsoft SQL Server. The prediction and point-account tables are already defined in the existing database bootstrap script. This design adds the asynchronous settlement job table and a unique idempotency constraint.

### 1.1 `prediction_settlement_jobs` (NEW)
Tracks asynchronous batch settlement tasks created when race results are published.

```sql
IF OBJECT_ID(N'dbo.prediction_settlement_jobs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.prediction_settlement_jobs (
        id BIGINT IDENTITY(1,1) NOT NULL,
        race_id BIGINT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
        processed_count INT NOT NULL DEFAULT 0,
        rewarded_count INT NOT NULL DEFAULT 0,
        failed_count INT NOT NULL DEFAULT 0,
        retry_count INT NOT NULL DEFAULT 0,
        error_message NVARCHAR(MAX) NULL,
        started_at DATETIME2 NULL,
        completed_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NULL,
        
        CONSTRAINT pk_prediction_settlement_jobs PRIMARY KEY (id),
        CONSTRAINT fk_psj_race FOREIGN KEY (race_id) REFERENCES dbo.races(id),
        CONSTRAINT uq_psj_race UNIQUE (race_id),
        CONSTRAINT chk_psj_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
    );
END;
```

### 1.2 Idempotency Index on `point_transactions` (NEW)
Ensures points are never awarded multiple times for the same prediction during job retries.

```sql
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = N'uq_point_tx_idempotency' 
      AND object_id = OBJECT_ID(N'dbo.point_transactions')
)
BEGIN
    CREATE UNIQUE INDEX uq_point_tx_idempotency 
    ON dbo.point_transactions(reference_type, reference_id, transaction_type)
    WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
END;
```

*   **Rule**: When reward points are credited, a transaction is created with `reference_type = 'RACE_PREDICTION'`, `reference_id = predictionId`, and `transaction_type = 'PREDICTION_REWARD'`.

---

## 2. API Endpoints Contract

### 2.1 Spectator Predictions API
*   **`GET /api/v1/races/{raceId}/prediction-options`**
    *   Retrieves participant details for prediction select boxes.
    *   Response:
        ```json
        {
          "raceId": 12,
          "raceName": "Opening Sprint",
          "raceStatus": "SCHEDULED",
          "predictionOpen": true,
          "entryCost": { "WINNER": 5, "TOP3": 10 },
          "myPrediction": null,
          "options": [
            {
              "raceParticipantId": 1,
              "startNumber": 3,
              "laneNumber": 2,
              "horseName": "Thunder Bolt",
              "jockeyName": "Nguyen Van A"
            }
          ]
        }
        ```
*   **`POST /api/v1/predictions`**
    *   Submits a new prediction. Deducts points and records a transaction in a single database transaction.
    *   Body: `{ "raceId": 12, "predictionType": "WINNER", "predictedWinnerId": 1 }`
*   **`PUT /api/v1/predictions/{id}`**
    *   Updates horse selections (only if status is `PENDING` and race is `SCHEDULED`). Does not change points or allow changing prediction type.
*   **`GET /api/v1/predictions/my`**
    *   Filters: `status`, `raceId`, `predictionType`, `page`, `size`.
*   **`GET /api/v1/point-accounts/me`**
    *   Retrieves virtual point balance and personal ledger history.

### 2.2 Admin Predictions Audit API
*   **`GET /api/v1/admin/predictions/races`**
    *   Retrieves paginated summaries of predictions grouped by Race/Round.
    *   Query params: `tournamentId`, `predictionStatus`, `raceStatus`, `page`, `size`.
    *   Response:
        ```json
        {
          "items": [
            {
              "raceId": 12,
              "raceName": "Opening Sprint",
              "roundName": "Round 1",
              "tournamentId": 3,
              "tournamentName": "Spring Cup 2026",
              "raceAt": "2026-06-10T14:30:00",
              "raceStatus": "SCHEDULED",
              "predictionStatus": "OPEN",
              "totalPredictions": 120,
              "winnerPickCount": 80,
              "top3PickCount": 40,
              "correctWinnerCount": 0,
              "exactTop3Count": 0,
              "partialTop3Count": 0,
              "incorrectCount": 0,
              "settlementJobStatus": null
            }
          ],
          "page": 0,
          "size": 10,
          "totalElements": 20
        }
        ```
*   **`GET /api/v1/admin/predictions/races/{raceId}`**
    *   Retrieves summary metrics and settlement job details for a specific race.
    *   Response:
        ```json
        {
          "raceId": 12,
          "raceName": "Opening Sprint",
          "roundName": "Round 1",
          "tournamentName": "Spring Cup 2026",
          "raceStatus": "RESULT_CONFIRMED",
          "predictionStatus": "COMPLETED",
          "summary": {
            "totalPredictions": 250,
            "winnerPickCount": 180,
            "top3PickCount": 70,
            "winnerCorrectCount": 80,
            "exactTop3Count": 20,
            "top3AnyOrderCount": 35,
            "incorrectCount": 115,
            "refundedCount": 0,
            "rewardedPoints": 1850
          },
          "settlementJob": {
            "id": 5,
            "status": "COMPLETED",
            "processedCount": 250,
            "rewardedCount": 135,
            "failedCount": 0,
            "retryCount": 1,
            "errorMessage": null,
            "startedAt": "2026-06-10T16:00:00",
            "completedAt": "2026-06-10T16:00:05"
          }
        }
        ```
*   **`GET /api/v1/admin/predictions/races/{raceId}/predictions`**
    *   Retrieves audit list of predictions for a specific race.
    *   Query params: `status`, `predictionType`, `resultCategory`, `spectatorKeyword`, `page`, `size`.
    *   Response row:
        ```json
        {
          "predictionId": 91,
          "spectatorName": "Nguyen Van A",
          "spectatorEmail": "a@gmail.com",
          "predictionType": "WINNER",
          "selections": ["Thunder Bolt"],
          "entryCostPoints": 5,
          "status": "PENDING",
          "displayStatus": "Submitted",
          "resultCategory": "Pending", // Winner Correct, Exact Top 3, Top 3 Any Order, Incorrect, Refunded, Pending, Locked
          "rewardPoints": 0,
          "submittedAt": "2026-06-03T10:30:00",
          "evaluatedAt": null
        }
        ```
*   **`POST /api/v1/admin/predictions/settlement-jobs/{jobId}/retry`**
    *   Resets job status back to `PENDING` to trigger scheduler rerun.

### 2.3 Admin Points API (Boundary Isolation)
Point rules configuration and manual point adjustments live in this module.
*   `GET /api/v1/admin/points/settings` / `PUT /api/v1/admin/points/settings`
*   `GET /api/v1/admin/points/ledger`
*   `POST /api/v1/admin/points/adjustments`

---

## 3. Backend Execution Logic

### 3.1 Prediction Submission Validation
*   Predictions are **ONLY** allowed when `race.status = 'SCHEDULED'`.
*   A user can have at most one prediction per race and prediction type.
*   The transaction will roll back completely if point balance is insufficient or participant validation fails.

### 3.2 Locking Predictions
*   When `RaceService` transitions a race from `SCHEDULED` to `CHECKING` (or any subsequent state), it calls `PredictionService.lockPredictionsForRace(raceId)`.
*   This transitions all `PENDING` predictions for that race to `LOCKED` (setting `locked_at = now`).

### 3.3 Cancellation & Refunds
*   When a race status is set to `CANCELLED`:
    *   Only predictions in `PENDING` or `LOCKED` statuses are processed.
    *   The prediction status transitions to `REFUNDED`.
    *   The entry cost is credited back using a transaction with `transaction_type = 'RACE_CANCEL_REFUND'` and `reference_id = predictionId`.
    *   Idempotency constraint checks prevent double refunds.

### 3.4 Concurrency Guard for Polling
To prevent multiple application instances from claiming the same PENDING job, workers must perform an atomic update:
```sql
UPDATE prediction_settlement_jobs
SET status = 'PROCESSING', started_at = SYSDATETIME(), retry_count = retry_count + 1
WHERE id = :jobId AND status = 'PENDING';
```
Only if the updated row count is exactly 1 does the current scheduler worker process the job.

### 3.5 Evaluation & Idempotency Rules
*   Winner evaluation: Match predicted participant ID with the participant ID having `position = 1` in `race_results`.
*   Top3 evaluation: Match predicted 1st, 2nd, 3rd with actual results. If exact order match, grant 30 points. If matching three participants but incorrect order, grant 15 points.
*   During points reward processing, the system checks the `uq_point_tx_idempotency` index. If a duplicate transaction error is caught or the reference exists, the reward point credit is skipped, keeping the ledger accurate.
*   The backend calculates a derived `resultCategory` field dynamically when returning API responses to distinguish exact top3 vs wrong order top3.

---

## 4. Frontend UI Design (Admin Predictions Workspace)

The interface is structured around a Race List monitor and a drill-down Race detail page.

### 4.1 Race Prediction Monitor (`/admin/predictions`)
*   Displays a list of all races configured in the system.
*   Filters at the top: Championship, Race Status, Prediction Status, Date Range.
*   Displays cards or rows for each race containing:
    *   Race Name / Round / Championship Name.
    *   **Prediction Status Badge**:
        *   `OPEN` (Green): Race status = `SCHEDULED`, predictions open.
        *   `LOCKED` (Gray): Race status = `CHECKING` / `READY` / `ONGOING`.
        *   `SETTLEMENT_PENDING` (Yellow): Race status = `RESULT_CONFIRMED`, job pending.
        *   `PROCESSING` (Blue): Job in progress.
        *   `COMPLETED` (Light Green): Job completed.
        *   `FAILED` (Red): Job failed.
        *   `REFUNDED` (Orange): Race cancelled, predictions refunded.
    *   Metric counts: Total predictions, Winner picks, Top 3 picks.
    *   `[View Details]` button leading to the drill-down detail view.

### 4.2 Race Prediction Detail (`/admin/predictions/races/{raceId}`)
Drill-down view detailing prediction breakdowns and logs.

#### If Prediction Status is `OPEN` or `LOCKED`:
*   **Header**: Race details, Championship name, Status badge (`OPEN` or `LOCKED`).
*   **Metrics Cards**:
    *   Total Predictions count.
    *   Winner Picks.
    *   Top 3 Picks.
    *   Total Entry Points.
*   **Audit Table**: List of spectator selections showing: Spectator name/email, type, horse selections, entry cost, status (`Submitted` or `Locked`), and submission timestamp.

#### If Prediction Status is `COMPLETED` or `FAILED`:
*   **Header**: Race details, Championship name, Status badge (`COMPLETED` or `FAILED`).
*   **Settlement Job Bar**: If job status is `FAILED`, display a red banner showing the error stack trace and a `[Retry]` button.
*   **Metrics Cards**:
    *   Total Predictions.
    *   Winner Correct (Won).
    *   Exact Top 3 (Won).
    *   Top 3 Any Order (Won).
    *   Incorrect (Lost).
    *   Total Points Rewarded.
*   **Audit Table**: List of spectator selections showing: Spectator, type, selections, Result Category (`Winner Correct`, `Exact Top 3`, `Top 3 Any Order`, `Incorrect`), Status, Entry Cost, Reward Points, and timestamps.
*   **Action**: Clicking an audited user prediction opens a drawer showing detail metrics and a link: `[View Related Point Transaction in Points Workspace]`.
