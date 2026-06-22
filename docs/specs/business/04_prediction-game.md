# Prediction Game

## 1. Purpose

The prediction feature gives spectators a game-like engagement layer without affecting official race operations. Users spend internal points to submit predictions and can receive internal rewards after official race results are settled.

## 2. Non-Betting Principles

- No real money.
- No deposits or withdrawals.
- No cash conversion.
- No odds.
- No user-to-user redistribution pool.
- No gambling payout workflow.

The system uses virtual points only.

## 3. User Flow

1. Load open races: `GET /api/v1/races/open-for-prediction`.
2. Load prediction options: `GET /api/v1/races/{raceId}/prediction-options`.
3. Submit prediction: `POST /api/v1/predictions`.
4. Update prediction before lock: `PUT /api/v1/predictions/{id}`.
5. View own predictions: `GET /api/v1/predictions/my`.
6. View own point account: `GET /api/v1/point-accounts/me`.

Frontend implementation: `frontend/src/pages/spectator/predictions`.

## 4. Prediction Types And Statuses

- Types: `WINNER`, `TOP3`.
- Statuses: `PENDING`, `LOCKED`, `CORRECT`, `INCORRECT`, `CANCELLED`, `REFUNDED`.

Top-3 selections must be distinct. Winner selection uses the selected winner participant.

## 5. Point Policy

Prediction point values are not hardcoded in the UI. Admin point settings provide:

- `PREDICTION_ENTRY_COST`
- `PREDICTION_CORRECT_REWARD`

The backend owns validation and balance updates.

## 6. Admin Audit

Admin prediction workspace reads:

- race summaries;
- race prediction detail;
- submitted predictions for a race;
- settlement job status and retry action.

Backend API group: `/api/v1/admin/predictions`.
