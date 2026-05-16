# File Storage Specification

---

## 1. Overview

| Môi trường | Strategy | Path / Service |
|-----------|----------|---------------|
| **Development** | Local file system | `./uploads/` relative to project root |
| **Production** | Cloud storage (S3, MinIO, Cloudflare R2) | Configurable via properties |

---

## 2. File Categories

| Category | Allowed Types | Max Size | Thư mục |
|----------|--------------|----------|---------|
| **Avatar** | jpg, jpeg, png, webp | 2 MB | `/uploads/avatars/` |
| **Horse Image** | jpg, jpeg, png, webp | 5 MB | `/uploads/horses/` |
| **Tournament Banner** | jpg, jpeg, png, webp | 5 MB | `/uploads/banners/` |
| **Evidence (PDF)** | pdf, jpg, jpeg, png | 10 MB | `/uploads/evidence/` |

---

## 3. File Naming Convention

```
{category}/{userId}_{timestamp}_{originalName}.{ext}

Ví dụ:
uploads/avatars/12_1715700000_avatar.jpg
uploads/horses/12_1715700000_thunder.png
uploads/evidence/15_1715700000_jockey_license.pdf
uploads/banners/1_1715700000_spring_cup.jpg
```

---

## 4. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/files/upload` | Yes | Upload single file |
| POST | `/api/files/upload-multiple` | Yes | Upload multiple files (max 5) |
| GET | `/api/files/{category}/{filename}` | No* | Serve file |
| DELETE | `/api/files/{category}/{filename}` | Yes | Delete file (owner only) |

> *Public files (horse images, banners) không cần auth. Evidence files cần auth.

### Upload Request
```
POST /api/files/upload
Content-Type: multipart/form-data

category: "horses"
file: (binary)
```

### Upload Response
```json
{
  "success": true,
  "data": {
    "fileName": "12_1715700000_thunder.png",
    "fileUrl": "/api/files/horses/12_1715700000_thunder.png",
    "fileSize": 245000,
    "fileType": "image/png"
  }
}
```

---

## 5. Backend Implementation Design

### Interface (Strategy Pattern)
```java
public interface FileStorageService {
    FileUploadResponse upload(MultipartFile file, String category);
    Resource loadFile(String category, String filename);
    void deleteFile(String category, String filename);
    boolean fileExists(String category, String filename);
}
```

### Local Implementation
```java
@Service
@Profile("dev")
public class LocalFileStorageService implements FileStorageService {
    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;
    // ... save to local filesystem
}
```

### Cloud Implementation (Sprint 2+)
```java
@Service
@Profile("prod")
public class S3FileStorageService implements FileStorageService {
    // ... save to S3/MinIO
}
```

### Configuration
```yaml
# application-dev.yml
file:
  upload-dir: ./uploads
  max-size: 10485760  # 10MB
  allowed-types:
    avatar: image/jpeg,image/png,image/webp
    horse: image/jpeg,image/png,image/webp
    banner: image/jpeg,image/png,image/webp
    evidence: image/jpeg,image/png,application/pdf

# application-prod.yml
file:
  storage-type: s3
  s3:
    bucket: horse-racing-files
    region: ap-southeast-1
```

---

## 6. Validation Rules

| Check | Action |
|-------|--------|
| File size > max | Reject with `FILE_TOO_LARGE` error |
| File type not allowed | Reject with `INVALID_FILE_TYPE` error |
| No file provided | Reject with `FILE_REQUIRED` error |
| File name contains path traversal (`../`) | Reject with `INVALID_FILE_NAME` error |
| Category not recognized | Reject with `INVALID_CATEGORY` error |

---

## 7. Frontend Upload Component

```jsx
// Component nhận onUpload callback, trả về fileUrl
<FileUpload
  category="horses"
  accept="image/jpeg,image/png"
  maxSize={5 * 1024 * 1024}
  onUpload={(fileUrl) => setFormData({...formData, imageUrl: fileUrl})}
/>
```
