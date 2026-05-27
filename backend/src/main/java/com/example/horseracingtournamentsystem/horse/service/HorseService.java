package com.example.horseracingtournamentsystem.horse.service;

import com.example.horseracingtournamentsystem.horse.dto.request.HorseRequest;
import com.example.horseracingtournamentsystem.horse.dto.request.OwnerHorseRequest;
import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
    private final UserRepository userRepository;

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
        String code = normalizeRegistrationCode(req.registrationCode());
        Horse horse = Horse.submitForReview(owner, req, code);
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

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String normalizeRegistrationCode(String registrationCode) {
        if (registrationCode == null || registrationCode.isBlank()) {
            return "HORSE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        return registrationCode.trim();
    }
}
