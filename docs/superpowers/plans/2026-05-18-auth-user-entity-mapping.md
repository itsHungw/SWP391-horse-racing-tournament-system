# Auth and User Entity Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Map the auth and user database slice into clean Spring Boot JPA entities and align the backend Java baseline with the documented Java 21 target.

**Architecture:** Use domain-first packages with focused model classes under `user.model` and `auth.model`. Keep mappings close to the SQL schema, use lazy associations, and validate the mapping through focused persistence tests before broader auth services are implemented.

**Tech Stack:** Java 21, Spring Boot 4.x, Spring Data JPA, JUnit 5.

---

## File Structure

### Modify

- `backend/pom.xml`

### Create

- `backend/src/main/java/com/example/horseracingtournamentsystem/user/model/User.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/model/Role.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/model/UserRole.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/model/UserRoleHistory.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/model/RoleRequest.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/auth/model/AuthSession.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/auth/model/EmailVerificationToken.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/auth/model/PasswordResetToken.java`
- `backend/src/test/java/com/example/horseracingtournamentsystem/user/model/UserEntityMappingTest.java`
- `backend/src/test/java/com/example/horseracingtournamentsystem/auth/model/AuthEntityMappingTest.java`

---

### Task 1: Align Java baseline

**Files:**
- Modify: `backend/pom.xml`

- [ ] **Step 1: Update Java version**

Replace:

```xml
<java.version>17</java.version>
```

with:

```xml
<java.version>21</java.version>
```

- [ ] **Step 2: Verify the pom value**

Run:

```powershell
Select-String -Path 'backend/pom.xml' -Pattern '<java.version>21</java.version>'
```

Expected: one match.

### Task 2: Add user-side entities

**Files:**
- Create the five `user/model` classes

- [ ] **Step 1: Create `Role.java`**
- [ ] **Step 2: Create `User.java`**
- [ ] **Step 3: Create `UserRole.java`**
- [ ] **Step 4: Create `UserRoleHistory.java`**
- [ ] **Step 5: Create `RoleRequest.java`**

Entity expectations:

- exact table names,
- lazy many-to-one relations,
- `User.userRoles`,
- small lifecycle helpers on `User` and `UserRole`,
- `LocalDateTime` / `LocalDate` usage matching SQL column types.

### Task 3: Add auth-side entities

**Files:**
- Create the three `auth/model` classes

- [ ] **Step 1: Create `AuthSession.java`**
- [ ] **Step 2: Create `EmailVerificationToken.java`**
- [ ] **Step 3: Create `PasswordResetToken.java`**

Entity expectations:

- exact table names,
- lazy relation to `User`,
- self-reference on `AuthSession.replacedBySession`,
- lifecycle helpers for expiration/revocation/usage.

### Task 4: Add persistence mapping tests

**Files:**
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/user/model/UserEntityMappingTest.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/model/AuthEntityMappingTest.java`

- [ ] **Step 1: Write user mapping tests**

Test that:

- a pending user can be created,
- an active spectator role is visible through `getActiveRoleNames()`.

- [ ] **Step 2: Write auth mapping tests**

Test that:

- `AuthSession` self-reference can be assigned,
- verification and reset tokens can be marked used.

- [ ] **Step 3: Run focused tests**

Run:

```powershell
cd backend
mvn test -Dtest=UserEntityMappingTest,AuthEntityMappingTest
```

Expected: tests pass.

### Task 5: Final verification

**Files:**
- No additional changes expected

- [ ] **Step 1: Run the backend test suite**

Run:

```powershell
cd backend
mvn test
```

Expected: build succeeds.

## Self-Review

### Spec coverage

- user entities: Task 2
- auth entities: Task 3
- Java 21 alignment: Task 1
- persistence validation: Task 4
- final verification: Task 5

### Placeholder scan

- No placeholders remain.

### Type consistency

- Entity names and table names match the approved design spec.
