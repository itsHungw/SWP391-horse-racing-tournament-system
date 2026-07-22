package com.example.horseracingtournamentsystem.filestorage;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private static final long IMAGE_MAX_BYTES = 5L * 1024L * 1024L;
    private static final long EVIDENCE_MAX_BYTES = 10L * 1024L * 1024L;

    private static final Set<String> IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final Set<String> EVIDENCE_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final Set<String> PDF_TYPES = Set.of("application/pdf");

    private static final Map<String, String> EXTENSIONS_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "application/pdf", ".pdf"
    );

    private static final Map<String, UploadPolicy> POLICIES = Map.ofEntries(
            Map.entry("AVATAR", new UploadPolicy(false, "public/avatars", IMAGE_MAX_BYTES, IMAGE_TYPES)),
            Map.entry("STABLE_LOGO", new UploadPolicy(false, "public/stable-logos", IMAGE_MAX_BYTES, IMAGE_TYPES)),
            Map.entry("OWNER_EVIDENCE", new UploadPolicy(true, "private/owner-evidence", EVIDENCE_MAX_BYTES, EVIDENCE_TYPES)),
            Map.entry("REFEREE_EVIDENCE", new UploadPolicy(true, "private/referee-evidence", EVIDENCE_MAX_BYTES, EVIDENCE_TYPES)),
            Map.entry("ROLE_REQUEST_RESUME", new UploadPolicy(true, "private/role-resumes", EVIDENCE_MAX_BYTES, PDF_TYPES)),
            Map.entry("JOCKEY_AGREEMENT", new UploadPolicy(true, "private/jockey-agreements", EVIDENCE_MAX_BYTES, PDF_TYPES)),
            Map.entry("BLOG", new UploadPolicy(false, "public/blog", IMAGE_MAX_BYTES, IMAGE_TYPES)),
            Map.entry("HORSE_IMAGE", new UploadPolicy(false, "public/horses/images", IMAGE_MAX_BYTES, IMAGE_TYPES)),
            Map.entry("HORSE_EVIDENCE", new UploadPolicy(true, "private/horses/evidence", EVIDENCE_MAX_BYTES, EVIDENCE_TYPES)),
            Map.entry("HORSE_DOCUMENT", new UploadPolicy(true, "private/horses/documents", EVIDENCE_MAX_BYTES, EVIDENCE_TYPES)),
            Map.entry("ORGANIZER_LICENSE", new UploadPolicy(true, "private/organizer-licenses", EVIDENCE_MAX_BYTES, EVIDENCE_TYPES)),
            Map.entry("ORGANIZER_LOGO", new UploadPolicy(false, "public/organizer-logos", IMAGE_MAX_BYTES, IMAGE_TYPES)),
            Map.entry("DISPUTE_EVIDENCE", new UploadPolicy(true, "private/disputes/evidence", EVIDENCE_MAX_BYTES, EVIDENCE_TYPES)),
            Map.entry("WITHDRAWAL_RECEIPT", new UploadPolicy(true, "private/withdrawal-receipts", IMAGE_MAX_BYTES, IMAGE_TYPES))
    );

    private final ObjectStorage objectStorage;
    private final StoredFileMetadataRepository storedFileMetadataRepository;
    private final UserRepository userRepository;
    private final FileAccessAuthorizationService accessAuthorizationService;

    public FileStorageService(
            ObjectStorage objectStorage,
            StoredFileMetadataRepository storedFileMetadataRepository,
            UserRepository userRepository,
            FileAccessAuthorizationService accessAuthorizationService
    ) {
        this.objectStorage = objectStorage;
        this.storedFileMetadataRepository = storedFileMetadataRepository;
        this.userRepository = userRepository;
        this.accessAuthorizationService = accessAuthorizationService;
    }

    public StoredFile storeFile(MultipartFile file, String category, String uploaderEmail) {
        User uploader = userRepository.findByEmail(normalizeEmail(uploaderEmail))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        return storeFile(file, category, uploader);
    }

    public StoredFile storeFileForUserId(MultipartFile file, String category, Long uploaderId) {
        User uploader = userRepository.findById(uploaderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        return storeFile(file, category, uploader);
    }

    private StoredFile storeFile(MultipartFile file, String category, User uploader) {
        String normalizedCategory = normalizeCategory(category);
        UploadPolicy policy = POLICIES.get(normalizedCategory);
        if (policy == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported upload category");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }
        if (file.getSize() > policy.maxBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is too large for " + normalizedCategory);
        }

        String contentType = normalizeContentType(file.getContentType());
        if (!policy.allowedContentTypes().contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file type for " + normalizedCategory);
        }

        String extension = EXTENSIONS_BY_CONTENT_TYPE.get(contentType);
        String filename = UUID.randomUUID() + extension;
        String objectKey = policy.keyPrefix() + "/" + filename;
        String originalFilename = normalizeOriginalFilename(file.getOriginalFilename(), filename);

        try {
            try (InputStream inputStream = file.getInputStream()) {
                objectStorage.upload(objectKey, inputStream, file.getSize(), contentType);
            }
            String url = policy.privateFile()
                    ? "/api/v1/files/private/" + filename
                    : "/api/v1/files/download/" + filename;
            try {
                storedFileMetadataRepository.save(StoredFileMetadata.create(
                        filename,
                        objectKey,
                        originalFilename,
                        normalizedCategory,
                        contentType,
                        policy.privateFile(),
                        file.getSize(),
                        uploader
                ));
            } catch (RuntimeException exception) {
                objectStorage.delete(objectKey);
                throw exception;
            }
            return new StoredFile(filename, url, contentType, policy.privateFile());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + filename, e);
        }
    }

    public URI createPublicDownloadUrl(String filename) {
        StoredFileMetadata metadata = findMetadata(filename);
        if (metadata.isPrivateFile()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
        return createPresignedUrl(metadata);
    }

    public URI createPrivateDownloadUrl(String filename, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }
        StoredFileMetadata metadata = findMetadata(filename);
        if (!metadata.isPrivateFile()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is not private");
        }
        if (!accessAuthorizationService.canRead(metadata, authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this file");
        }
        return createPresignedUrl(metadata);
    }

    @Transactional
    public void deleteStoredFile(String filename) {
        StoredFileMetadata metadata = findMetadata(filename);
        objectStorage.delete(metadata.getObjectKey());
        storedFileMetadataRepository.delete(metadata);
    }

    private StoredFileMetadata findMetadata(String filename) {
        String safeFilename = normalizeFilename(filename);
        return storedFileMetadataRepository.findByFilename(safeFilename)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
    }

    private URI createPresignedUrl(StoredFileMetadata metadata) {
        return objectStorage.createPresignedGetUrl(
                metadata.getObjectKey(),
                metadata.getContentType(),
                metadata.getOriginalFilename()
        );
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "AVATAR";
        }
        return category.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "";
        }
        int separator = contentType.indexOf(';');
        String baseType = separator >= 0 ? contentType.substring(0, separator) : contentType;
        return baseType.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name is required");
        }
        String safeFilename = filename.trim();
        if (safeFilename.contains("/") || safeFilename.contains("\\") || safeFilename.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
        }
        return safeFilename;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOriginalFilename(String originalFilename, String fallback) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return fallback;
        }
        String normalized = originalFilename.replace("\\", "/");
        int separator = normalized.lastIndexOf('/');
        String basename = separator >= 0 ? normalized.substring(separator + 1) : normalized;
        String safeName = basename.replace("\r", "").replace("\n", "").replace("\"", "_").trim();
        if (safeName.isBlank()) {
            return fallback;
        }
        return safeName.length() <= 255 ? safeName : safeName.substring(safeName.length() - 255);
    }

    public record StoredFile(String filename, String url, String contentType, boolean privateFile) {
    }

    private record UploadPolicy(
            boolean privateFile,
            String keyPrefix,
            long maxBytes,
            Set<String> allowedContentTypes
    ) {
    }
}
