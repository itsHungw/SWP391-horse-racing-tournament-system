# Auth and User Entity Mapping Design

## 1. Purpose

This design defines the first JPA mapping slice for the backend: identity, role assignment, role requests, and auth-session persistence.

The goal is to establish a Spring Boot entity style that matches the database schema, fits the domain-first package structure, and becomes the pattern for later modules.

## 2. Scope

Included:

- `users`
- `roles`
- `user_roles`
- `user_role_history`
- `role_requests`
- `auth_sessions`
- `email_verification_tokens`
- `password_reset_tokens`

Excluded:

- profile tables,
- horses,
- tournaments,
- races,
- prediction and blog modules,
- controllers, services, repositories, and API DTOs beyond what is necessary to validate the mapping shape.

## 3. Package Structure

```text
com.example.horseracingtournamentsystem
├─ user
│  └─ model
│     ├─ User.java
│     ├─ Role.java
│     ├─ UserRole.java
│     ├─ UserRoleHistory.java
│     └─ RoleRequest.java
└─ auth
   └─ model
      ├─ AuthSession.java
      ├─ EmailVerificationToken.java
      └─ PasswordResetToken.java
```

## 4. Spring Boot Mapping Principles

- Organize by feature/domain, not by global technical layer.
- Map entities closely to the SQL schema.
- Use lazy `@ManyToOne` relations for foreign keys.
- Add bidirectional collections only when they serve a current use case.
- Keep entities out of API responses.
- Preserve business logic in services, while allowing entities to own small lifecycle behaviors that belong to themselves.

## 5. Entity Responsibilities

### 5.1 `User`

Owns identity state:

- full name,
- email,
- password hash,
- profile/contact fields,
- account status,
- verification state,
- login/password timestamps.

Useful lifecycle helpers:

- create pending users,
- mark verified/active,
- change password,
- expose active role names.

### 5.2 `Role`

Stores the canonical role catalog:

- `ADMIN`
- `SPECTATOR`
- `HORSE_OWNER`
- `JOCKEY`
- `REFEREE`

### 5.3 `UserRole`

Links users to roles and tracks assignment status.

Useful lifecycle helpers:

- create active assignment,
- check whether the assignment is active.

### 5.4 `UserRoleHistory`

Stores role-status transitions for audit purposes.

### 5.5 `RoleRequest`

Stores public requests for additional roles and their admin review outcome.

### 5.6 `AuthSession`

Stores refresh-token-backed login sessions.

Useful lifecycle helpers:

- detect expiration,
- revoke current session,
- mark replacement session.

### 5.7 `EmailVerificationToken`

Stores one-time email verification tokens.

Useful lifecycle helpers:

- detect expiration,
- mark token as used.

### 5.8 `PasswordResetToken`

Stores one-time password reset tokens.

Useful lifecycle helpers:

- detect expiration,
- mark token as used.

## 6. Relationship Strategy

Required now:

- `UserRole -> User`
- `UserRole -> Role`
- `UserRoleHistory -> UserRole`
- `UserRoleHistory -> User`
- `RoleRequest -> User`
- `RoleRequest -> User` reviewer
- `AuthSession -> User`
- `AuthSession -> AuthSession` replacement
- `EmailVerificationToken -> User`
- `PasswordResetToken -> User`
- `User -> Set<UserRole>`

Intentionally deferred:

- broad reverse collections on `Role`, `RoleRequest`, and token entities,
- relationships into profile and racing modules,
- eager loading of role graphs.

## 7. Type Choices

- `LocalDateTime` for `DATETIME2`
- `LocalDate` for `DATE`
- `boolean` for SQL Server `BIT`
- `String` for status columns during the first auth implementation phase

Status columns stay as strings initially to match the current database constraints and keep the first mapping pass low-friction. Enum conversion can be revisited later if the service layer needs stronger compile-time guarantees.

## 8. Supporting Baseline Change

Update Maven to:

```xml
<java.version>21</java.version>
```

This keeps the backend implementation aligned with the technical docs and current Java baseline.

## 9. Testing Strategy

Use focused persistence tests to prove:

1. a user can be loaded with active roles,
2. auth session self-reference mapping works,
3. one-time token entities persist correctly,
4. table/column names align with the SQL schema.

## 10. Expected Outcome

After this slice:

- the auth/user schema has a clean JPA representation,
- the codebase has a repeatable entity-mapping pattern,
- future auth services can build on verified persistence models instead of guessing against raw SQL.
