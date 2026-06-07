# Design Spec: Owner Profile Application (Horse Owner)
**Date:** 2026-05-29 (Updated: 2026-05-30)
**Author:** GitHub Copilot
**Project:** Horse Racing Tournament Management System
**Status:** Approved by user (revised after spec review)

---

## 1. Overview
This spec defines the MVP design for the Horse Owner application profile at `/owner/profile`. The page is accessible to any authenticated user and serves as the application profile for the `HORSE_OWNER` role request. Admin approval happens once, via the role request review that includes the owner profile data.

---

## 2. Goals and Non-Goals
### Goals
- Provide a clear, product-grade owner profile application flow.
- Allow users to complete owner verification data and stable branding in one place.
- Keep core identity fields read-only and sourced from `/profile`.
- Support evidence upload with validation and a secure stored URL.
- Avoid duplicate approval flows: one admin approval for role request + profile.

### Non-Goals (MVP)
- Public owner page at `/owners/{ownerId}`.
- Draft mode or multi-step wizard.
- Multiple evidence documents or advanced audit log UI.
- Admin UI for reviewing role requests (assumed existing or separate workstream).

---

## 3. User Flow
1. Authenticated user opens `/owner/profile` (even without `HORSE_OWNER` role).
2. User completes owner-specific fields and submits.
3. System creates or updates:
   - `horse_owner_profiles` record with status `PENDING`
   - `role_requests` record for `HORSE_OWNER` with status `PENDING`
4. Admin opens the role request review, which displays owner profile data alongside (licenseNumber, evidenceUrl, stableName/organizationName, experienceYears, bio, logoUrl).
5. If approved (single action):
   - `roleRequest.status = APPROVED`
   - `ownerProfile.status = APPROVED`
   - `ownerProfile.approvedBy = admin`
   - `ownerProfile.approvedAt = now`
   - `ownerProfile.rejectionReason = null`
   - user gains `HORSE_OWNER` role
6. If rejected (single action):
   - `roleRequest.status = REJECTED`
   - `ownerProfile.status = REJECTED`
   - `ownerProfile.rejectionReason = reason`
   - `ownerProfile.approvedBy = null`
   - `ownerProfile.approvedAt = null`
   - do not grant `HORSE_OWNER` role

After approval, if the owner changes verification-critical fields, the owner profile resets to `PENDING` for re-review. The `HORSE_OWNER` role can remain, but owner operations must require `ownerProfile.status = APPROVED`.

---

## 4. Layout and Structure (Approach B)
### Desktop (two-column)
- **Left column (forms):**
  1) Personal Identity (read-only from `/profile`)
  2) Verification Profile
  3) Public Stable Profile
- **Right column (sticky panel):**
  1) Status Card
  2) Submission Checklist
  3) Public Preview Card
  4) Review History / Admin Review Info

### Mobile / Tablet (single-column order)
1) Status Card
2) Submission Checklist
3) Personal Identity
4) Verification Profile
5) Public Stable Profile
6) Public Preview Card
7) Review History

---

## 5. Data Fields and Rules
### 5.1 Personal Identity (read-only)
Source: `/profile`
- `fullName`
- `phone`
- `address`
- `dateOfBirth`
- `gender`

If missing, show a callout and link to `/profile`. Submission is disabled until these are complete.

### 5.2 Verification Profile (editable)
- `licenseNumber` (required)
- `experienceYears` (optional, default `0`, validate `>= 0`)
- `evidenceUrl` (required, from upload)

`experienceYears` rules:
- Optional on UI, displayed with default value `0`.
- Backend normalizes `null`/missing to `0`.
- Validate `>= 0` when provided.
- Reference information only — not a verification-critical field.
- Editing after APPROVED does **not** trigger re-review.

Evidence upload:
- Accept: PDF, JPG/JPEG, PNG
- Max size: 5MB
- UI shows a file card or preview
- No manual external URL input; `evidenceUrl` is set only from upload result

### 5.3 Public Stable Profile (editable)
- `stableName`
- `organizationName`
- `bio` (optional)
- `logoUrl` (optional)

`logoUrl` naming:
- Frontend/API field name: `logoUrl`
- Database column: `horse_owner_profiles.logo_url`
- Upload category: `STABLE_LOGO`
- Do not use `avatarUrl` in this spec.

