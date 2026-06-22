# API And UI Contract

All active backend endpoints use the `/api/v1` prefix.

## 1. Public And Auth APIs

| Area | Endpoints | Frontend |
| --- | --- | --- |
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/resend-verification-email`, `POST /api/v1/auth/verify-email`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` | `/login`, `/register`, `/verify-email` |
| Public blogs | `GET /api/v1/blogs`, `GET /api/v1/blogs/{slug}` | `/blogs`, `/blogs/:slug` |
| Public horses | `GET /api/v1/horses`, `GET /api/v1/horses/{id}` | Admin/owner supporting views |
| Public tournaments | `GET /api/v1/tournaments`, `GET /api/v1/tournaments/{id}` | Tournament selection views |
| Public races | `GET /api/v1/races`, `GET /api/v1/races/{id}` | Race/prediction supporting views |

## 2. User APIs

| Area | Endpoints | Frontend |
| --- | --- | --- |
| Current user | `GET /api/v1/me` | session/workspace routing |
| Profile | `GET /api/v1/users/me/profile`, `PUT /api/v1/users/me/profile` | `/profile` |
| Owner profile | `GET /api/v1/users/me/owner-profile`, `PUT /api/v1/users/me/owner-profile` | `/owner/profile` |
| Referee profile | `GET /api/v1/users/me/referee-profile`, `PUT /api/v1/users/me/referee-profile` | `/referee/profile` |
| Role requests | `GET /api/v1/role-requests/my`, `POST /api/v1/role-requests` | `/my-role-requests` |

## 3. Owner And Jockey APIs

| Area | Endpoints | Frontend |
| --- | --- | --- |
| Owner horses | `GET /api/v1/owner/horses`, `GET /api/v1/owner/horses/{id}`, `POST /api/v1/owner/horses`, `GET /api/v1/owner/horses/{id}/documents`, `POST /api/v1/owner/horses/{id}/documents` | `/owner/horses`, `/owner/horses/:horseId` |
| Owner registrations | `GET /api/v1/owner/tournament-registrations`, `POST /api/v1/owner/tournament-registrations`, `POST /api/v1/owner/tournament-registrations/{id}/withdraw` | `/owner/registrations` |
| Jockey championships | `GET /api/v1/jockey/championships`, `GET /api/v1/jockey/championships/applications`, `POST /api/v1/jockey/championships/{championshipId}/pool-applications`, `POST /api/v1/jockey/championships/{championshipId}/pool-applications/{applicationId}/withdraw` | `/jockey/championships` |
| Contracts | `POST /api/v1/owner/championships/{championshipId}/contracts`, `GET /api/v1/owner/championships/{championshipId}/contracts`, `GET /api/v1/jockey/contracts`, `POST /api/v1/jockey/contracts/{contractId}/accept`, `POST /api/v1/jockey/contracts/{contractId}/reject` | `/jockey/contracts`, owner registration flow |
| Jockey schedule | `GET /api/v1/jockey/schedule` | `/jockey/schedule` |

## 4. Referee APIs

Base path: `/api/v1/referee`

- `GET /races`
- `GET /races/{raceId}`
- `GET /races/{raceId}/participants`
- `POST /races/{raceId}/pre-checks`
- `POST /races/{raceId}/check`
- `POST /races/{raceId}/start`
- `POST /races/{raceId}/finish`
- `GET /races/{raceId}/result-entries`
- `POST /races/{raceId}/results`
- `POST /races/{raceId}/results/submit`
- `POST /races/{raceId}/incidents`
- `POST /races/{raceId}/violations`
- `POST /races/{raceId}/reports`
- `POST /races/{raceId}/next-step`

Frontend: `/referee/*`.

## 5. Spectator Prediction APIs

- `GET /api/v1/races/open-for-prediction`
- `GET /api/v1/races/{raceId}/prediction-options`
- `POST /api/v1/predictions`
- `PUT /api/v1/predictions/{id}`
- `GET /api/v1/predictions/my`
- `GET /api/v1/point-accounts/me`

Frontend: `/spectator/predictions`.

## 6. Admin APIs

| Area | Endpoints |
| --- | --- |
| Users | `GET /api/v1/admin/users`, `POST /api/v1/admin/users`, `GET /api/v1/admin/users/{id}`, `GET /api/v1/admin/users/{id}/history`, `PUT /api/v1/admin/users/{id}/profile`, `PUT /api/v1/admin/users/{id}/roles`, `DELETE /api/v1/admin/users/{id}` |
| Role requests | `GET /api/v1/admin/role-requests`, `POST /api/v1/admin/role-requests/{id}/approve`, `POST /api/v1/admin/role-requests/{id}/pass-cv`, `POST /api/v1/admin/role-requests/{id}/reject` |
| Horses | `GET /api/v1/admin/horses`, `POST /api/v1/admin/horses`, `GET /api/v1/admin/horses/{id}`, `PUT /api/v1/admin/horses/{id}`, `DELETE /api/v1/admin/horses/{id}`, `POST /api/v1/admin/horses/{id}/approve`, `POST /api/v1/admin/horses/{id}/reject` |
| Tournaments | `GET /api/v1/admin/tournaments`, `POST /api/v1/admin/tournaments`, `GET /api/v1/admin/tournaments/{id}`, `PUT /api/v1/admin/tournaments/{id}`, `DELETE /api/v1/admin/tournaments/{id}`, `PUT /api/v1/admin/tournaments/{id}/status` |
| Tournament registrations | `GET /api/v1/admin/tournament-registrations`, `POST /api/v1/admin/tournament-registrations/{id}/approve`, `POST /api/v1/admin/tournament-registrations/{id}/reject` |
| Races | `GET /api/v1/admin/races`, `POST /api/v1/admin/races`, `GET /api/v1/admin/races/{id}`, `PUT /api/v1/admin/races/{id}`, `DELETE /api/v1/admin/races/{id}`, `GET /api/v1/admin/races/{id}/participants`, `PUT /api/v1/admin/races/{id}/status`, `PUT /api/v1/admin/races/{id}/referee` |
| Blogs | `GET /api/v1/admin/blogs`, `POST /api/v1/admin/blogs`, `PUT /api/v1/admin/blogs/{id}`, `PATCH /api/v1/admin/blogs/{id}/status`, `DELETE /api/v1/admin/blogs/{id}` |
| Points | `GET /api/v1/admin/point-settings`, `PUT /api/v1/admin/point-settings` |
| Predictions | `GET /api/v1/admin/predictions/races`, `GET /api/v1/admin/predictions/races/{raceId}`, `GET /api/v1/admin/predictions/races/{raceId}/predictions`, `POST /api/v1/admin/predictions/settlement-jobs/{jobId}/retry` |
| Championships | `GET /api/v1/admin/championships/{id}/workspace`, `GET /api/v1/admin/championships/{championshipId}/jockey-pool-applications`, `POST /api/v1/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/approve`, `POST /api/v1/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/reject`, `POST /api/v1/admin/championships/{championshipId}/lock-participants`, `GET /api/v1/admin/championships/{championshipId}/participants` |

## 7. File APIs

- `POST /api/v1/files/upload`
- `GET /api/v1/files/download/{filename}`
- `GET /api/v1/files/private/{filename}`

Horse-specific uploads also exist under owner horse APIs using multipart requests.
