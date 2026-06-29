# API And UI Contract

All active backend endpoints use the `/api/v1` prefix.

## 1. Public And Auth APIs

| Area | Endpoints | Frontend |
| --- | --- | --- |
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/resend-verification-email`, `POST /api/v1/auth/verify-email`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, forgot/reset password endpoints | `/login`, `/register`, `/verify-email`, `/forgot-password` |
| Public blogs | `GET /api/v1/blogs`, `GET /api/v1/blogs/{slug}` | `/blogs`, `/blogs/:slug` |
| Public horses | `GET /api/v1/horses`, `GET /api/v1/horses/{id}` | Admin/owner supporting views |
| Public tournaments | `GET /api/v1/tournaments`, `GET /api/v1/tournaments/search`, `GET /api/v1/tournaments/{id}` | `/championships`, `/championships/:id` |
| Public races | `GET /api/v1/races`, `GET /api/v1/races/search`, `GET /api/v1/races/{id}`, `GET /api/v1/races/{id}/results`, `GET /api/v1/racing-summary` | `/races`, `/races/:id` |
| Leaderboard | `GET /api/v1/leaderboard/**` | `/leaderboard` |

## 2. User APIs

| Area | Endpoints | Frontend |
| --- | --- | --- |
| Current user | `GET /api/v1/me` | session/workspace routing |
| Profile | `GET /api/v1/users/me/profile`, `PUT /api/v1/users/me/profile` | `/profile` |
| Owner profile | `GET /api/v1/users/me/owner-profile`, `PUT /api/v1/users/me/owner-profile` | `/owner/profile` |
| Referee profile | `GET /api/v1/users/me/referee-profile`, `PUT /api/v1/users/me/referee-profile` | `/referee/profile` |
| Role requests | `GET /api/v1/role-requests/my`, `POST /api/v1/role-requests` | `/my-role-requests` |
| Organizations | `POST /api/v1/organizations`, `GET /api/v1/organizations/my` | `/organizer/register`, `/organizer/organization` |

## 3. Wallet APIs

| Area | Endpoints | Frontend |
| --- | --- | --- |
| Wallet | `GET /api/v1/wallet/me`, `GET /api/v1/wallet/me/summary`, `GET /api/v1/wallet/me/transactions` | `/wallet`, header balance |
| Top-up | `POST /api/v1/wallet/topup`, `GET /api/v1/wallet/vnpay/ipn`, `GET /api/v1/wallet/vnpay/return` | `/wallet` |
| Withdrawals | `POST /api/v1/wallet/withdrawals`, `GET /api/v1/wallet/withdrawals`, `POST /api/v1/wallet/withdrawals/{id}/cancel` | `/wallet` |
| Bank accounts | `GET /api/v1/wallet/bank-accounts`, `POST /api/v1/wallet/bank-accounts`, `DELETE /api/v1/wallet/bank-accounts/{id}` | `/wallet` |
| Compatibility | `GET /api/v1/point-accounts/me` | legacy prediction balance contract |

## 4. Owner And Jockey APIs

| Area | Endpoints | Frontend |
| --- | --- | --- |
| Owner horses | `GET /api/v1/owner/horses`, `GET /api/v1/owner/horses/{id}`, `POST /api/v1/owner/horses`, `GET /api/v1/owner/horses/{id}/documents`, `POST /api/v1/owner/horses/{id}/documents` | `/owner/horses`, `/owner/horses/:horseId` |
| Owner registrations | `GET /api/v1/owner/tournament-registrations`, `POST /api/v1/owner/tournament-registrations`, `POST /api/v1/owner/tournament-registrations/{id}/withdraw` | `/owner/registrations` |
| Jockey championships | `GET /api/v1/jockey/championships`, `GET /api/v1/jockey/championships/applications`, `POST /api/v1/jockey/championships/{championshipId}/pool-applications`, `POST /api/v1/jockey/championships/{championshipId}/pool-applications/{applicationId}/withdraw` | `/jockey/championships` |
| Contracts | `POST /api/v1/owner/championships/{championshipId}/contracts`, `GET /api/v1/owner/championships/{championshipId}/contracts`, `GET /api/v1/jockey/contracts`, `POST /api/v1/jockey/contracts/{contractId}/accept`, `POST /api/v1/jockey/contracts/{contractId}/reject` | `/jockey/contracts`, owner registration flow |
| Jockey schedule | `GET /api/v1/jockey/schedule` | `/jockey/schedule` |

## 5. Organizer APIs

Base paths: `/api/v1/organizer/tournaments`, `/api/v1/organizer/tournaments/{tournamentId}`, `/api/v1/organizer/races`, `/api/v1/organizer`.

Representative endpoints:

- `GET /api/v1/organizer/tournaments`
- `POST /api/v1/organizer/tournaments`
- `POST /api/v1/organizer/tournaments/{id}/submit`
- `PUT /api/v1/organizer/tournaments/{id}/status`
- `GET /api/v1/organizer/tournaments/{tournamentId}/jockey-applications`
- `POST /api/v1/organizer/tournaments/{tournamentId}/jockey-applications/{applicationId}/approve`
- `POST /api/v1/organizer/tournaments/{tournamentId}/jockey-applications/{applicationId}/reject`
- `GET /api/v1/organizer/tournaments/{tournamentId}/participants`
- `POST /api/v1/organizer/tournaments/{tournamentId}/lock-participants`
- `GET /api/v1/organizer/referees`
- `POST /api/v1/organizer/tournaments/{tournamentId}/referee-contracts`
- `GET /api/v1/organizer/tournaments/{tournamentId}/referee-contracts`
- `POST /api/v1/organizer/referee-contracts/{contractId}/terminate`
- `GET /api/v1/organizer/races`
- `POST /api/v1/organizer/races`
- `PUT /api/v1/organizer/races/{id}`
- `PUT /api/v1/organizer/races/{id}/referee`
- `POST /api/v1/organizer/races/{id}/confirm-results`
- `POST /api/v1/organizer/races/{id}/reopen-results`
- `POST /api/v1/organizer/races/{id}/publish-results`

Frontend: `/organizer/*`.

## 6. Referee APIs

Base paths: `/api/v1/referee` and `/api/v1/referee/contracts`.

- `GET /api/v1/referee/contracts`
- `POST /api/v1/referee/contracts/{contractId}/accept`
- `POST /api/v1/referee/contracts/{contractId}/decline`
- `GET /api/v1/referee/races`
- `GET /api/v1/referee/races/{raceId}`
- `GET /api/v1/referee/races/{raceId}/participants`
- `POST /api/v1/referee/races/{raceId}/pre-checks`
- `POST /api/v1/referee/races/{raceId}/check`
- `POST /api/v1/referee/races/{raceId}/start`
- `POST /api/v1/referee/races/{raceId}/finish`
- `GET /api/v1/referee/races/{raceId}/result-entries`
- `POST /api/v1/referee/races/{raceId}/results`
- `POST /api/v1/referee/races/{raceId}/results/submit`
- `POST /api/v1/referee/races/{raceId}/incidents`
- `POST /api/v1/referee/races/{raceId}/violations`
- `POST /api/v1/referee/races/{raceId}/reports`
- `POST /api/v1/referee/races/{raceId}/next-step`

Frontend: `/referee/*`.

## 7. Spectator Prediction APIs

- `GET /api/v1/races/open-for-prediction`
- `GET /api/v1/races/{raceId}/prediction-options`
- `POST /api/v1/predictions`
- `POST /api/v1/predictions/quote`
- `PUT /api/v1/predictions/{id}` returns method-not-allowed behavior; edit is disabled.
- `GET /api/v1/predictions/my`
- `POST /api/v1/streak`
- `GET /api/v1/streak`
- `GET /api/v1/point-accounts/me` compatibility balance endpoint.

Frontend: `/spectator/predictions`.

## 8. Admin APIs

| Area | Endpoints |
| --- | --- |
| Users | `GET /api/v1/admin/users`, `POST /api/v1/admin/users`, `GET /api/v1/admin/users/{id}`, `GET /api/v1/admin/users/{id}/history`, `PUT /api/v1/admin/users/{id}/profile`, `PUT /api/v1/admin/users/{id}/roles`, `DELETE /api/v1/admin/users/{id}` |
| Role requests | `GET /api/v1/admin/role-requests`, `POST /api/v1/admin/role-requests/{id}/approve`, `POST /api/v1/admin/role-requests/{id}/pass-cv`, `POST /api/v1/admin/role-requests/{id}/reject` |
| Organizations | `GET /api/v1/admin/organizations`, `POST /api/v1/admin/organizations/{id}/approve`, `POST /api/v1/admin/organizations/{id}/reject`, `POST /api/v1/admin/organizations/{id}/suspend`, `POST /api/v1/admin/organizations/{id}/reactivate` |
| Withdrawals | `GET /api/v1/admin/withdrawals`, `POST /api/v1/admin/withdrawals/{id}/approve`, `POST /api/v1/admin/withdrawals/{id}/reject`, `POST /api/v1/admin/withdrawals/{id}/mark-paid` |
| Horses | `GET /api/v1/admin/horses`, `POST /api/v1/admin/horses`, `GET /api/v1/admin/horses/{id}`, `PUT /api/v1/admin/horses/{id}`, `DELETE /api/v1/admin/horses/{id}`, `POST /api/v1/admin/horses/{id}/approve`, `POST /api/v1/admin/horses/{id}/reject` |
| Tournaments | `GET /api/v1/admin/tournaments`, `POST /api/v1/admin/tournaments`, `GET /api/v1/admin/tournaments/{id}`, `PUT /api/v1/admin/tournaments/{id}`, `DELETE /api/v1/admin/tournaments/{id}`, `PUT /api/v1/admin/tournaments/{id}/status`, `POST /api/v1/admin/tournaments/{id}/approve`, `POST /api/v1/admin/tournaments/{id}/reject` |
| Tournament registrations | `GET /api/v1/admin/tournament-registrations`, `POST /api/v1/admin/tournament-registrations/{id}/approve`, `POST /api/v1/admin/tournament-registrations/{id}/reject` |
| Races | `GET /api/v1/admin/races`, `POST /api/v1/admin/races`, `GET /api/v1/admin/races/{id}`, `PUT /api/v1/admin/races/{id}`, `DELETE /api/v1/admin/races/{id}`, `GET /api/v1/admin/races/{id}/participants`, `PUT /api/v1/admin/races/{id}/status`, `PUT /api/v1/admin/races/{id}/referee` |
| Blogs | `GET /api/v1/admin/blogs`, `POST /api/v1/admin/blogs`, `PUT /api/v1/admin/blogs/{id}`, `PATCH /api/v1/admin/blogs/{id}/status`, `DELETE /api/v1/admin/blogs/{id}` |
| Predictions | `GET /api/v1/admin/predictions/races`, `GET /api/v1/admin/predictions/races/{raceId}`, `GET /api/v1/admin/predictions/races/{raceId}/predictions`, `POST /api/v1/admin/predictions/settlement-jobs/{jobId}/retry` |
| Championships | `GET /api/v1/admin/championships/{id}/workspace`, `GET /api/v1/admin/championships/{championshipId}/jockey-pool-applications`, `POST /api/v1/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/approve`, `POST /api/v1/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/reject`, `POST /api/v1/admin/championships/{championshipId}/lock-participants`, `GET /api/v1/admin/championships/{championshipId}/participants` |

## 9. File APIs

- `POST /api/v1/files/upload`
- `GET /api/v1/files/download/{filename}`
- `GET /api/v1/files/private/{filename}`

Horse-specific uploads also exist under owner horse APIs using multipart requests.
