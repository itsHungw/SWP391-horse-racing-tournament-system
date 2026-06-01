package com.example.horseracingtournamentsystem.common.upload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class HorseFileStorageService {
    private static final Set<String> HORSE_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> HORSE_EVIDENCE_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final Map<String, String> EXTENSIONS_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "application/pdf", "pdf"
    );

    private final UploadProperties uploadProperties;

    public String storeHorseImage(Long ownerId, MultipartFile file) {
        return store(
                ownerId,
                file,
                "horses/images",
                HORSE_IMAGE_TYPES,
                uploadProperties.getHorseImageMaxBytes(),
                "Horse image must be JPG, PNG, or WebP and under 5MB."
        );
    }

    public String storeHorseEvidence(Long ownerId, MultipartFile file) {
        return store(
                ownerId,
                file,
                "horses/evidence",
                HORSE_EVIDENCE_TYPES,
                uploadProperties.getHorseEvidenceMaxBytes(),
                "Evidence document must be PDF, JPG, PNG, or WebP and under 10MB."
        );
    }

    public String storeHorseDocument(Long ownerId, MultipartFile file) {
        return store(
                ownerId,
                file,
                "horses/documents",
                HORSE_EVIDENCE_TYPES,
                uploadProperties.getHorseEvidenceMaxBytes(),
                "Document attachment must be PDF, JPG, PNG, or WebP and under 10MB."
        );
    }

    private String store(
            Long ownerId,
            MultipartFile file,
            String relativeDirectory,
            Set<String> allowedContentTypes,
            long maxBytes,
            String validationMessage
    ) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validationMessage);
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!allowedContentTypes.contains(contentType) || file.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validationMessage);
        }

        String extension = EXTENSIONS_BY_CONTENT_TYPE.get(contentType);
        String fileName = "horse-%d-%s.%s".formatted(ownerId, UUID.randomUUID(), extension);
        Path root = uploadProperties.getRoot().toAbsolutePath().normalize();
        Path directory = root.resolve(relativeDirectory).normalize();
        Path target = directory.resolve(fileName).normalize();

        if (!target.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid upload path.");
        }

        try {
            Files.createDirectories(directory);
            file.transferTo(target);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store uploaded file.");
        }

        return "/uploads/%s/%s".formatted(relativeDirectory.replace('\\', '/'), fileName);
    }
}
