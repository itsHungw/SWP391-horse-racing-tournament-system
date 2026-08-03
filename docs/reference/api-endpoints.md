# API Endpoint Reference

Every HTTP endpoint the backend exposes, grouped by module and generated against
`backend/src/main/java/**/controller`. **264 endpoints across 53 controllers.**

Base path: `/api/v1`. Interactive documentation: `/swagger-ui.html` (OpenAPI JSON at
`/v3/api-docs`).

---

## Access model

Authorization is decided by URL prefix in `security/SecurityConfig`, not per method. The
`Access` column below states the effective requirement.

| Prefix | Requirement |
| --- | --- |
| `/auth/**`, `/files/download/**` | none |
| `GET` on `/horses/**`, `/tournaments/**`, `/races/**`, `/blogs/**`, `/standings/**`, `/leaderboard/**`, `/championships/*/standings`, `/racing-summary`, `/wallet/vnpay/**` | none |
| `/admin/**` | `ROLE_ADMIN` |
| `/owner/**` | `ROLE_HORSE_OWNER` |
| `/jockey/**` | `ROLE_JOCKEY` |
| `/referee/**` | `ROLE_REFEREE` |
| `/organizer/**` | `ROLE_ORGANIZER` |
| everything else | authenticated |

Legend: **public** = no token, **auth** = any signed-in account, **role** = the named role.

Suspended and banned accounts are additionally blocked by `AccountStatusEnforcementFilter`,
which returns `403` with `{"code": "ACCOUNT_SUSPENDED" | "ACCOUNT_BANNED"}` on paths that
change business state.

