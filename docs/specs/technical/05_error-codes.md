# Error Handling

## 1. Backend Error Boundary

The backend centralizes REST error handling in `common/error/GlobalExceptionHandler.java`. Controllers should throw validation/security/business exceptions and let the global handler convert them into JSON responses.

Main error response DTO: `common/error/ApiErrorResponse.java`.

## 2. Expected Error Categories

- Validation failure: invalid DTO fields, invalid request parameters, invalid multipart payload.
- Authentication failure: missing, expired, or invalid JWT.
- Authorization failure: authenticated user lacks required role.
- Business rule failure: invalid state transition, insufficient wallet balance, unavailable race, duplicate registration, invalid owner/jockey/referee action, organizer/personal-role separation violation.
- Not found: missing user, horse, tournament, race, blog, prediction, or registration.
- Conflict: duplicate unique values or idempotency violation.
- Internal error: unexpected service/database failure.

## 3. Frontend Error Handling

The shared Axios client in `frontend/src/api/httpClient.ts` attaches auth state and handles retry/refresh behavior. Page-level components display failures near the workflow that triggered them.

Common UI expectations:

- Form validation should catch obvious input issues before submit.
- Server validation messages should be shown in the page or modal.
- Protected routes should redirect or block users without required auth/role.
- Mutating actions should preserve user context after failure.

## 4. Report Note

For project report purposes, describe error handling as a layered mechanism:

1. DTO validation at API boundary.
2. Business validation in service layer.
3. Security validation in filter/security chain.
4. Central response formatting in global exception handler.
5. UI-level feedback in page components.
