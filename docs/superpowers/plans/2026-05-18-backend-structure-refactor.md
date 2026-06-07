# Backend Structure Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the backend's root-level layer-first package layout with a domain-first package tree and synchronize technical documentation with the Java 21 / Spring Boot 4 direction.

**Architecture:** Keep the existing controller-service-repository layering, but nest it inside business domains such as `auth`, `user`, `horse`, and `race`. Shared infrastructure moves under explicit `security` and `common` packages so the package tree reflects the business model while keeping cross-cutting concerns separate.

**Tech Stack:** Java 21, Spring Boot 4.x, Maven, JUnit 5, Markdown documentation.

---

## File Structure

### Create package tree

- Create `backend/src/main/java/com/example/horseracingtournamentsystem/auth/{controller,dto,model,repository,service}/`
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/user/{controller,dto,model,repository,service}/`
- Create empty module directories for:
  - `horse/`
  - `tournament/`
  - `race/`
  - `referee/`
  - `result/`
  - `prediction/`
  - `blog/`
  - `notification/`
  - `filestorage/`
  - `aiinsight/`
- Create shared directories:
  - `security/`
  - `common/config/`
  - `common/exception/`
  - `common/response/`
  - `common/util/`

### Remove obsolete empty directories

- Remove:
  - `backend/src/main/java/com/example/horseracingtournamentsystem/config/`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/controller/`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/dto/`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/model/`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/repository/`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/service/`

### Update documentation

- Modify `docs/specs/technical/02_backend-architecture.md`
- Modify `docs/specs/technical/01_tech-stack.md`

---

### Task 1: Create the domain-first package tree

**Files:**
- Create: backend package directories listed above

- [ ] **Step 1: Create the target package directories**

Run:

```powershell
$base = 'backend/src/main/java/com/example/horseracingtournamentsystem'
$dirs = @(
  'auth/controller','auth/dto','auth/model','auth/repository','auth/service',
  'user/controller','user/dto','user/model','user/repository','user/service',
  'horse','tournament','race','referee','result','prediction','blog','notification','filestorage','aiinsight',
  'security',
  'common/config','common/exception','common/response','common/util'
)
foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Force -Path (Join-Path $base $dir) | Out-Null
}
```

- [ ] **Step 2: Verify the new directories exist**

Run:

```powershell
Get-ChildItem -Recurse 'backend/src/main/java/com/example/horseracingtournamentsystem' -Directory
```

Expected: output includes the new `auth`, `user`, module, `security`, and `common/*` directories.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/example/horseracingtournamentsystem
git commit -m "chore: scaffold domain-first backend packages"
```

### Task 2: Remove obsolete root-level layer packages

**Files:**
- Delete: the six empty root-level layer directories

- [ ] **Step 1: Confirm the directories are empty**

Run:

```powershell
Get-ChildItem 'backend/src/main/java/com/example/horseracingtournamentsystem/config',
              'backend/src/main/java/com/example/horseracingtournamentsystem/controller',
              'backend/src/main/java/com/example/horseracingtournamentsystem/dto',
              'backend/src/main/java/com/example/horseracingtournamentsystem/model',
              'backend/src/main/java/com/example/horseracingtournamentsystem/repository',
              'backend/src/main/java/com/example/horseracingtournamentsystem/service' -Force
```

Expected: no files are listed.

- [ ] **Step 2: Remove the empty obsolete directories**

Run:

```powershell
Remove-Item -LiteralPath `
  'backend/src/main/java/com/example/horseracingtournamentsystem/config',`
  'backend/src/main/java/com/example/horseracingtournamentsystem/controller',`
  'backend/src/main/java/com/example/horseracingtournamentsystem/dto',`
  'backend/src/main/java/com/example/horseracingtournamentsystem/model',`
  'backend/src/main/java/com/example/horseracingtournamentsystem/repository',`
  'backend/src/main/java/com/example/horseracingtournamentsystem/service'
