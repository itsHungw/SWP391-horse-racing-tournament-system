package com.example.horseracingtournamentsystem.filestorage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
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

    private static final Map<String, String> EXTENSIONS_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "application/pdf", ".pdf"
    );

    private static final Map<String, UploadPolicy> POLICIES = Map.of(
            "AVATAR", new UploadPolicy(false, IMAGE_MAX_BYTES, IMAGE_TYPES),
            "STABLE_LOGO", new UploadPolicy(false, IMAGE_MAX_BYTES, IMAGE_TYPES),
            "OWNER_EVIDENCE", new UploadPolicy(true, EVIDENCE_MAX_BYTES, Set.of(
                    "application/pdf",
                    "image/jpeg",
                    "image/png",
                    "image/webp"
            ))
    );

    private final Path publicUploadDir = Paths.get("uploads", "public").toAbsolutePath().normalize();
    private final Path privateUploadDir = Paths.get("uploads", "private").toAbsolutePath().normalize();

    private final StoredFileMetadataRepository storedFileMetadataRepository;
    private final UserRepository userRepository;

    public FileStorageService(StoredFileMetadataRepository storedFileMetadataRepository, UserRepository userRepository) {
        this.storedFileMetadataRepository = storedFileMetadataRepository;
        this.userRepository = userRepository;
        try {
            Files.createDirectories(publicUploadDir);
            Files.createDirectories(privateUploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public StoredFile storeFile(MultipartFile file, String category, String uploaderEmail) {
        String normalizedCategory = normalizeCategory(category);
        UploadPolicy policy = POLICIES.get(normalizedCategory);
        if (policy == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported upload category");
        }
        User uploader = userRepository.findByEmail(normalizeEmail(uploaderEmail))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
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
        Path root = policy.privateFile() ? privateUploadDir : publicUploadDir;
        Path targetLocation = root.resolve(filename).normalize();
        ensureInsideRoot(targetLocation, root, filename);

        try {
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }
            String url = policy.privateFile()
                    ? "/api/v1/files/private/" + filename
                    : "/api/v1/files/download/" + filename;
            storedFileMetadataRepository.save(StoredFileMetadata.create(
                    filename,
                    normalizedCategory,
                    contentType,
                    policy.privateFile(),
                    uploader
            ));
            return new StoredFile(filename, url, contentType, policy.privateFile());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + filename, e);
        }
    }

    public Path loadPublicFile(String filename) {
        return loadFile(filename, publicUploadDir);
    }

    public Path loadPrivateFile(String filename) {
        return loadFile(filename, privateUploadDir);
    }

    public void assertCanReadPrivateFile(String filename, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }
        String safeFilename = normalizeFilename(filename);
        StoredFileMetadata metadata = storedFileMetadataRepository.findByFilename(safeFilename)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        if (!metadata.isPrivateFile()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is not private");
        }
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        boolean uploader = metadata.getUploadedBy().getEmail().equalsIgnoreCase(authentication.getName());
        if (!admin && !uploader) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this file");
        }
    }

    private Path loadFile(String filename, Path root) {
        String safeFilename = normalizeFilename(filename);
        Path filePath = root.resolve(safeFilename).normalize();
        ensureInsideRoot(filePath, root, safeFilename);
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
        return filePath;
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

    private void ensureInsideRoot(Path path, Path root, String filename) {
        if (!path.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name: " + filename);
        }
    }

    public record StoredFile(String filename, String url, String contentType, boolean privateFile) {
    }

    private record UploadPolicy(boolean privateFile, long maxBytes, Set<String> allowedContentTypes) {
    }
}
