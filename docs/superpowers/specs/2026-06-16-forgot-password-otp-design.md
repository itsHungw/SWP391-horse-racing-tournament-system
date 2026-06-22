# Forgot Password OTP Design

Date: 2026-06-16
Status: APPROVED

## Goal

Add a secure forgot-password flow to the existing login experience. Users who forgot their password can request a reset code by email, enter the 6 digit OTP, and set a new password without needing an active login session.

The design intentionally reuses the current auth foundation:

- `PasswordResetToken` and `PasswordResetTokenRepository`
- `OneTimeTokenService`
- `EmailSender.sendPasswordReset(...)`
- existing mail configuration in `application.yml`
- existing public auth route pattern under `/api/v1/auth`
- existing email verification UI patterns

## Non-Goals

- No Redis in this iteration.
- No password reset link flow.
- No admin-assisted reset workflow.
- No change to login JWT/refresh-token architecture beyond revoking old refresh sessions after a successful reset.

## User Flow

1. User opens `/login` and clicks **Forgot password?**.
2. User enters their email address.
3. Frontend calls `POST /api/v1/auth/forgot-password`.
4. Backend always returns a generic success response, even if the email does not exist.
5. If the email belongs to an eligible user, backend sends a 6 digit OTP to that email.
6. User enters `email`, `OTP`, `newPassword`, and `confirmPassword`.
7. Frontend calls `POST /api/v1/auth/reset-password`.
8. Backend validates the OTP, updates the password hash, marks the token used, and revokes existing refresh sessions for that user.
9. User is sent back to login with a success message.

## API Design

### Request Reset Code

`POST /api/v1/auth/forgot-password`

Request:

```json
{
  "email": "user@gmail.com"
}
```

Response:

- `204 No Content` or `200 OK` with no sensitive detail.
- The frontend copy should say: `If this email exists, we sent a reset code.`

Security behavior:

- Do not reveal whether the account exists.
- Do not send reset codes to deleted or disabled accounts.
- For pending email verification accounts, either send no reset email or return the same generic response. This avoids letting unverified accounts bypass email verification.

### Reset Password

`POST /api/v1/auth/reset-password`

Request:

```json
{
  "email": "user@gmail.com",
  "token": "123456",
  "newPassword": "NewStrongPassword123!",
  "confirmPassword": "NewStrongPassword123!"
}
```

Response:

- `204 No Content` on success.
- `400 Bad Request` for invalid/expired/locked token or invalid password.

The reset request must include `email` because a 6 digit OTP has only 1,000,000 combinations. The backend must verify the tuple `(email, token)` instead of looking up a token globally.

## Backend Design

### DTOs

Add:

- `ForgotPasswordRequest`
  - `@NotBlank`
  - `@Email`
  - `@Size(max = 255)`
- `ResetPasswordRequest`
  - `email`: `@NotBlank`, `@Email`, `@Size(max = 255)`
  - `token`: exactly 6 digits
  - `newPassword`: same password policy as registration
  - `confirmPassword`: same basic size constraints

The service compares `newPassword` and `confirmPassword`. Do not add DTO-level cross-field validation in this iteration; service-level validation keeps the change smaller and easier to test.

### Token Service

Adjust `OneTimeTokenService` for password reset OTPs:

- generate a 6 digit OTP using the existing secure random OTP generator
- hash the OTP before storing it
- mark previous unused password reset tokens for the user as used before creating a new one
- add consume/validation support for `(email, token)`

### Password Reset Token Model

Extend `password_reset_tokens`:

- `failed_attempts int not null default 0`
- `locked_at datetime2 null`

Entity behavior:

- `incrementFailedAttempts()`
- `lockNow()`
- `isLocked()`
- `markUsed()`
- `isExpired(...)`

Failure policy:

- If OTP is wrong, increment `failed_attempts` on the active latest token for that email.
- When `failed_attempts >= 5`, set `locked_at`.
- A locked token cannot be used, even if the correct OTP is entered later.
- User must request a new code after lock.

### Auth Service

Add:

- `requestPasswordReset(String rawEmail)`
- `resetPassword(ResetPasswordRequest request)`

`requestPasswordReset`:

- normalize email
- find user
- if absent, deleted, disabled, or pending email verification: return normally
- create OTP reset token
- send password reset email

`resetPassword`:

- normalize email
- validate password confirmation
- consume OTP for email
- update `User.passwordHash` using `PasswordEncoder`
- record password changed timestamp if existing entity support is available
- mark token used
- revoke all active refresh sessions for the user

## Rate Limiting

Extend the existing `RateLimitingFilter` with rules for:

- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

Recommended defaults:

- forgot password: 3 attempts per 15 minutes per IP
- reset password: 10 attempts per 15 minutes per IP

If the current rate limiter only supports one global window, introduce separate config properties while keeping defaults conservative. Per-email throttling and Redis-backed counters are explicitly out of scope for this iteration.

## Configuration

Set password reset OTP TTL to 10 minutes:

```yaml
app:
  auth:
    password-reset-token-ttl-minutes: 10
```

Mail must continue using environment-backed SMTP configuration. No mail credentials should be committed.

## Frontend Design

Add a dedicated page:

- route: `/forgot-password`
- page: `ForgotPasswordPage`

Recommended UI states:

1. **Email step**
   - email input
   - submit button: `Send reset code`
   - link back to login
2. **Reset step**
   - show masked or plain email currently being reset
   - OTP input with 6 digit max
   - new password input
   - confirm password input
   - submit button: `Reset password`
   - resend/reset email action that returns to email step or calls forgot-password again
3. **Success state**
   - message: password changed successfully
   - button/link to `/login`

Add a `Forgot password?` link to the login form.

Frontend validation:

- email format
- OTP must be 6 digits
- new password and confirm password must match
- password policy should mirror registration

## Error Handling

Use generic copy for request-code response:

- `If this email exists, we sent a reset code.`

Use clear but non-sensitive reset errors:

- `The reset code is invalid, expired, or locked. Request a new code and try again.`
- `Passwords do not match.`
- `Password does not meet the security requirements.`

Avoid exposing whether an email exists in either endpoint.

## Tests

Backend integration tests:

- forgot password returns generic success for unknown email
- forgot password sends OTP for eligible existing user
- reset password succeeds with correct `email + OTP`
- reset password rejects wrong OTP and increments `failed_attempts`
- token locks after 5 wrong attempts
- locked token cannot reset password
- expired token cannot reset password
- successful reset revokes active refresh sessions
- login succeeds with new password and fails with old password

Frontend tests:

- login page renders forgot-password link
- forgot-password page requests code for valid email
- reset step validates OTP and matching password
- successful reset shows login CTA
- backend reset error shows safe user-facing message

## Rollout Notes

- Add a Flyway migration for `failed_attempts` and `locked_at`.
- Existing `password_reset_tokens` rows should receive `failed_attempts = 0`.
- Confirm SMTP settings in local/production before manual verification.
- Confirm rate-limit settings do not block normal QA flows.