Validation:
- At least one of `stableName` or `organizationName` is required
- `displayName = stableName || organizationName`

Public preview card shows only: displayName, bio, logoUrl, and an approved badge.
It must not display phone, address, dateOfBirth, gender, licenseNumber, evidenceUrl, or rejectionReason.

### 5.4 Edit Rules After APPROVED
- Changing `licenseNumber` or `evidenceUrl` (verification-critical fields):
  - show confirmation warning
  - set status to `PENDING`
  - clear `approvedBy`, `approvedAt`, `rejectionReason`
- Changing public fields (`stableName`, `organizationName`, `bio`, `logoUrl`):
  - keep status `APPROVED`
- Changing `experienceYears`:
  - keep status `APPROVED` (not verification-critical)

### 5.5 Suspended State
If `status = SUSPENDED`:
- page is read-only
- no submit or edit actions
- show suspended reason if available
- show message: "Your owner profile has been suspended. Please contact the administrator."

---

## 6. Submission Behavior and Status
- **No draft mode.** Main action is `Submit for verification`.
- **NOT_SUBMITTED** means the owner has not submitted a verification profile yet.
  - Backend note: no owner profile record means NOT_SUBMITTED (do not persist NOT_SUBMITTED in DB).
- **Soft-block:** users can fill the form, but submit is disabled unless all requirements are met:
  - core `/profile` complete
  - `licenseNumber` provided
  - `evidenceUrl` provided
  - `stableName` or `organizationName` provided

Note: `experienceYears` is **not** a blocking requirement for submission.

Status transitions:
- New submit -> `PENDING`
- REJECTED -> submit -> `PENDING` and clear `rejectionReason`
- PENDING -> edits keep `PENDING`
- APPROVED + verification change -> `PENDING` after confirmation

---

## 7. API Contract (MVP)
### Read
- `GET /api/v1/users/me/profile` (core identity)
- `GET /api/v1/users/me/owner-profile` (owner profile, status, review info)
  - Returns 404 if no profile exists (frontend treats as NOT_SUBMITTED)

### Create or Update (upsert)
- `PUT /api/v1/users/me/owner-profile`
  - Fields: `licenseNumber`, `experienceYears`, `evidenceUrl`, `stableName`, `organizationName`, `bio`, `logoUrl`
  - Server enforces required fields and validation
  - If no profile exists, creates one with status `PENDING`
  - If profile exists with status `REJECTED`, resets to `PENDING` and clears `rejectionReason`
  - If profile exists with status `APPROVED` and verification-critical fields change, resets to `PENDING`
  - Creates or updates linked `HORSE_OWNER` role request as `PENDING`

### File Upload
- `POST /api/v1/files/upload?category=OWNER_EVIDENCE`
  - Allowed types: PDF, JPG/JPEG, PNG
  - Max size: 5MB
  - Response: `{ url }`
  - Frontend stores `url` into `evidenceUrl`

- `POST /api/v1/files/upload?category=STABLE_LOGO`
  - Image types only (JPG/JPEG/PNG)
  - Size limit follows standard image upload rules
  - Response: `{ url }`
  - Frontend stores `url` into `logoUrl`

---

## 8. Role Request Integration

### Architecture Principle
`role_requests` is a **generic** approval workflow table for all roles. It must not contain role-specific verification data.

Role-specific verification data lives in role-specific profile tables:
- `HORSE_OWNER` → `horse_owner_profiles` (this spec)
- `JOCKEY` → `jockey_profiles` (later)
- `REFEREE` → `referee_profiles` (later)

