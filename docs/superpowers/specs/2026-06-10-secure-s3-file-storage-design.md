# Secure S3 File Storage Design

## Purpose

Replace the local-disk upload model with an S3-backed file storage service that
keeps private documents off public URLs and serves every download through
short-lived, authorization-checked presigned URLs.

This design covers:

- A single generic storage service that all upload categories share.
- An object-storage abstraction so the implementation can target Amazon S3 (or a
  compatible endpoint) without leaking SDK details into callers.
- A metadata table that is the source of truth for every stored object.
- Public vs private file separation with per-category upload policies.
- Authorization rules for reading private files.

This design does not implement antivirus scanning, image re-encoding, magic-byte
content sniffing, or orphan-object garbage collection. Those are tracked as
follow-ups in the Known Limitations section.

## Current Project Context

- Backend: Spring Boot under
  `backend/src/main/java/com/example/horseracingtournamentsystem`.
- Storage package: `filestorage/`.
- Horse-specific façade: `common/upload/HorseFileStorageService.java`.
- Security rules: `security/SecurityConfig.java`,
  `security/RateLimitingFilter.java`.
- Migrations: `backend/src/main/resources/db/migration`.
- Frontend: React/Vite under `frontend/src`; private downloads handled by
  `components/AuthenticatedFileLink.tsx`.

Before this change, uploads were written to a local `uploads/` directory and
served as static resources. That model does not work across multiple instances,
cannot protect private documents, and ties file lifetime to a single host's disk.

## Architecture

```
Caller (controller / HorseFileStorageService)
        │  MultipartFile + category + uploader
        ▼
FileStorageService            ── validation, policy lookup, metadata persistence
        │
        ├── ObjectStorage (interface)
        │        └── S3ObjectStorage ── putObject / deleteObject / presign GET
        │
        └── StoredFileMetadataRepository ── stored_files table
```

- `ObjectStorage` is the abstraction: `upload`, `delete`,
  `createPresignedGetUrl`. Callers never touch the AWS SDK.
- `S3ObjectStorage` implements it with `S3Client` + `S3Presigner`.
- `S3Configuration` builds both beans using `DefaultCredentialsProvider`, so
  production resolves credentials from the instance IAM role (no static keys in
  config).
- `S3Properties` binds `aws.s3.bucket-name`, `aws.s3.region`,
  `aws.s3.presigned-url-ttl`.

## Upload Categories And Policies

`FileStorageService` keeps a fixed policy map. Each category fixes whether the
file is private, its S3 key prefix, a size limit, and an allowed content-type
set.

| Category | Private | Key prefix | Max size | Allowed types |
| --- | :---: | --- | ---: | --- |
| `AVATAR` | no | `public/avatars` | 5 MB | jpeg, png, webp |
| `STABLE_LOGO` | no | `public/stable-logos` | 5 MB | jpeg, png, webp |
| `BLOG` | no | `public/blog` | 5 MB | jpeg, png, webp |
| `HORSE_IMAGE` | no | `public/horses/images` | 5 MB | jpeg, png, webp |
| `OWNER_EVIDENCE` | yes | `private/owner-evidence` | 10 MB | pdf, jpeg, png, webp |
| `REFEREE_EVIDENCE` | yes | `private/referee-evidence` | 10 MB | pdf, jpeg, png, webp |
| `ROLE_REQUEST_RESUME` | yes | `private/role-resumes` | 10 MB | pdf |
| `JOCKEY_AGREEMENT` | yes | `private/jockey-agreements` | 10 MB | pdf |
| `HORSE_EVIDENCE` | yes | `private/horses/evidence` | 10 MB | pdf, jpeg, png, webp |
| `HORSE_DOCUMENT` | yes | `private/horses/documents` | 10 MB | pdf, jpeg, png, webp |

Stored object keys are server-generated: `{keyPrefix}/{uuid}{extension}`. The
client filename is never used to build the key.

## Database Design

Migration `V3__create_stored_files.sql` adds `stored_files`, the metadata source
of truth. It is written idempotently (create-if-missing plus additive column
guards) so reruns and partially migrated databases converge safely.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint identity | PK |
| `filename` | nvarchar(120) | unique; the public-facing handle (`{uuid}{ext}`) |
| `object_key` | nvarchar(500) | unique; real S3 key |
| `original_filename` | nvarchar(255) | sanitized client name for download disposition |
| `category` | nvarchar(50) | upload category |
| `content_type` | nvarchar(100) | validated MIME type |
| `private_file` | bit | drives which download endpoint applies |
| `file_size` | bigint | stored byte count |
| `uploaded_by` | bigint FK → users(id) | owner for authorization checks |
| `created_at` | datetime2 | upload timestamp |

