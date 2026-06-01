# Owner Horse Roster + Profile Redesign

## Purpose

Redesign the Horse Owner stable area so it feels closer to a real stable-management product while staying focused on the current core workflow:

1. Owner submits a horse profile with local image and evidence uploads.
2. Admin reviews and approves or rejects the horse.
3. Owner views horse status in a roster.
4. Owner opens a horse profile to inspect details, medical documents inside Overview, health notes, and tournament registration state.

This design is inspired by RacehorseOS-style stable management, but it adapts the business flow to this project. It does not add full medication, training, feed, billing, or owner-pack workflows in this phase.

## Current Context

The project already has:

- `OwnerLayout` with owner navigation.
- `/owner/dashboard` overview.
- `/owner/horses` with a create form and horse table.
- `/owner/registrations` for tournament registration submission and withdrawal.
- Backend owner horse creation that sets owner from the authenticated user.
- Horse approval fields: `status`, `rejectionReason`, `approvedBy`, `approvedAt`.
- Horse evidence fields: `imageUrl`, `evidenceUrl`, `medicalNote`, `healthStatus`, `registrationCode`.

The current `/owner/horses` page works, but the form-first layout feels less professional than a stable roster. The next step is to make the horse list the primary workspace and move creation into a right-side panel.

## Scope

### In Scope

- Redesign `/owner/horses` into a horse roster page.
- Add search and filters for horse records.
- Move `Add Horse` into a right-side panel.
- Replace URL inputs for horse image and evidence with local file uploads.
- Add `/owner/horses/:id` horse profile route.
- Add profile tabs for overview, tournament registrations, and health notes.
- Keep horse photo separate in `horses.image_url`; do not treat horse image as a document.
- Keep initial evidence in `horses.evidence_url`, then support structured document uploads through `horse_documents`.
- Add owner document upload/list APIs for `/owner/horses/:id`.
- Add backend support for multipart owner horse creation.
- Add frontend and backend tests for the main owner flow.

### Out of Scope

- Medication logs beyond document metadata.
- Training logs.
- Feed plans.
- Billing.
- Owner Pack PDF generation.
- Jockey invitation workflow.
- Race participant assignment.
- Referee checks or race result workflows.

## UX Model

The owner stable area should behave like a work dashboard, not a marketing page.

Primary owner path:

```text
/owner/dashboard
  -> /owner/horses
  -> Add Horse
  -> Admin review pending
  -> /owner/horses/:id
  -> /owner/registrations when approved
```

The page should prioritize scanning, filtering, and acting on records. Use compact tables, status badges, clear CTAs, and restrained color.

## `/owner/horses` Horse Roster

### Header

The page header should include:

- Title: `Horse Roster`
- Subtitle: `Manage your stable of X horses`
- Primary action: `Add Horse`

The `Add Horse` button opens a right-side panel. The full create form should not sit permanently at the top of the roster.

### Toolbar

Add a toolbar above the table:

- Search input: horse name, breed, registration code, color.
- Status filter:
  - All Status
  - Pending
  - Approved
  - Rejected
  - Inactive
- Gender filter:
  - All Gender
  - Male
  - Female

Optional later:

- Breed filter.
- Sort by newest, name, status.

### Table Columns

Recommended columns:

- Horse
  - Thumbnail image.
  - Horse name.
  - Breed/color/registration code as secondary text.
- Status
  - `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`.
- Documents
  - Image available.
  - Evidence available.
  - Missing labels if needed.
- Recent Activity
  - Derived text based on status and registration state.
- Actions
  - `View Profile`.

### Recent Activity Rules

Use simple derived messages:

- `PENDING`: `Waiting for admin review`.
- `APPROVED`: `Approved for tournament registration`.
- `REJECTED`: `Rejected: <reason>`.
- Has pending tournament registration: `Tournament registration under review`.
- Has approved tournament registration: `Registered for <tournamentName>`.

If multiple conditions apply, show the most operationally useful item first:

1. Rejection reason.
2. Pending review.
3. Active tournament registration.
4. Approved and ready.

## Add Horse Panel

### Required Fields

- `name`
- `gender`
- `imageFile`
- `evidenceFile`

### Optional Fields

- `breed`
- `dateOfBirth`
- `color`
- `heightCm`
- `weightKg`
- `healthStatus`
- `medicalNote`
- `description`

### Upload UX

Use local file pickers instead of raw URL inputs.

Horse image:

- Accept: `image/jpeg`, `image/png`, `image/webp`.
- Show image preview after selection.
- Recommended max size: `5MB`.

Evidence document:

