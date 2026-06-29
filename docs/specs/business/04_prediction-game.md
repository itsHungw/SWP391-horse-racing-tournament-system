# Prediction Game

## 1. Purpose

The prediction feature gives spectators an engagement and wagering layer without affecting official race operations. Users spend VND wallet balance to submit predictions and can receive wallet payouts or refunds after official race results are settled.

Official results remain owned by referee and organizer/admin workflows.

## 2. Money Principles

- Wallet unit is VND stored as integer `long`/`bigint`.
- A prediction debit is recorded as `BET_PLACED`.
- A winning settlement credit is recorded as `BET_PAYOUT`.
- A void/cancel/refund credit is recorded as `BET_REFUND`.
- Wallet transaction idempotency prevents duplicate credits/debits for the same reference.
- Wager and payout caps are configured under `app.prediction.*`.

The legacy `/api/v1/point-accounts/me` endpoint maps wallet balance to a `pointBalance` field for older frontend compatibility.

## 3. User Flow

1. Load open races: `GET /api/v1/races/open-for-prediction`.
2. Load prediction options: `GET /api/v1/races/{raceId}/prediction-options`.
3. Quote a prediction: `POST /api/v1/predictions/quote`.
4. Submit prediction: `POST /api/v1/predictions`.
5. View own predictions: `GET /api/v1/predictions/my`.
6. Submit streak ticket: `POST /api/v1/streak`.
7. View streak tickets: `GET /api/v1/streak`.
8. View wallet balance: `GET /api/v1/wallet/me` or compatibility `GET /api/v1/point-accounts/me`.

Frontend implementation: `frontend/src/pages/spectator/predictions`.

## 4. Prediction Types And Statuses

- Live single-race types: `EXACT_POSITION`, `HEAD_TO_HEAD`.
- Streak tickets: accumulator across multiple race legs.
- Deprecated compatibility type: `WINNER`; not offered for new submissions.
- Removed type: `TOP3`; migration `V18` drops related columns.

Prediction statuses:

- `PENDING`
- `LOCKED`
- `CORRECT`
- `INCORRECT`
- `CANCELLED`
- `REFUNDED`

Streak statuses:

- `PENDING`
- `IN_PROGRESS`
- `WON`
- `LOST`
- `REFUNDED`

## 5. Edit Policy

Predictions cannot be edited after placement. `PUT /api/v1/predictions/{id}` returns method-not-allowed behavior with the message that predictions cannot be edited after placement.

## 6. Admin Audit

Admin prediction workspace reads:

- race summaries;
- race prediction detail;
- submitted predictions for a race;
- settlement job status and retry action.

Backend API group: `/api/v1/admin/predictions`.

For detailed odds, payout, and risk rules, see `docs/specs/technical/08_prediction-odds-and-payout.md`.
