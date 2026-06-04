# Owner Horse Roster + Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a RacehorseOS-inspired owner horse roster and profile flow with local upload for horse image, initial evidence, and structured horse documents.

**Architecture:** Keep `horses.image_url` and `horses.evidence_url` for initial horse submission, then store profile document metadata and attachments in `horse_documents`. Frontend moves horse creation into a right-side panel, makes `/owner/horses` a filterable roster, and adds `/owner/horses/:id` as a detail profile with document cards in Overview.

**Tech Stack:** Spring Boot, Spring MVC multipart upload, Spring Security authenticated owner context, React, React Router, Vitest, Testing Library, Tailwind CSS, lucide-react.

---

### Task 1: Backend Multipart Upload Support

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/UploadProperties.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/FileStorageService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/UploadWebConfig.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/request/OwnerHorseMultipartRequest.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/controller/OwnerHorseController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/horse/HorseOwnerIntegrationTest.java`

- [ ] **Step 1: Add failing backend tests for multipart create**

Add integration tests that submit `multipart/form-data` with `imageFile` and `evidenceFile`, assert `201/200` success, assert response status is `PENDING`, and assert missing/invalid files return a clear validation error.

Run:

```powershell
mvn test "-Dtest=HorseOwnerIntegrationTest" -DforkCount=0
```

Expected before implementation: tests fail because the owner create endpoint does not accept multipart files.

- [ ] **Step 2: Add upload configuration**

Add `UploadProperties` with:

```java
@ConfigurationProperties(prefix = "app.upload")
public class UploadProperties {
    private Path root = Path.of("uploads");
    private long horseImageMaxBytes = 5 * 1024 * 1024;
    private long horseEvidenceMaxBytes = 10 * 1024 * 1024;
    // getters and setters
}
```

Add application config:

```yaml
app:
  upload:
    root: uploads
    horse-image-max-bytes: 5242880
    horse-evidence-max-bytes: 10485760
```

- [ ] **Step 3: Add file storage service**

Implement `FileStorageService` with methods:

```java
public String storeHorseImage(Long ownerId, MultipartFile file)
public String storeHorseEvidence(Long ownerId, MultipartFile file)
```

Rules:

- Reject empty file.
- Check content type allowlist.
- Check file size.
- Generate `horse-<ownerId>-<uuid>.<ext>`.
- Save only inside `uploads/horses/images` or `uploads/horses/evidence`.
- Return `/uploads/horses/images/<file>` or `/uploads/horses/evidence/<file>`.

- [ ] **Step 4: Serve uploads safely**

Add `UploadWebConfig` implementing `WebMvcConfigurer`:

```java
registry.addResourceHandler("/uploads/**")
    .addResourceLocations(uploadProperties.getRoot().toAbsolutePath().normalize().toUri().toString());
```

Only expose the configured upload root.

- [ ] **Step 5: Add multipart request DTO and controller endpoint**

Add `OwnerHorseMultipartRequest` with text fields plus:

```java
private MultipartFile imageFile;
private MultipartFile evidenceFile;
```

Update owner create endpoint to consume multipart:

```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public HorseResponse create(Authentication authentication, @Valid @ModelAttribute OwnerHorseMultipartRequest request)
```

The controller still derives owner from the authenticated user.

- [ ] **Step 6: Update service create path**

Convert multipart DTO to existing horse creation flow:

- Store image file.
- Store evidence file.
- Create horse with stored paths.
- Keep status `PENDING`.

Run:

```powershell
mvn test "-Dtest=HorseOwnerIntegrationTest" -DforkCount=0
```

Expected: multipart owner horse tests pass.

### Task 2: Backend Owner Horse Detail

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/repository/HorseRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/controller/OwnerHorseController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/horse/HorseOwnerIntegrationTest.java`

- [ ] **Step 1: Add failing tests for owner detail**

Tests:

- owner can fetch own horse by id.
- owner cannot fetch another owner horse.
- unauthenticated request is rejected.

Run:

```powershell
mvn test "-Dtest=HorseOwnerIntegrationTest" -DforkCount=0
```

Expected before implementation: detail endpoint not found.

- [ ] **Step 2: Add repository/service/controller support**

Add repository method:

```java
Optional<Horse> findByIdAndOwnerId(Long id, Long ownerId);
```

Add controller route:

```java
@GetMapping("/{id}")
public HorseResponse getMine(Authentication authentication, @PathVariable Long id)
```

Return standardized not-found/error response when the horse is not owned by the current user.

- [ ] **Step 3: Verify**

Run:

```powershell
mvn test "-Dtest=HorseOwnerIntegrationTest" -DforkCount=0
```

Expected: owner detail tests pass.

### Task 3: Frontend API and Types