- Accept: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
- Show selected filename and size.
- Recommended max size: `10MB`.

Submit behavior:

- Disable submit while uploading.
- Show clear field-level errors when validation fails.
- On success, close the modal, refresh roster, and show: `Horse submitted for admin review.`

## Backend Upload Design

Use two upload paths:

- Initial horse creation stores `imageFile` and `evidenceFile` on the horse record.
- Later profile document uploads store structured records in `horse_documents`.

### Endpoint

Use multipart for owner horse creation:

```http
POST /api/owner/horses
Content-Type: multipart/form-data
```

Use `@ModelAttribute OwnerHorseMultipartRequest request` so the frontend can send all fields and files in one `FormData`.

Parts:

- horse text fields: `name`, `gender`, `breed`, `dateOfBirth`, `color`, `heightCm`, `weightKg`, `healthStatus`, `medicalNote`, `description`.
- `imageFile`: horse image file.
- `evidenceFile`: ownership or health evidence file.

Owner-submitted horse creation ignores any client-supplied registration code. Backend generates the code.

### Structured Document Endpoint

Use multipart for profile documents:

```http
POST /api/v1/owner/horses/{id}/documents
Content-Type: multipart/form-data
```

Parts:

- `documentType`: `OWNERSHIP_CERTIFICATE`, `HEALTH_CERTIFICATE`, `COGGINS`, `REGISTRATION_CERTIFICATE`, or `OTHER`.
- `referenceNumber`.
- `issueDate`.
- `expiryDate`.
- `issuer`.
- `notes`.
- `documentFile`.

List endpoint:

```http
GET /api/v1/owner/horses/{id}/documents
```

Both endpoints must ensure the horse belongs to the authenticated owner.

### Storage

Store files locally for this phase:

```text
uploads/
  horses/
    images/
    evidence/
    documents/
```

Generated file names should avoid collisions:

```text
horse-<ownerId>-<uuid>.<ext>
```

After storage:

- `horses.image_url` stores a served path such as `/uploads/horses/images/horse-1-abc.jpg`.
- `horses.evidence_url` stores a served path such as `/uploads/horses/evidence/horse-1-def.pdf`.

### Static File Serving

Backend should expose uploaded files under a predictable path:

```text
/uploads/**
```

The file serving setup must not expose arbitrary server paths. It should only serve files inside the configured upload root.

### Validation

Backend validation must enforce:

- `name` not blank.
- `gender` is `MALE` or `FEMALE`.
- `imageFile` is required.
- `evidenceFile` is required.
- Image file content type is JPG, PNG, or WebP.
- Evidence file content type is PDF, JPG, PNG, or WebP.
- Document attachment content type is PDF, JPG, PNG, or WebP.
- File size limit is enforced.
- `heightCm > 0` when present.
- `weightKg > 0` when present.
- `dateOfBirth` is not in the future.

On validation failure, use the existing standardized API error response so the frontend can render a clear message.

## `/owner/horses/:id` Horse Profile

### Header

Top area:

- `Back to Roster`.
- Horse name.
- Metadata line: age/date of birth if available, gender, breed, color, registration code.
- Status badge.
- Optional edit action reserved for later.

### Tabs

Use tabs to mirror a professional stable-management product while keeping the implemented business small.

Implemented tabs:

- `Overview`
- `Tournament Registrations`
- `Health Notes`

Do not show full tabs for medication, training, feed, billing, or owner pack in this phase. Those can be added later when the underlying business exists.

### Overview Tab

Show:

- Basic information:
  - registration code
  - breed
  - gender
  - color
  - date of birth
  - height
  - weight
- Horse image card.
- Owner submission status:
  - Pending admin review.
  - Approved by admin and approved time.
  - Rejected reason.
- Description.
- Medical Documents Status cards:
  - `Coggins`
  - `Health Certificate`
  - `Ownership Certificate`
- `Add Document` modal for structured document upload.

### Medical Documents Status

This section lives inside `Overview`, not a separate tab.

Show cards similar to RacehorseOS:

- If a structured document exists: reference number, issuer, expiry date, and open-document link.
- If missing: `No document on file` and a clear add action.
- For `Ownership Certificate`, the original `horses.evidence_url` may be shown as initial evidence until the owner uploads a structured document.

Do not show horse image in this document section. Horse image belongs only in the Photo card.

Document modal fields:

- Document Type.
- ID/Reference Number.
- Issue Date.
- Expiry Date.
- Issuer.
- Document Attachment.
- Notes.

Tournament registration eligibility:

