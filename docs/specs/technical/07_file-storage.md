# File Storage

## 1. Purpose

File storage supports uploaded evidence such as avatars, stable logos, blog
images, horse images, horse evidence and documents, role-request resumes, owner
and referee evidence, and championship agreement files.

Files are stored in Amazon S3 (or an S3-compatible endpoint). The application
keeps only metadata in its database and serves every download through a
short-lived presigned URL. Private files are released only after an authorization
check. Implementation lives in
`backend/src/main/java/com/example/horseracingtournamentsystem/filestorage`.

## 2. Backend Configuration

S3 settings live under `aws.s3` in `application.yml`:

- `bucket-name`: target bucket (`AWS_S3_BUCKET`).
- `region`: AWS region (`AWS_REGION`, default `ap-southeast-1`).
- `presigned-url-ttl`: presigned URL lifetime (`AWS_S3_PRESIGNED_URL_TTL`,
  default 5 minutes).

Credentials resolve through the AWS default provider chain
(`DefaultCredentialsProvider`), so production uses the instance IAM role and no
static keys are stored in config.

Spring multipart limits:

- max file size: 10 MB.
- max request size: 16 MB.

The legacy `app.upload` block and the `/uploads/**` static handler remain for
backward compatibility but are no longer the active storage path.

## 3. Upload Categories

`FileStorageService` holds a fixed policy per category. Each policy fixes private
vs public, the S3 key prefix, a size limit, and the allowed content types.

| Category | Private | Max size | Allowed types |
| --- | :---: | ---: | --- |
| `AVATAR`, `STABLE_LOGO`, `BLOG`, `HORSE_IMAGE` | no | 5 MB | jpeg, png, webp |
| `OWNER_EVIDENCE`, `REFEREE_EVIDENCE`, `HORSE_EVIDENCE`, `HORSE_DOCUMENT` | yes | 10 MB | pdf, jpeg, png, webp |
| `ROLE_REQUEST_RESUME`, `JOCKEY_AGREEMENT` | yes | 10 MB | pdf |

Object keys are server-generated: `{keyPrefix}/{uuid}{extension}`. Client
filenames never build the key.

## 4. Data Model

Table `stored_files` (migration `V3__create_stored_files.sql`) is the metadata
source of truth: `filename` (unique public handle), `object_key` (unique S3 key),
`original_filename`, `category`, `content_type`, `private_file`, `file_size`,
`uploaded_by` (FK to `users`), `created_at`. URLs expose `filename`, not
`object_key`, so storage layout can change without breaking links.

## 5. APIs

Generic file controller (`/api/v1/files`):

- `POST /upload` — authenticated; params `file`, `category`; returns
  `{ "url": "/api/v1/files/download/{filename}" }` (public) or
  `.../private/{filename}` (private).
- `GET /download/{filename}` — public; `302` redirect to a presigned S3 URL;
  `404` for private files.
- `GET /private/{filename}` — authenticated; returns `{ "url": "..." }` with a
  presigned URL after authorization passes.

Horse-specific multipart APIs delegate to the generic service via
`HorseFileStorageService`:

- `POST /api/v1/owner/horses`
- `POST /api/v1/owner/horses/{id}/documents`

## 6. Authorization For Private Files

`FileAccessAuthorizationService.canRead` allows a read when the caller is an
admin, is the uploader, or is the jockey on the invitation that references a
`JOCKEY_AGREEMENT` file. All other private access returns `403`.

## 7. Storage Rules

- Files are validated by size and content type against the category policy.
- Public files are served by `302` redirect to a presigned URL.
- Private files require authorization before a presigned URL is issued.
- The database stores file metadata, never raw content.
- File references appear in horse images, evidence/document URLs, owner profile
  evidence/logo, avatars, blog images, and contract agreement URLs.
- Metadata persistence is the commit point: if it fails, the uploaded object is
  deleted (compensating delete).

## 8. Security Notes

- Do not trust client-provided filenames; object keys are server-generated UUIDs.
- Reject `/`, `\`, and `..` on filename lookups to prevent path traversal.
- `image/svg+xml` is excluded from image categories to avoid stored SVG XSS.
- Presigned downloads pin `responseContentType` and an `inline`
  `Content-Disposition`, so the stored type is enforced on serve.
- Keep private file endpoints authenticated.
- Apply upload rate limits through security configuration
  (`app.security.rate-limit.upload-limit`).

## 9. Known Limitations

Content type is validated from the client multipart header only (no magic-byte
detection yet); there is no antivirus scan; objects can be orphaned in S3 on a
caller transaction rollback. See
`docs/superpowers/specs/2026-06-10-secure-s3-file-storage-design.md` for the full
design and follow-up list.
