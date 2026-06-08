# File Storage

## 1. Purpose

File storage supports uploaded evidence such as horse images, horse evidence files, horse documents, and agreement files referenced by championship contracts.

## 2. Backend Configuration

Configuration lives under `app.upload` in `application.yml`:

- `root`: upload root directory, default `uploads`.
- `horse-image-max-bytes`: default 5 MB.
- `horse-evidence-max-bytes`: default 10 MB.

Spring multipart limits:

- max file size: 10 MB.
- max request size: 16 MB.

## 3. APIs

Generic file controller:

- `POST /api/v1/files/upload`
- `GET /api/v1/files/download/{filename}`
- `GET /api/v1/files/private/{filename}`

Horse-specific multipart APIs:

- `POST /api/v1/owner/horses`
- `POST /api/v1/owner/horses/{id}/documents`

## 4. Storage Rules

- Uploaded files should be validated by size and expected use case.
- Public files can be served through download endpoints.
- Private files should require authorization.
- Database records store file URL/path metadata rather than raw file content.
- File references appear in horse images, evidence URLs, document URLs, owner profile evidence/logo, and contract agreement URLs.

## 5. Security Notes

- Do not trust client-provided filenames.
- Prevent path traversal when resolving file paths.
- Keep private file endpoints protected.
- Apply upload rate limits through security configuration.