- Horse must be `APPROVED`.
- Horse must have structured `COGGINS` and `HEALTH_CERTIFICATE` documents.
- Both medical documents must have an `expiryDate` on or after the tournament end date.
- If a required document is missing, show the backend message clearly in `/owner/registrations`.
- If a document expires before the tournament ends, show the backend expiry message clearly in `/owner/registrations`.

### Tournament Registrations Tab

Show registrations for this horse:

- Tournament name.
- Status.
- Note.
- Rejection reason.
- Reviewed time.
- Withdraw action when status is `PENDING`.

If the horse is approved, show CTA:

```text
Register this horse in a tournament
```

If the horse is not approved, disable the CTA and show why:

- `PENDING`: `Admin review is still pending.`
- `REJECTED`: `Resolve the rejection before registering.`

### Health Notes Tab

Show simple health information from existing fields:

- `healthStatus`
- `medicalNote`

This is not a full medical record module. It is only a readable section for information submitted during horse registration.

## Data Flow

### Roster Load

```text
Owner opens /owner/horses
  -> GET owner horses
  -> GET owner tournament registrations
  -> derive status counts and recent activity
  -> render roster
```

### Create Horse

```text
Owner opens Add Horse
  -> selects image and evidence from local machine
  -> frontend builds FormData
  -> POST multipart /api/owner/horses
  -> backend validates fields and files
  -> backend stores files locally
  -> backend creates horse with PENDING status
  -> frontend closes modal and refreshes roster
```

### Profile Load

```text
Owner opens /owner/horses/:id
  -> GET owner horse detail if endpoint exists
  -> GET owner horse documents
  -> GET owner tournament registrations
  -> filter registrations by horseId
  -> render profile overview and tabs
```

Recommended backend endpoint:

```http
GET /api/owner/horses/{id}
```

This endpoint should ensure the horse belongs to the authenticated owner.

## Error Handling

Frontend should render backend messages from the standardized API error response.

Important cases:

- Missing image file.
- Missing evidence file.
- Unsupported file type.
- Invalid document attachment type.
- Document expiry date before issue date.
- File too large.
- Horse not found.
- Horse belongs to another owner.
- Owner role missing.
- Validation errors for date, height, weight, or gender.

Examples:

- `Horse image must be JPG, PNG, or WebP and under 5MB.`
- `Evidence document must be PDF, JPG, PNG, or WebP and under 10MB.`
- `Date of birth cannot be in the future.`
- `You can only view horses that belong to your account.`

## Visual Direction

Use a professional stable-operations style:

- White panels on light neutral background.
- Red or deep green primary action depending on the current app palette.
- Compact table rows with clear hierarchy.
- Rounded corners at 8px or less.
- Status badges with strong contrast.
- No large marketing hero section.
- No decorative blobs or oversized gradients.

The UI should feel like an operational tool for repeated daily use.

## Tests

### Frontend Tests

Add focused tests for:

- Roster renders horse rows.
- Search filters by horse name.
- Status filter works.
- Add Horse modal opens and validates required fields.
- File fields are present for image and evidence.
- Successful create shows success message and refreshes list.
- `View Profile` navigates to `/owner/horses/:id`.
- Profile shows status-specific CTA behavior.
- Profile shows Medical Documents Status inside Overview.
- Document upload modal submits metadata and file.

### Backend Tests

Add focused tests for:

- Multipart owner horse creation succeeds with valid image and evidence.
- Missing image returns validation error.
- Missing evidence returns validation error.
- Invalid file type returns validation error.
- Created horse belongs to authenticated owner.
- Created horse status is `PENDING`.
- Owner cannot fetch horse detail for another owner's horse.
- Owner can upload/list structured horse documents for their own horse.
- Owner cannot upload documents for another owner's horse.

## Implementation Order

1. Add backend multipart request and file storage service.
2. Add static serving for uploaded files.
3. Add owner horse detail endpoint.
4. Update frontend racing API to support multipart creation.
5. Redesign `/owner/horses` as roster.
6. Add Add Horse right-side panel.
7. Add `/owner/horses/:id` profile page.
8. Add structured horse document backend and UI.
9. Add frontend and backend tests.

## Acceptance Criteria

- Owner can create a horse using local image and evidence files.
- DB still stores horse photo and initial evidence paths.
- Structured medical/ownership document uploads are stored in `horse_documents`.
- New horse is always `PENDING`.
- Roster is the primary `/owner/horses` experience.
- Owner can search and filter horses.
- Owner can open a horse profile detail page.
- Profile clearly shows document cards inside Overview, health notes, approval status, and tournament registrations for that horse.
- Approved horses can be directed into tournament registration.
- Pending or rejected horses cannot be registered into tournaments.