`filename` (not `object_key`) is the value exposed in URLs, so the storage layout
can change without breaking existing links.

## APIs

`FileStorageController` under `/api/v1/files`:

- `POST /upload` — authenticated. Body: `file`, `category`. Returns
  `{ "url": "..." }` where the URL is `/api/v1/files/download/{filename}` for
  public files or `/api/v1/files/private/{filename}` for private files.
- `GET /download/{filename}` — public, permit-all. Returns `302` redirect to a
  presigned S3 GET URL. Rejects private files with `404`.
- `GET /private/{filename}` — authenticated. Returns `{ "url": "..." }` with a
  presigned URL, only after the authorization check passes.

Horse multipart endpoints continue to exist and now delegate to the generic
service through `HorseFileStorageService` (`storeHorseImage`,
`storeHorseEvidence`, `storeHorseDocument`).

## Authorization For Private Files

`FileAccessAuthorizationService.canRead` grants read access when any holds:

1. The caller has `ROLE_ADMIN`.
2. The caller is the uploader (`uploaded_by` email matches).
3. The file is a `JOCKEY_AGREEMENT` and the caller is the jockey on the matching
   invitation (`invitationRepository.existsByAgreementUrlAndJockey_Email`).

All other private access is denied with `403`. Public files never pass through
this check.

## Validation And Hardening

Performed in `FileStorageService` and `S3ObjectStorage`:

- Size enforced against the per-category limit; empty files rejected.
- Content type normalized (strip parameters, lowercase) and checked against the
  category whitelist. `image/svg+xml` is deliberately excluded to avoid
  SVG-based stored XSS.
- Filename normalized on lookup: reject `/`, `\`, and `..` to block path
  traversal. Object keys are server-generated UUIDs.
- Original filename sanitized (strip path, CR/LF, quotes; capped at 255 chars)
  before it is used in the download `Content-Disposition`.
- Presigned GET pins `responseContentType` and
  `Content-Disposition: inline; filename="..."`, so downloads are served with the
  stored type, not a client-chosen one.
- Metadata persistence is the commit point: if the row fails to save, the object
  just uploaded is deleted (compensating delete) to avoid metadata-less objects.
- Upload rate limiting applies to `POST /api/v1/files/upload` via
  `RateLimitingFilter` (`app.security.rate-limit.upload-limit`).

## Configuration

`application.yml`:

```yaml
aws:
  s3:
    bucket-name: ${AWS_S3_BUCKET:...}
    region: ${AWS_REGION:ap-southeast-1}
    presigned-url-ttl: ${AWS_S3_PRESIGNED_URL_TTL:5m}
```

Presigned URL lifetime defaults to 5 minutes. Credentials come from the default
provider chain (IAM role in production).

## Frontend

`AuthenticatedFileLink` wraps an anchor. For `/api/v1/files/private/...` hrefs it
intercepts the click, calls the private endpoint through the authenticated HTTP
client to obtain a presigned URL, and opens that URL in a new tab (with
`opener = null`). Public hrefs behave as normal links. Pages using it:
admin horses, admin role-request detail, jockey contracts, owner horse profile,
owner tournament registrations, referee profile dashboard, and my-role-requests.

## Testing

- `S3ObjectStorageTest` — presign request shape, disposition sanitization.
- `FileStorageServiceS3Test` — policy validation, key generation, compensating
  delete on metadata failure.
- `FileAccessAuthorizationServiceTest` — admin / uploader / jockey-agreement
  paths.
- `FileStorageSecurityIntegrationTest` — endpoint auth, public vs private, path
  traversal rejection.
- `HorseFileStorageServiceTest` — horse façade validation.
- `FlywayMigrationNamingTest` — migration naming/order guard.

## Known Limitations (Follow-Ups)

These were accepted for the initial merge and should be addressed before a
production release:

1. Content type is validated from the client-supplied multipart header only;
   add magic-byte detection (e.g. Apache Tika) for true content validation.
2. No antivirus scanning of evidence/agreement uploads.
3. Objects can be orphaned in S3 if a surrounding caller transaction rolls back
   after upload; needs a cleanup job or post-commit upload.
4. The legacy `/uploads/**` static handler and permit-all rule remain and should
   be removed now that nothing writes to local disk.
5. The default bucket name fallback should be removed so a missing
   `AWS_S3_BUCKET` fails fast instead of writing to a shared bucket.
6. Environments share one bucket by default; each environment should pair its own
   database with its own bucket (or key prefix).
