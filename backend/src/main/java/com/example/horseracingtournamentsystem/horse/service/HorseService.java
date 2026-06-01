package com.example.horseracingtournamentsystem.horse.service;

import com.example.horseracingtournamentsystem.common.upload.HorseFileStorageService;
import com.example.horseracingtournamentsystem.horse.dto.request.HorseRequest;
import com.example.horseracingtournamentsystem.horse.dto.request.OwnerHorseDocumentMultipartRequest;
import com.example.horseracingtournamentsystem.horse.dto.request.OwnerHorseMultipartRequest;
import com.example.horseracingtournamentsystem.horse.dto.request.OwnerHorseRequest;
import com.example.horseracingtournamentsystem.horse.dto.response.HorseDocumentResponse;
import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.entity.HorseDocument;
import com.example.horseracingtournamentsystem.horse.repository.HorseDocumentRepository;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HorseService {

    private final HorseRepository horseRepository;
    private final HorseDocumentRepository horseDocumentRepository;
    private final UserRepository userRepository;
    private final HorseFileStorageService horseFileStorageService;

    @Transactional
    public HorseResponse createHorse(HorseRequest req) {
        User owner = userRepository.findById(req.getOwnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        String code = "HORSE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Horse horse = Horse.create(
                owner, req.getName(), code, req.getBreed(),
                req.getGender().toUpperCase(), req.getDateOfBirth(), req.getColor()
        );

        horseRepository.save(horse);
        return mapToResponse(horse);
    }

    @Transactional
    public HorseResponse createOwnerHorse(String email, OwnerHorseRequest req) {
        User owner = findUserByEmail(email);
        String code = normalizeRegistrationCode(null);
        Horse horse = Horse.submitForReview(owner, req, code);
        horseRepository.save(horse);
        return mapToResponse(horse);
    }

    @Transactional
    public HorseResponse createOwnerHorse(String email, OwnerHorseMultipartRequest req) {
        User owner = findUserByEmail(email);
        String imageUrl = horseFileStorageService.storeHorseImage(owner.getId(), req.getImageFile());
        String evidenceUrl = horseFileStorageService.storeHorseEvidence(owner.getId(), req.getEvidenceFile());
        OwnerHorseRequest ownerHorseRequest = req.toOwnerHorseRequest(imageUrl, evidenceUrl);
        String code = normalizeRegistrationCode(null);
        Horse horse = Horse.submitForReview(owner, ownerHorseRequest, code);
        horseRepository.save(horse);
        return mapToResponse(horse);
    }

    @Transactional
    public HorseResponse updateHorse(Long id, HorseRequest req) {
        Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));

        User owner = userRepository.findById(req.getOwnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        horse.update(req.getName(), req.getBreed(), req.getGender().toUpperCase(), req.getDateOfBirth(), req.getColor());
        horseRepository.save(horse);
        return mapToResponse(horse);
    }

    @Transactional
    public void deleteHorse(Long id) {
        Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
        horse.setInactive();
        horse.softDelete();
        horseRepository.save(horse);
    }

    public HorseResponse getHorseDetail(Long id) {
        Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
        return mapToResponse(horse);
    }

    public List<HorseResponse> getAdminHorses() {
        return horseRepository.findAllByDeletedAtIsNull().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<HorseResponse> getAdminHorses(String status) {
        if (status == null || status.isBlank()) {
            return getAdminHorses();
        }
        return horseRepository.findAllByStatusAndDeletedAtIsNull(status.trim().toUpperCase()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<HorseResponse> getOwnerHorses(String email) {
        return horseRepository.findAllByOwnerEmailAndDeletedAtIsNullOrderByCreatedAtDesc(email.trim().toLowerCase()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<HorseResponse> getOwnerHorses(String email, String query, String status, String gender, Pageable pageable) {
        return horseRepository.searchOwnerHorses(
                        email.trim().toLowerCase(),
                        normalizeOptional(query),
                        normalizeEnumFilter(status),
                        normalizeEnumFilter(gender),
                        pageable
                )
                .map(this::mapToResponse);
    }

    public HorseResponse getOwnerHorseDetail(String email, Long id) {
        Horse horse = horseRepository.findByIdAndOwnerEmailAndDeletedAtIsNull(id, email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
        return mapToResponse(horse);
    }

    public List<HorseDocumentResponse> getOwnerHorseDocuments(String email, Long horseId) {
        requireOwnedHorse(email, horseId);
        return horseDocumentRepository.findAllByHorseIdAndHorseOwnerEmailOrderByCreatedAtDesc(
                        horseId,
                        email.trim().toLowerCase()
                ).stream()
                .map(this::mapDocumentToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public HorseDocumentResponse createOwnerHorseDocument(
            String email,
            Long horseId,
            OwnerHorseDocumentMultipartRequest request
    ) {
        User owner = findUserByEmail(email);
        Horse horse = requireOwnedHorse(email, horseId);
        if (request.getExpiryDate().isBefore(request.getIssueDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiry date must be on or after issue date.");
        }

        String fileUrl = horseFileStorageService.storeHorseDocument(owner.getId(), request.getDocumentFile());
        HorseDocument document = HorseDocument.create(
                horse,
                owner,
                request.getDocumentType(),
                request.getReferenceNumber().trim(),
                request.getIssueDate(),
                request.getExpiryDate(),
                request.getIssuer().trim(),
                fileUrl,
                normalizeOptional(request.getNotes())
        );
        horseDocumentRepository.save(document);
        return mapDocumentToResponse(document);
    }

    @Transactional
    public HorseResponse approveHorse(Long id, String adminEmail) {
        Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
        User reviewer = findUserByEmail(adminEmail);
        horse.approve(reviewer);
        horseRepository.save(horse);
        return mapToResponse(horse);
    }

    @Transactional
    public HorseResponse rejectHorse(Long id, String adminEmail, String reason) {
        Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
        findUserByEmail(adminEmail);
        horse.reject(reason);
        horseRepository.save(horse);
        return mapToResponse(horse);
    }

    public List<HorseResponse> getPublicHorses() {
        return horseRepository.findAllByStatusAndDeletedAtIsNull("APPROVED").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public HorseResponse getPublicHorseDetail(Long id) {
        Horse horse = horseRepository.findByIdAndStatusAndDeletedAtIsNull(id, "APPROVED")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Active horse not found"));
        return mapToResponse(horse);
    }

    private HorseResponse mapToResponse(Horse h) {
        return HorseResponse.builder()
                .id(h.getId())
                .ownerId(h.getOwner().getId())
                .ownerName(h.getOwner().getFullName())
                .name(h.getName())
                .registrationCode(h.getRegistrationCode())
                .breed(h.getBreed())
                .gender(h.getGender())
                .dateOfBirth(h.getDateOfBirth())
                .color(h.getColor())
                .heightCm(h.getHeightCm())
                .weightKg(h.getWeightKg())
                .healthStatus(h.getHealthStatus())
                .imageUrl(h.getImageUrl())
                .evidenceUrl(h.getEvidenceUrl())
                .medicalNote(h.getMedicalNote())
                .description(h.getDescription())
                .status(h.getStatus())
                .rejectionReason(h.getRejectionReason())
                .approvedBy(h.getApprovedBy() == null ? null : h.getApprovedBy().getId())
                .approvedAt(h.getApprovedAt())
                .createdAt(h.getCreatedAt())
                .updatedAt(h.getUpdatedAt())
                .build();
    }

    private HorseDocumentResponse mapDocumentToResponse(HorseDocument document) {
        return HorseDocumentResponse.builder()
                .id(document.getId())
                .horseId(document.getHorse().getId())
                .horseName(document.getHorse().getName())
                .documentType(document.getDocumentType())
                .referenceNumber(document.getReferenceNumber())
                .issueDate(document.getIssueDate())
                .expiryDate(document.getExpiryDate())
                .issuer(document.getIssuer())
                .fileUrl(document.getFileUrl())
                .notes(document.getNotes())
                .createdAt(document.getCreatedAt())
                .build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Horse requireOwnedHorse(String email, Long horseId) {
        return horseRepository.findByIdAndOwnerEmailAndDeletedAtIsNull(horseId, email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
    }

    private String normalizeRegistrationCode(String registrationCode) {
        if (registrationCode == null || registrationCode.isBlank()) {
            return "HORSE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        return registrationCode.trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeEnumFilter(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value.trim())) {
            return null;
        }
        return value.trim().toUpperCase();
    }
}
