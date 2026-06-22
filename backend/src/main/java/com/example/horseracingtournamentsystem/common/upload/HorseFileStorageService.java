package com.example.horseracingtournamentsystem.common.upload;

import com.example.horseracingtournamentsystem.filestorage.FileStorageService;
import java.util.Locale;
import java.util.Set;
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
    private final UploadProperties uploadProperties;
    private final FileStorageService fileStorageService;

    public String storeHorseImage(Long ownerId, MultipartFile file) {
        return store(
                ownerId,
                file,
                "HORSE_IMAGE",
                HORSE_IMAGE_TYPES,
                uploadProperties.getHorseImageMaxBytes(),
                "Horse image must be JPG, PNG, or WebP and under 5MB."
        );
    }

    public String storeHorseEvidence(Long ownerId, MultipartFile file) {
        return store(
                ownerId,
                file,
                "HORSE_EVIDENCE",
                HORSE_EVIDENCE_TYPES,
                uploadProperties.getHorseEvidenceMaxBytes(),
                "Evidence document must be PDF, JPG, PNG, or WebP and under 10MB."
        );
    }

    public String storeHorseDocument(Long ownerId, MultipartFile file) {
        return store(
                ownerId,
                file,
                "HORSE_DOCUMENT",
                HORSE_EVIDENCE_TYPES,
                uploadProperties.getHorseEvidenceMaxBytes(),
                "Document attachment must be PDF, JPG, PNG, or WebP and under 10MB."
        );
    }

    private String store(
            Long ownerId,
            MultipartFile file,
            String category,
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

        return fileStorageService.storeFileForUserId(file, category, ownerId).url();
    }
}