The `role_requests` table only tracks generic workflow fields:
- `user_id`, `requested_role`, `status`, `reason`, `evidence_url` (generic/legacy — not used for HORSE_OWNER), `admin_note`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`

For `HORSE_OWNER`, do **not** write owner evidence into `role_requests.evidence_url`. Use `horse_owner_profiles.evidence_url` as the source of truth.

Do **not** add fields like `resumeUrl`, `cvReviewStatus`, `cvReviewNote`, `cvReviewedBy`, `cvReviewedAt` to `role_requests`. These are from an older/incorrect implementation drift and should be removed from the `RoleRequest` entity.

### Submit Flow
- Submit owner profile creates or updates `HORSE_OWNER` role request as `PENDING`.
- `evidenceUrl` belongs to `horse_owner_profiles`, not `role_requests`.
- The role request record is the approval workflow trigger; the owner profile stores the verification data.

### Admin Approve/Reject Flow
Admin reviews role request together with owner profile data in a single view.

**Approve (single action):**
- `roleRequest.status = APPROVED`
- `ownerProfile.status = APPROVED`
- `ownerProfile.approvedBy = admin`
- `ownerProfile.approvedAt = now`
- `ownerProfile.rejectionReason = null`
- grant `HORSE_OWNER` role

**Reject (single action):**
- `roleRequest.status = REJECTED`
- `ownerProfile.status = REJECTED`
- `ownerProfile.rejectionReason = reason`
- `ownerProfile.approvedBy = null`
- `ownerProfile.approvedAt = null`
- do not grant `HORSE_OWNER` role

### Implementation Note
`AdminRoleRequestService.approve()` and `reject()` must inject `HorseOwnerProfileRepository` and sync `ownerProfile` when `requestedRole.equals("HORSE_OWNER")`. This logic does not affect other roles (`JOCKEY`, `REFEREE`). Later, similar sync patterns can be added for `jockey_profiles` and `referee_profiles`.

### Owner Operation Guard
Owner operations (create horse, register tournaments) must require both:
- `HORSE_OWNER` role
- `ownerProfile.status = APPROVED`

---

## 9. Backend Entity Alignment (RoleRequest Cleanup)

The `RoleRequest.java` entity currently has fields that do not exist in the `role_requests` DB schema and must be removed:

| Field to Remove | Reason |
|---|---|
| `resumeUrl` | Not in DB schema. Role-specific data belongs in profile tables. |
| `cvReviewStatus` | Not in DB schema. Not part of current business flow. |
| `cvReviewNote` | Not in DB schema. Not part of current business flow. |
| `cvReviewedBy` | Not in DB schema. Not part of current business flow. |
| `cvReviewedAt` | Not in DB schema. Not part of current business flow. |

After cleanup, `RoleRequest` entity should only map to the columns defined in `role_requests`:
`id`, `user_id`, `requested_role`, `status`, `reason`, `evidence_url`, `admin_note`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`.

Services referencing removed fields (`UserRoleRequestService.submit()`, `AdminRoleRequestService.passCvReview()`) must be updated accordingly.

---

## 10. Error Handling and UX
- Loading: show skeletons or loading state for profile fetch.
- Fetch errors: inline error with retry.
- Upload errors: keep existing evidence and show validation message.
- Save errors: keep form values and show error banner.
- Warning confirm: if APPROVED and verification fields change.

---

## 11. Testing (MVP)
### Frontend
- Render each status: NOT_SUBMITTED, PENDING, APPROVED, REJECTED, SUSPENDED.
- Soft-block submit when core profile or required owner fields are missing.
- `experienceYears` not required for submission — default 0 when empty.
- Approved -> change license/evidence -> confirm -> status PENDING.
- Change public fields -> keep APPROVED.
- Change experienceYears -> keep APPROVED.
- Evidence upload validation (type/size).
- displayName priority `stableName || organizationName`.

### Backend
- Validation: missing `licenseNumber`, missing `evidenceUrl`, empty `stableName` and `organizationName`.
- `experienceYears`: null normalized to 0, negative value rejected.
- Upload validation: MIME types and max size enforced.
- Integration: submit owner profile -> role request PENDING + owner profile PENDING.
- Admin approve -> role request APPROVED, owner profile APPROVED (approvedBy/At set), role granted.
- Admin reject -> role request REJECTED, owner profile REJECTED (rejectionReason set), no role granted.
- SUSPENDED restrictions: cannot update owner profile, cannot submit for verification, and cannot perform owner operations.
- RoleRequest entity aligned with DB schema (no drift fields).

---

## 12. Out of Scope (Later Phase)
- Public owner page `/owners/{ownerId}`
- Draft mode and multi-step wizard
- Multiple evidence files
- Advanced branding and customization
- Jockey/Referee profile sync in `AdminRoleRequestService` (add when implementing those profiles)
