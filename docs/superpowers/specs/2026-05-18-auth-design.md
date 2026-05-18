# Authentication and Authorization Design

## 1. Scope

This document defines the phase-1 authentication and authorization design for the Horse Racing Tournament Management System.

Included:

- email and password registration,
- email verification,
- login and logout,
- JWT access tokens,
- refresh tokens in HttpOnly cookies,
- refresh-token rotation,
- password reset,
- role-based access control using existing role tables.

Excluded from phase 1:

- social login,
- MFA,
- database-driven fine-grained permissions,
- full login-history analytics,
- suspicious-activity detection.

## 2. Design Goals

- Keep the auth layer realistic enough for a production-style web app.
- Fit the existing domain model: users begin as spectators and may later gain extra roles through admin approval.
- Separate identity, session management, and authorization clearly.
- Preserve the current schema direction rather than introducing a parallel user model.

## 3. Recommended Approach

Use JWT access tokens with a server-managed refresh-session registry.

### Why this approach

- JWT access tokens suit the current split frontend/backend architecture.
- HttpOnly-cookie refresh tokens reduce exposure to frontend JavaScript.
- A refresh-session table enables logout, revocation, token rotation, and device-aware session control without overbuilding the identity system.

## 4. Core Architecture

```text
User
 |- identity: users
 |- authorization: roles + user_roles
 `- role elevation: role_requests

Auth module
 |- register / verify email
 |- login / logout
 |- issue access JWT
 |- manage refresh sessions
 `- password reset
```

The system treats these concerns separately:

- **Identity**: which user is making the request.
- **Session**: which authenticated login instance is active.
- **Authorization**: what the user is currently allowed to do.

## 5. User Lifecycle

### 5.1 Registration

1. A guest registers with email and password.
2. The system creates a `users` record with:
   - `status = PENDING_EMAIL_VERIFY`
   - `email_verified = 0`
3. The system assigns the `SPECTATOR` role.
4. The system creates an email verification token.
5. After successful verification:
   - `email_verified = 1`
   - `status = ACTIVE`

### 5.2 Login

Login is allowed only when:

- the email/password pair is valid,
- the account is `ACTIVE`,
- the email is verified.

On successful login:

- issue a short-lived JWT access token,
- set a long-lived refresh token in an HttpOnly cookie,
- create an active auth session,
- update `last_login_at`.

### 5.3 Refresh

1. The backend reads the refresh token from the HttpOnly cookie.
2. It validates the matching auth session.
3. It rotates the refresh token:
   - revoke the old session,
   - create a replacement session,
   - issue a new refresh token cookie,
   - issue a new access token.

### 5.4 Logout

- Revoke the current auth session.
- Clear the refresh-token cookie.

### 5.5 Forgot Password / Reset Password

1. A user requests password reset by email.
2. The system creates a password-reset token.
3. After a valid reset:
   - update the password hash,
   - set `password_changed_at`,
   - revoke all active auth sessions for that user.

## 6. Authorization Model

### 6.1 Roles

Phase 1 uses role-based access control with the existing roles:

- `ADMIN`
- `SPECTATOR`
- `HORSE_OWNER`
- `JOCKEY`
- `REFEREE`

### 6.2 Role Assignment Rules

- Every newly registered user receives `SPECTATOR`.
- `HORSE_OWNER`, `JOCKEY`, and `REFEREE` are gained only through the existing admin-approved role-request flow.
- `ADMIN` is seeded or manually assigned; it is not requested through the public role-request flow.
- A user may hold multiple roles at once.
- Only roles with `user_roles.status = ACTIVE` grant access.

### 6.3 Runtime Authorization Principle

The access token identifies the user, but the backend remains the authority for current permissions.

This means:

- suspended or removed roles stop granting access immediately,
- locked or disabled users are blocked by the auth layer,
- the system does not rely on stale token claims as the only source of authorization truth.

## 7. Data Model Changes

### 7.1 Add `auth_sessions`

Purpose: track refresh-token-backed login sessions.

Suggested fields:

- `id`
- `user_id`
- `refresh_token_hash`
- `user_agent`
- `ip_address`
- `expires_at`
- `revoked_at`
- `replaced_by_session_id`
- `created_at`
- `last_used_at`

### 7.2 Add `email_verification_tokens`

Suggested fields:

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `used_at`
- `created_at`

### 7.3 Add `password_reset_tokens`

Suggested fields:

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `used_at`
- `created_at`

### 7.4 Extend `users`

Add:

- `password_changed_at`

Keep the existing useful fields:

- `status`
- `email_verified`
- `last_login_at`

## 8. API Surface

### 8.1 Public Auth APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### 8.2 Authenticated User APIs

- `GET /api/me`
- `PUT /api/me/profile`
- `PUT /api/me/password`

### 8.3 Protected Domain Areas

- `/api/admin/**` for `ADMIN`
- `/api/owner/**` for `HORSE_OWNER`
- `/api/jockey/**` for `JOCKEY`
- `/api/referee/**` for `REFEREE`

Public reads such as published tournaments, races, rankings, and blogs may remain outside authenticated routes when business rules permit.

## 9. Error Handling

Use consistent semantics:

- `401 Unauthorized`
  - invalid credentials,
  - missing or invalid access token.
- `403 Forbidden`
  - authenticated user lacks required role,
  - email not verified,
  - account locked or disabled.

Recommended application-level error codes:

- `EMAIL_NOT_VERIFIED`
- `ACCOUNT_LOCKED`
- `ACCOUNT_DISABLED`
- `INSUFFICIENT_ROLE`
- `INVALID_CREDENTIALS`
- `INVALID_REFRESH_TOKEN`
- `EXPIRED_REFRESH_TOKEN`

## 10. Security Rules

- Store only hashed refresh tokens and one-time tokens.
- Keep access tokens short-lived.
- Store refresh tokens only in HttpOnly cookies.
- Rotate refresh tokens on each successful refresh.
- Revoke all sessions after password reset.
- Do not grant access from roles whose `user_roles.status` is not `ACTIVE`.
- Do not allow non-active users to complete login.

## 11. Testing Priorities

The minimum auth test suite should cover:

1. registration creates a pending user and assigns `SPECTATOR`,
2. unverified users cannot log in,
3. verified active users can log in,
4. refresh rotates the old session into a new session,
5. logout revokes the current session,
6. password reset revokes all existing sessions,
7. suspended roles no longer authorize protected endpoints,
8. admin-only endpoints reject non-admin users,
9. locked and disabled users cannot authenticate.

## 12. Future Extensions

Possible later additions:

- social login,
- MFA,
- device/session management UI,
- login history,
- fine-grained permission matrix,
- suspicious activity alerts.

These are intentionally deferred so phase 1 remains focused on a clean, dependable auth foundation.
