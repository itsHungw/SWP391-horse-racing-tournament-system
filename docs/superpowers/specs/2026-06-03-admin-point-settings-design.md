# Admin Point Settings Design

## Purpose

Create a database-backed Point Settings module so the point economy is configurable by admins instead of being hard-coded in backend or frontend code.

This design covers only settings management:

- New users start with `0` points by default.
- Admin can view and update point rule values from `/admin/points`.
- Backend exposes admin-only APIs for settings.
- All values must be integers greater than or equal to `0`.

This design does not implement blog reward claiming, point transactions, prediction entry, or prediction result settlement.

## Required Settings

| Key | Default | Meaning |
| --- | ---: | --- |
| `FIRST_LOGIN_BONUS` | `0` | Points awarded by a future first-login bonus flow. Initial user balance remains `0`. |
| `BLOG_REWARD_POINTS` | `0` | Points a spectator can earn from a future blog-read reward flow. |
| `DAILY_BLOG_REWARD_LIMIT` | `0` | Maximum number of blog-read rewards a spectator can claim per day in a future flow. |
| `PREDICTION_ENTRY_COST` | `0` | Points a spectator must spend to enter a future race prediction. |
| `PREDICTION_CORRECT_REWARD` | `0` | Points a spectator receives for a future correct prediction. |

## Current Project Context

The project is split into:

- Backend: Spring Boot under `backend/src/main/java/com/example/horseracingtournamentsystem`.
- Backend schema seed file: `backend/src/main/resources/schema.sql`.
- Frontend: React/Vite under `frontend/src`.
- Existing admin routes are defined in `frontend/src/AppRouter.tsx`.
- Existing admin pages live under `frontend/src/pages/admin`.
- Existing frontend API modules live under `frontend/src/api`.

The current code has blog management and admin UI patterns, but no complete runtime point-settings package yet. Point settings should be introduced as a standalone module first, then future blog and prediction features can depend on it.

## Database Design

Add a `point_settings` table.

Recommended schema:

```sql
CREATE TABLE IF NOT EXISTS point_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value INT NOT NULL DEFAULT 0 CHECK (setting_value >= 0),
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT,
  CONSTRAINT fk_point_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
);
```

Seed the five required rows with `0` values.

Use idempotent seed statements so rerunning schema initialization does not duplicate rows or overwrite admin changes unexpectedly. On SQL Server style scripts, use `IF NOT EXISTS (...) INSERT ...`.

## Backend Design

Create package:

```text
backend/src/main/java/com/example/horseracingtournamentsystem/point
```

Recommended files:

- `PointSettingKey.java`: enum containing the five supported keys.
- `PointSetting.java`: JPA entity mapped to `point_settings`.
- `PointSettingRepository.java`: Spring Data repository.
- `PointSettingResponse.java`: response DTO for admin reads.
- `UpdatePointSettingsRequest.java`: request DTO for admin updates.
- `PointSettingsService.java`: business logic for reading and updating settings.
- `AdminPointSettingsController.java`: admin REST API.

Service responsibilities:

- Return all five settings in a stable order.
- Ensure missing rows are created with default value `0`.
- Validate every submitted value is `>= 0`.
- Reject unsupported keys if the request shape allows dynamic keys.
- Expose a reusable method for future modules:

```java
int getInt(PointSettingKey key);
```

Controller responsibilities:

- Restrict access to admins.
- Provide `GET /api/v1/admin/point-settings`.
- Provide `PUT /api/v1/admin/point-settings`.
- Return validation errors for negative values.

## API Design

### GET `/api/v1/admin/point-settings`

Returns all settings.

```json
{
  "FIRST_LOGIN_BONUS": 0,
  "BLOG_REWARD_POINTS": 0,
  "DAILY_BLOG_REWARD_LIMIT": 0,
  "PREDICTION_ENTRY_COST": 0,
  "PREDICTION_CORRECT_REWARD": 0
}
```

### PUT `/api/v1/admin/point-settings`

Updates all settings.

```json
{
  "FIRST_LOGIN_BONUS": 0,
  "BLOG_REWARD_POINTS": 10,
  "DAILY_BLOG_REWARD_LIMIT": 3,
  "PREDICTION_ENTRY_COST": 5,
  "PREDICTION_CORRECT_REWARD": 25
}
```

Response should return the saved settings in the same shape as GET.

Negative values must return `400 Bad Request`.

Non-admin users must receive `403 Forbidden`.

## Frontend Design

Add a dedicated admin page at:

```text
/admin/points
```

Recommended files:

- `frontend/src/types/pointSettings.ts`
- `frontend/src/api/pointSettingsApi.ts`
- `frontend/src/pages/admin/AdminPointSettingsPage.tsx`
- `frontend/src/pages/admin/AdminPointSettingsPage.test.tsx`

Page behavior:

- Load settings on mount.
- Show five number inputs with `min="0"`.
- Save all values through the PUT API.
- Disable save while loading/saving.
- Show a validation message before submit if any value is negative.
- Show success status after save.
- Show API error status if load or save fails.
- Keep layout consistent with existing admin pages.

Labels should be human-readable:

- First login bonus
- Blog reward points
- Daily blog reward limit
- Prediction entry cost
- Prediction correct reward

## Future Integration Rules

When later implementing blog rewards:

- Use `BLOG_REWARD_POINTS` from `PointSettingsService`.
- Use `DAILY_BLOG_REWARD_LIMIT` from `PointSettingsService`.
- If either value is `0`, the reward flow should not grant positive points.

When later implementing predictions:

- Use `PREDICTION_ENTRY_COST` from `PointSettingsService`.
- Use `PREDICTION_CORRECT_REWARD` from `PointSettingsService`.
- Do not hard-code point cost or reward values.

When later implementing first-login bonus:

- Keep user point balance default at `0`.
- Award `FIRST_LOGIN_BONUS` through an explicit transaction/reward flow, not through the user entity default.

## Testing Strategy

Backend tests:

- Admin GET returns all five defaults as `0`.
- Admin PUT persists updated values.
- Negative values are rejected with `400`.
- Non-admin access is rejected with `403`.
- Missing setting rows are recreated with default `0` if the service is asked to read them.

Frontend tests:

- Admin page fetches and renders the five settings.
- User can edit values and save.
- Negative input blocks submit and shows a validation message.
- API failure renders an error alert.
- `/admin/points` route renders the real settings page, not a placeholder.

## Open Decision

For future reward flows, `BLOG_REWARD_POINTS = 0` should mean no positive reward is granted. The implementation can either skip creating a zero-value transaction or record an audit entry with value `0`; that decision belongs to the later point transaction feature, not this settings module.