Errors follow `ApiErrorResponse` (`timestamp`, `status`, `error`, `message`, `path`,
`fieldErrors`) — see [Backend Source Guide §3.2](backend-source-guide.md#32-commonerror).

---

## Authentication — `auth/controller/AuthController`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/auth/register` | public |
| POST | `/auth/resend-verification-email` | public |
| POST | `/auth/verify-email` | public |
| POST | `/auth/forgot-password` | public |
| POST | `/auth/verify-reset-code` | public |
| POST | `/auth/reset-password` | public |
| POST | `/auth/login` | public |
| POST | `/auth/oauth/{provider}` | public |
| POST | `/auth/refresh` | refresh cookie |
| POST | `/auth/logout` | refresh cookie |

Rate limited: login, forgot-password and reset-password (`app.security.rate-limit.*`).

---

## Identity and profiles

### `user/controller/MeController`, `UserProfileController`, `OwnerProfileController`, `RefereeProfileController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/me` | auth |
| GET | `/users/me/profile` | auth |
| PUT | `/users/me/profile` | auth |
| GET | `/users/me/owner-profile` | auth |
| PUT | `/users/me/owner-profile` | auth |
| GET | `/users/me/referee-profile` | auth |
| PUT | `/users/me/referee-profile` | auth |

### Role requests — `UserRoleRequestController`, `AdminRoleRequestController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/role-requests/my` | auth |
| POST | `/role-requests` | auth |
| GET | `/admin/role-requests` | admin |
| POST | `/admin/role-requests/{id}/approve` | admin |
| POST | `/admin/role-requests/{id}/pass-cv` | admin |
| POST | `/admin/role-requests/{id}/reject` | admin |

### Admin user management — `AdminUserController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/admin/users` | admin |
| GET | `/admin/users/{id}` | admin |
| GET | `/admin/users/{id}/history` | admin |
| GET | `/admin/users/{id}/status-history` | admin |
| POST | `/admin/users` | admin |
| PUT | `/admin/users/{id}/profile` | admin |
| PUT | `/admin/users/{id}/roles` | admin |
| POST | `/admin/users/{id}/suspend` | admin |
| POST | `/admin/users/{id}/restore` | admin |
| POST | `/admin/users/{id}/ban` | admin |
| POST | `/admin/users/{id}/reopen` | admin |

### Account restriction and appeal — `AccountRestrictionController`, `AccountAppealController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/me/account-restriction` | auth |
| GET | `/me/account-appeal` | auth |
| POST | `/me/account-appeal` | auth |

Reachable while suspended or banned by design.

---

## Organizations — `organization/controller`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/organizations` | auth |
| GET | `/organizations/my` | auth |
| GET | `/admin/organizations` | admin |
| POST | `/admin/organizations/{id}/approve` | admin |
| POST | `/admin/organizations/{id}/reject` | admin |
| POST | `/admin/organizations/{id}/suspend` | admin |
| POST | `/admin/organizations/{id}/reactivate` | admin |

Approval is what grants the `ORGANIZER` role (gate 1 of the three-gate model).

---

## Horses — `horse/controller`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/horses` | public |
| GET | `/horses/{id}` | public |
| GET | `/owner/horses` | owner |
| GET | `/owner/horsespage` | owner |
| GET | `/owner/horses/{id}` | owner |
| POST | `/owner/horses` | owner |
| PUT | `/owner/horses/{id}` | owner |
| GET | `/owner/horses/{id}/documents` | owner |
| POST | `/owner/horses/{id}/documents` | owner |
| GET | `/admin/horses` | admin |
| GET | `/admin/horses/{id}` | admin |
| POST | `/admin/horses` | admin |
| PUT | `/admin/horses/{id}` | admin |
| DELETE | `/admin/horses/{id}` | admin |
| POST | `/admin/horses/{id}/approve` | admin |
| POST | `/admin/horses/{id}/reject` | admin |

---

## Tournaments — `tournament/controller`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/tournaments` | public |
| GET | `/tournaments/search` | public |
| GET | `/tournaments/{id}` | public |
| GET | `/organizer/tournaments` | organizer |
| GET | `/organizer/tournaments/{id}` | organizer |
| POST | `/organizer/tournaments` | organizer |
| PUT | `/organizer/tournaments/{id}` | organizer |
| POST | `/organizer/tournaments/{id}/submit` | organizer |
| PUT | `/organizer/tournaments/{id}/status` | organizer |
| GET | `/admin/tournaments` | admin |
| GET | `/admin/tournaments/{id}` | admin |
| POST | `/admin/tournaments` | admin |
| PUT | `/admin/tournaments/{id}` | admin |
| DELETE | `/admin/tournaments/{id}` | admin |
| PUT | `/admin/tournaments/{id}/status` | admin |
| POST | `/admin/tournaments/{id}/approve` | admin |
| POST | `/admin/tournaments/{id}/reject` | admin |

`submit` then admin `approve` is gate 2 of the three-gate model.

---

## Tournament registrations — `tournamentregistration/controller`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/owner/tournament-registrations` | owner |
| GET | `/owner/tournament-registrationspage` | owner |
| POST | `/owner/tournament-registrations` | owner |
| POST | `/owner/tournament-registrations/{id}/withdraw` | owner |
| GET | `/organizer/tournament-registrations` | organizer |
| POST | `/organizer/tournament-registrations/{id}/approve` | organizer |
| POST | `/organizer/tournament-registrations/{id}/reject` | organizer |
| GET | `/admin/tournament-registrations` | admin |
| POST | `/admin/tournament-registrations/{id}/approve` | admin |
| POST | `/admin/tournament-registrations/{id}/reject` | admin |

---

## Championship staffing — `championship/controller`

### Jockey pool — `JockeyPoolApplicationController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/jockey/championships` | jockey |
| GET | `/jockey/championships/applications` | jockey |
| POST | `/jockey/championships/{championshipId}/pool-applications` | jockey |
| POST | `/jockey/championships/{championshipId}/pool-applications/{applicationId}/withdraw` | jockey |
| GET | `/owner/championships/{championshipId}/jockey-pool` | owner |
| GET | `/admin/championships/{championshipId}/jockey-pool-applications` | admin |
| POST | `/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/approve` | admin |
| POST | `/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/reject` | admin |

### Owner–jockey contracts — `JockeyInvitationContractController`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/owner/championships/{championshipId}/contracts` | owner |
| GET | `/owner/championships/{championshipId}/contracts` | owner |
| GET | `/jockey/contracts` | jockey |
| GET | `/jockey/participants` | jockey |
| POST | `/jockey/contracts/{contractId}/accept` | jockey |
| POST | `/jockey/contracts/{contractId}/reject` | jockey |
| GET | `/admin/championships/{championshipId}/participants` | admin |
| POST | `/admin/championships/{championshipId}/lock-participants` | admin |
| POST | `/admin/championships/{championshipId}/unlock-participants` | admin |

### Organizer participant control — `OrganizerParticipantController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/organizer/tournaments/{tournamentId}/jockey-applications` | organizer |
| POST | `/organizer/tournaments/{tournamentId}/jockey-applications/{applicationId}/approve` | organizer |
| POST | `/organizer/tournaments/{tournamentId}/jockey-applications/{applicationId}/reject` | organizer |
| GET | `/organizer/tournaments/{tournamentId}/participants` | organizer |
| POST | `/organizer/tournaments/{tournamentId}/lock-participants` | organizer |
| POST | `/organizer/tournaments/{tournamentId}/unlock-participants` | organizer |

### Referee contracts — `OrganizerRefereeContractController`, `RefereeContractController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/organizer/referees` | organizer |
| POST | `/organizer/tournaments/{tournamentId}/referee-contracts` | organizer |
| GET | `/organizer/tournaments/{tournamentId}/referee-contracts` | organizer |
| POST | `/organizer/referee-contracts/{contractId}/terminate` | organizer |
| GET | `/referee/contracts` | referee |
| POST | `/referee/contracts/{contractId}/accept` | referee |
| POST | `/referee/contracts/{contractId}/decline` | referee |

### Admin workspace — `AdminChampionshipWorkspaceController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/admin/championships/{id}/workspace` | admin |

---

## Races — `race/controller`

### Public

| Method | Path | Access |
| --- | --- | --- |
| GET | `/races` | public |
| GET | `/races/search` | public |
| GET | `/races/{id}` | public |
| GET | `/races/{id}/results` | public |
| GET | `/racing-summary` | public |

### Organizer

| Method | Path | Access |
| --- | --- | --- |
| GET | `/organizer/races` | organizer |
| GET | `/organizer/races/{id}` | organizer |
| GET | `/organizer/races/{id}/participants` | organizer |
| GET | `/organizer/races/{id}/results` | organizer |
| POST | `/organizer/races` | organizer |
| PUT | `/organizer/races/{id}` | organizer |
| DELETE | `/organizer/races/{id}` | organizer |
| PUT | `/organizer/races/{id}/referee` | organizer |
| GET | `/organizer/races/{id}/review-package` | organizer |
| POST | `/organizer/races/{id}/confirm-results` | organizer |
| POST | `/organizer/races/{id}/reopen-results` | organizer |
| POST | `/organizer/races/{id}/publish-results` | organizer |

`confirm` → `publish` is gate 3 of the three-gate model; `reopen` sends the package back to
the referee.

### Admin

| Method | Path | Access |
| --- | --- | --- |
| GET | `/admin/races` | admin |
| GET | `/admin/races/{id}` | admin |
| GET | `/admin/races/{id}/participants` | admin |
| POST | `/admin/races` | admin |
| PUT | `/admin/races/{id}` | admin |
| DELETE | `/admin/races/{id}` | admin |
| PUT | `/admin/races/{id}/status` | admin |
| PUT | `/admin/races/{id}/referee` | admin |

### Jockey

| Method | Path | Access |
| --- | --- | --- |
| GET | `/jockey/schedule` | jockey |

---

## Race media — `race/media/controller`

Highlights and live streams are validated against the provider server-side before they can
be published.

### Public — `PublicRaceMediaController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/races/{raceId}/highlight` | public |
| GET | `/races/{raceId}/live-stream` | public |
| GET | `/races/highlights?tournamentId=` | public |
| GET | `/races/highlights?raceIds=` | public (batched; capped per request) |

### Organizer and admin

Both prefixes expose the identical surface — replace `{scope}` with `organizer` or `admin`:

| Method | Path | Access |
| --- | --- | --- |
| GET | `/{scope}/races/{raceId}/media` | scope role |
| POST | `/{scope}/races/{raceId}/media/validate` | scope role |
| PUT | `/{scope}/races/{raceId}/media` | scope role |
| POST | `/{scope}/races/{raceId}/media/publish` | scope role |
| POST | `/{scope}/races/{raceId}/media/unpublish` | scope role |
| POST | `/{scope}/races/{raceId}/media/reverify` | scope role |
| DELETE | `/{scope}/races/{raceId}/media` | scope role |
| GET | `/{scope}/races/{raceId}/live-stream` | scope role |
| POST | `/{scope}/races/{raceId}/live-stream/validate` | scope role |
| PUT | `/{scope}/races/{raceId}/live-stream` | scope role |
| POST | `/{scope}/races/{raceId}/live-stream/publish` | scope role |
| POST | `/{scope}/races/{raceId}/live-stream/unpublish` | scope role |
| POST | `/{scope}/races/{raceId}/live-stream/reverify` | scope role |
| DELETE | `/{scope}/races/{raceId}/live-stream` | scope role |

---

## Referee race day — `referee/controller/RefereeController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/referee/races` | referee |
| GET | `/referee/races/{raceId}` | referee |
| GET | `/referee/races/{raceId}/participants` | referee |
| POST | `/referee/races/{raceId}/pre-checks` | referee |
| POST | `/referee/races/{raceId}/check` | referee |
| POST | `/referee/races/{raceId}/start` | referee |
| POST | `/referee/races/{raceId}/finish` | referee |
| GET | `/referee/races/{raceId}/result-entries` | referee |
| POST | `/referee/races/{raceId}/results` | referee (legacy submission path) |
| POST | `/referee/races/{raceId}/results/submit` | referee |
| POST | `/referee/races/{raceId}/incidents` | referee |
| POST | `/referee/races/{raceId}/violations` | referee |
| POST | `/referee/races/{raceId}/reports` | referee |
| POST | `/referee/races/{raceId}/next-step` | referee (drives the state machine) |

---

## Predictions — `prediction/controller`

### Spectator — `SpectatorPredictionController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/races/open-for-prediction` | public |
| GET | `/races/{raceId}/prediction-options` | public |
| POST | `/predictions/quote` | auth |
| POST | `/predictions` | auth (rate limited) |
| GET | `/predictions/my` | auth |
| PUT | `/predictions/{id}` | auth — always returns `405`; a placed wager is immutable |
| POST | `/streak` | auth |
| GET | `/streak` | auth |
| GET | `/point-accounts/me` | auth — compatibility shim returning the wallet balance |

The two `GET /races/...` prediction endpoints are public because they sit under the
public-read `/races/**` prefix; placing a wager is not.

### Admin — `AdminPredictionController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/admin/predictions/races` | admin |
| GET | `/admin/predictions/races/{raceId}` | admin |
| GET | `/admin/predictions/races/{raceId}/predictions` | admin |
| GET | `/admin/predictions/streaks` | admin |
| POST | `/admin/predictions/settlement-jobs/{jobId}/retry` | admin |
| GET | `/admin/predictions/settings` | admin |
| PUT | `/admin/predictions/settings` | admin |

---

## Wallet — `wallet/controller`

### Balance and ledger — `WalletController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/wallet/me` | auth |
| GET | `/wallet/me/summary` | auth |
| GET | `/wallet/me/transactions` | auth |
| GET | `/wallet/me/transactions/{id}` | auth |

### Top-up — `TopUpController`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/wallet/topup` | auth |
| GET | `/wallet/vnpay/return` | public — browser redirect back from VNPay |
| GET | `/wallet/vnpay/ipn` | public — server-to-server callback |
| GET | `/wallet/topups/{txnRef}/receipt` | auth |

The VNPay callbacks are unauthenticated by necessity: VNPay calls them directly. The HMAC
signature check is the authentication, and both paths run the same idempotent handler
(verify signature → match amount → reject terminal orders → credit keyed on order id).

### Withdrawal — `WithdrawalController`, `BankAccountController`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/wallet/withdrawals` | auth |
| GET | `/wallet/withdrawals` | auth |
| POST | `/wallet/withdrawals/{id}/cancel` | auth |
| GET | `/wallet/bank-accounts` | auth |
| POST | `/wallet/bank-accounts` | auth |
| DELETE | `/wallet/bank-accounts/{id}` | auth |
| GET | `/wallet/bank-accounts/directory` | auth |

### Admin withdrawal review — `AdminWithdrawalController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/admin/withdrawals` | admin |
| GET | `/admin/withdrawals/summary` | admin |
| GET | `/admin/withdrawals/{id}` | admin |
| POST | `/admin/withdrawals/{id}/approve` | admin |
| POST | `/admin/withdrawals/{id}/reject` | admin |
| POST | `/admin/withdrawals/{id}/mark-paid` | admin |
| GET | `/admin/withdrawals/export/preview` | admin |
| GET | `/admin/withdrawals/export` | admin |

### Admin wallet enforcement — `AdminWalletEnforcementController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/admin/users/{userId}/wallet-control` | admin |
| GET | `/admin/users/{userId}/wallet-transactions` | admin |
| GET | `/admin/users/{userId}/wallet-status-history` | admin |
| POST | `/admin/users/{userId}/wallet/credit` | admin |
| POST | `/admin/users/{userId}/wallet/lock` | admin |
| POST | `/admin/users/{userId}/wallet/unlock` | admin |

---

## Finance reporting — `finance/controller/AdminFinanceController`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/admin/finance/summary` | admin |
| GET | `/admin/finance/reconciliation-summary` | admin |
| GET | `/admin/finance/transactions` | admin |
| GET | `/admin/finance/transactions/{id}` | admin |
| GET | `/admin/finance/transactions/export` | admin |
| GET | `/admin/finance/topups` | admin |
| GET | `/admin/finance/topups/orphan-credits` | admin |

`orphan-credits` lists top-ups credited without a matching order — the signal that a callback
was mishandled.

---

## Disputes — `dispute/controller`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/spectator/disputes` | auth |
| GET | `/spectator/disputes` | auth |
| GET | `/admin/disputes` | admin |
| PUT | `/admin/disputes/{id}/status` | admin |

---

## Content, standings and notifications

### Blogs — `blog/controller`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/blogs` | public |
| GET | `/blogs/{slug}` | public |
| GET | `/admin/blogs` | admin |
| POST | `/admin/blogs` | admin |
| PUT | `/admin/blogs/{id}` | admin |
| PATCH | `/admin/blogs/{id}/status` | admin |
| DELETE | `/admin/blogs/{id}` | admin |

### Leaderboard — `leaderboard/controller`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/standings` | public |
| GET | `/championships/{championshipId}/standings` | public |
| GET | `/leaderboard/spectators` | public |

### Notifications — `notification/controller`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/notifications` | auth |
| GET | `/notifications/unread-count` | auth |
| POST | `/notifications/{id}/read` | auth |
| POST | `/notifications/read-all` | auth |

### Admin dashboard — `dashboard/controller`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/admin/dashboard` | admin |

---

## File storage — `filestorage/FileStorageController`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/files/upload` | auth (rate limited) |
| GET | `/files/download/{filename}` | public |
| GET | `/files/private/{filename}` | auth, ownership checked by `FileAccessAuthorizationService` |

---

## Operations

| Method | Path | Access |
| --- | --- | --- |
| GET | `/actuator/health` | public — liveness/readiness probes, `show-details: never` |
| GET | `/v3/api-docs` | public |
| GET | `/swagger-ui.html` | public |

---

## Regenerating this document

The tables were derived from the controller annotations. To re-check the inventory after
adding endpoints, list the mappings straight from source:

```bash
grep -rn "@\(Get\|Post\|Put\|Patch\|Delete\)Mapping" backend/src/main/java --include="*Controller.java"
```