```

- [ ] **Step 3: Verify the obsolete directories are gone**

Run:

```powershell
Test-Path 'backend/src/main/java/com/example/horseracingtournamentsystem/controller'
```

Expected: `False`.

- [ ] **Step 4: Commit**

```bash
git add -A backend/src/main/java/com/example/horseracingtournamentsystem
git commit -m "refactor: remove root layer packages"
```

### Task 3: Update backend architecture documentation

**Files:**
- Modify: `docs/specs/technical/02_backend-architecture.md`

- [ ] **Step 1: Replace the current document with domain-first guidance**

Use this content:

```markdown
# Backend Architecture

## 1. Package strategy

The backend uses a **domain-first package structure**. Business modules live at the top level, and each module keeps its own internal layers.

```text
com.example.horseracingtournamentsystem
├─ auth/
├─ user/
├─ horse/
├─ tournament/
├─ race/
├─ referee/
├─ result/
├─ prediction/
├─ blog/
├─ notification/
├─ filestorage/
├─ aiinsight/
├─ security/
└─ common/
```

## 2. Internal layering

Inside a domain module, the dependency direction remains:

```text
Controller -> Service -> Repository -> Database
```

## 3. Rules

- Controllers validate requests and return DTOs.
- Services own business rules and transactions.
- Repositories own persistence only.
- Entities are not exposed directly to clients.
- Multi-table workflows are transactional.
- Global exception handling converts failures into stable API responses.
- Shared technical infrastructure belongs in `security` or `common`, not inside business modules.

## 4. Core modules

- auth and security,
- user and role request,
- horse,
- tournament and registration,
- race and invitation,
- referee operations,
- result and ranking,
- prediction game,
- blog reward,
- notification,
- file storage,
- AI race insight.

## 5. Response envelope

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-05-17T00:00:00"
}
```
```

- [ ] **Step 2: Verify the document no longer describes only root-level layering**

Run:

```powershell
Select-String -Path 'docs/specs/technical/02_backend-architecture.md' -Pattern 'domain-first','Controller -> Service -> Repository'
```

Expected: both patterns are present.

- [ ] **Step 3: Commit**

```bash
git add docs/specs/technical/02_backend-architecture.md
git commit -m "docs: describe domain-first backend architecture"
```

### Task 4: Update the technical baseline documentation

**Files:**
- Modify: `docs/specs/technical/01_tech-stack.md`

- [ ] **Step 1: Change backend baseline values**

Replace:

```markdown
| Backend | Java 17+, Spring Boot 3.x |
```

with:

```markdown
| Backend | Java 21, Spring Boot 4.x |
```

- [ ] **Step 2: Verify the updated baseline**

Run:

```powershell
Select-String -Path 'docs/specs/technical/01_tech-stack.md' -Pattern 'Java 21, Spring Boot 4.x'
```

Expected: one matching line.

- [ ] **Step 3: Commit**

```bash
git add docs/specs/technical/01_tech-stack.md
git commit -m "docs: align backend tech stack baseline"
```

### Task 5: Verify repository consistency

**Files:**
- No file changes expected

- [ ] **Step 1: Run the backend test suite**

Run:

```powershell
cd backend
mvn test
```

Expected: tests pass.

- [ ] **Step 2: Verify final package layout**

Run:

```powershell
Get-ChildItem -Recurse 'backend/src/main/java/com/example/horseracingtournamentsystem' -Directory
```

Expected: output includes only the new domain-first structure plus `security` and `common`.

- [ ] **Step 3: Review docs for consistency**

Run:

```powershell
Select-String -Path 'docs/specs/technical/*.md','docs/superpowers/plans/2026-05-18-auth.md' -Pattern 'Java 17','Spring Boot 3.x'
```

Expected: no stale baseline remains in technical docs.

- [ ] **Step 4: Commit if verification required any final documentation fix**

If no changes are needed, skip this commit.

## Self-Review

### Spec coverage

- Domain-first package layout: Tasks 1 and 2
- Explicit shared infrastructure packages: Task 1
- Backend architecture doc update: Task 3
- Java 21 / Spring Boot 4.x baseline sync: Task 4
- Verification pass: Task 5

### Placeholder scan

- No placeholders remain.

### Type consistency

- Directory names match the approved design spec exactly.