**Files:**
- Modify: `frontend/src/api/racingApi.ts`
- Modify: `frontend/src/types/racing.ts`
- Test: existing owner page tests

- [ ] **Step 1: Update create payload type**

Add `HorseMultipartPayload`, `HorseDocument`, and `HorseDocumentPayload`:

```ts
export type HorseMultipartPayload = Omit<HorsePayload, "imageUrl" | "evidenceUrl"> & {
  imageFile: File;
  evidenceFile: File;
};
```

- [ ] **Step 2: Update API client**

Change `createOwnerHorse` to build `FormData`, append text fields only when present, append `imageFile` and `evidenceFile`, and do not manually set `Content-Type`.

Add:

```ts
export async function getOwnerHorse(id: number): Promise<Horse>
export async function getOwnerHorseDocuments(id: number): Promise<HorseDocument[]>
export async function createOwnerHorseDocument(id: number, payload: HorseDocumentPayload): Promise<HorseDocument>
```

Run:

```powershell
node node_modules/vitest/vitest.mjs --run --pool=threads --maxWorkers=1 --minWorkers=1 frontend/src/pages/owner
```

Expected before page updates: tests may fail where they still expect URL fields.

### Task 4: Owner Horse Roster Page

**Files:**
- Modify: `frontend/src/pages/owner/OwnerHorsesPage.tsx`
- Test: `frontend/src/pages/owner/OwnerHorsesPage.test.tsx`

- [ ] **Step 1: Add failing UI tests**

Tests:

- renders `Horse Roster`.
- filters by search text.
- filters by status.
- opens Add Horse panel.
- requires image and evidence file inputs.
- submits multipart horse creation.
- `View Profile` links to `/owner/horses/:id`.

Run:

```powershell
node node_modules/vitest/vitest.mjs --run --pool=threads --maxWorkers=1 --minWorkers=1 frontend/src/pages/owner/OwnerHorsesPage.test.tsx
```

- [ ] **Step 2: Implement roster layout**

Replace the form-first layout with:

- page header and `Add Horse` button.
- toolbar search/status/gender filters.
- table columns: Horse, Status, Documents, Recent Activity, Actions.
- empty/loading/error states.

- [ ] **Step 3: Implement Add Horse right-side panel**

Panel includes:

- text fields from existing form.
- no owner-entered registration code; backend generates it.
- file input for horse image.
- file input for evidence document.
- image preview.
- selected evidence filename.
- success/error status.

Use accessible labels and focusable controls.

- [ ] **Step 4: Verify**

Run owner horses test command again. Expected: pass.

### Task 5: Owner Horse Profile Page

**Files:**
- Create: `frontend/src/pages/owner/OwnerHorseProfilePage.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`
- Test: `frontend/src/pages/owner/OwnerHorseProfilePage.test.tsx`

- [ ] **Step 1: Add failing profile tests**

Tests:

- loads horse detail.
- renders `Back to Roster`.
- shows Overview, Tournament Registrations, Health Notes tabs.
- shows Medical Documents Status inside Overview.
- uploads a structured medical document from the Overview modal.
- approved horse shows register tournament CTA.
- pending horse disables registration CTA with pending explanation.
- rejected horse shows rejection reason.

Run:

```powershell
node node_modules/vitest/vitest.mjs --run --pool=threads --maxWorkers=1 --minWorkers=1 frontend/src/pages/owner/OwnerHorseProfilePage.test.tsx
```

- [ ] **Step 2: Implement route and page**

Add route:

```tsx
<Route path="/owner/horses/:horseId" element={<OwnerHorseProfilePage />} />
```

Page loads:

- `getOwnerHorse(Number(horseId))`.
- `getOwnerHorseDocuments(Number(horseId))`.
- `getOwnerTournamentRegistrations()`.
- filters registrations by `horseId`.

Render tabs as local state buttons. Keep documents inside Overview rather than using a separate Documents tab, and do not include horse image in the document section.

- [ ] **Step 3: Verify**

Run profile test command. Expected: pass.

### Task 6: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run backend focused tests**

```powershell
mvn test "-Dtest=HorseOwnerIntegrationTest,TournamentRegistrationIntegrationTest" -DforkCount=0
```

Expected: build success.

- [ ] **Step 2: Run frontend tests**

```powershell
node node_modules/vitest/vitest.mjs --run --pool=threads --maxWorkers=1 --minWorkers=1
```

Expected: all frontend tests pass.

- [ ] **Step 3: Manual smoke check**

Start dev servers if needed, then check:

- `/owner/horses` roster renders.
- Add Horse panel opens.
- File fields are usable.
- Horse profile route renders.
- Existing `/owner/registrations` still works.

No git commit should be made by the agent because the user will commit manually.
