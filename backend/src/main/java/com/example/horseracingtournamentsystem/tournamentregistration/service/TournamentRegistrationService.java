package com.example.horseracingtournamentsystem.tournamentregistration.service;

import com.example.horseracingtournamentsystem.horse.entity.HorseDocument;
import com.example.horseracingtournamentsystem.horse.repository.HorseDocumentRepository;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.dto.request.TournamentRegistrationRequest;
import com.example.horseracingtournamentsystem.tournamentregistration.dto.response.TournamentRegistrationResponse;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TournamentRegistrationService {

    private final TournamentRegistrationRepository registrationRepository;
    private final TournamentRepository tournamentRepository;
    private final HorseRepository horseRepository;
    private final HorseDocumentRepository horseDocumentRepository;
    private final UserRepository userRepository;

    public List<TournamentRegistrationResponse> listOwnerRegistrations(String email) {
        return registrationRepository.findAllByOwnerEmailOrderByCreatedAtDesc(email.trim().toLowerCase()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<TournamentRegistrationResponse> listAdminRegistrations(String status) {
        if (status == null || status.isBlank()) {
            return registrationRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(this::mapToResponse)
                    .toList();
        }
        return registrationRepository.findAllByStatusOrderByCreatedAtDesc(status.trim().toUpperCase()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public TournamentRegistrationResponse create(String email, TournamentRegistrationRequest request) {
        User owner = findUserByEmail(email);
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(request.tournamentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        Horse horse = horseRepository.findByIdAndDeletedAtIsNull(request.horseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
        String note = normalizeNote(request.note());

        validateOwnerRegistration(owner, tournament, horse);

        TournamentRegistration registration = registrationRepository
            .findByTournament_IdAndHorse_IdAndStatusIn(
                tournament.getId(),
                horse.getId(),
                List.of("WITHDRAWN", "REJECTED"))
            .map(existing -> {
                existing.resubmit(note);
                return existing;
            })
            .orElseGet(() -> TournamentRegistration.pending(tournament, horse, owner, note));
        registrationRepository.save(registration);
        return mapToResponse(registration);
    }

    @Transactional
    public TournamentRegistrationResponse withdraw(String email, Long id) {
        TournamentRegistration registration = registrationRepository
                .findByIdAndOwnerEmail(id, email.trim().toLowerCase())
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament registration not found"));
        registration.withdraw();
        registrationRepository.save(registration);
        return mapToResponse(registration);
    }

    @Transactional
    public TournamentRegistrationResponse approve(Long id, String adminEmail) {
        TournamentRegistration registration = registrationRepository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament registration not found"));
        User reviewer = findUserByEmail(adminEmail);
        registration.approve(reviewer);
        registrationRepository.save(registration);
        return mapToResponse(registration);
    }

    @Transactional
    public TournamentRegistrationResponse reject(Long id, String adminEmail, String reason) {
        TournamentRegistration registration = registrationRepository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament registration not found"));
        User reviewer = findUserByEmail(adminEmail);
        registration.reject(reviewer, reason);
        registrationRepository.save(registration);
        return mapToResponse(registration);
    }

    private void validateOwnerRegistration(User owner, Tournament tournament, Horse horse) {
        if (!horse.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Horse does not belong to current owner");
        }
        if (!"APPROVED".equals(horse.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Horse must be approved before tournament registration");
        }
        validateRequiredMedicalDocuments(horse, tournament.getEndDate());
        if (!"OPEN_REGISTRATION".equals(tournament.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tournament is not open for registration");
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(tournament.getRegistrationStartAt()) || now.isAfter(tournament.getRegistrationEndAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration window is closed");
        }
        if (registrationRepository.existsByTournament_IdAndHorse_IdAndStatusIn(
            tournament.getId(),
            horse.getId(),
            List.of("PENDING", "APPROVED"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Horse already has a registration for this tournament");
        }
        if (tournament.getMaxHorses() != null
                && registrationRepository.countByTournament_IdAndStatus(tournament.getId(), "APPROVED") >= tournament
                        .getMaxHorses()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tournament is full");
        }
    }

    private void validateRequiredMedicalDocuments(Horse horse, LocalDate tournamentEndDate) {
        List<HorseDocument> documents = horseDocumentRepository.findAllByHorseIdAndDocumentTypeIn(
                horse.getId(),
                List.of("COGGINS", "HEALTH_CERTIFICATE"));

        boolean hasCoggins = hasDocumentType(documents, "COGGINS");
        boolean hasHealthCertificate = hasDocumentType(documents, "HEALTH_CERTIFICATE");

        if (!hasCoggins || !hasHealthCertificate) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Missing required medical documents: " + missingDocumentNames(hasCoggins, hasHealthCertificate));
        }

        boolean cogginsValid = hasValidDocumentType(documents, "COGGINS", tournamentEndDate);
        boolean healthCertificateValid = hasValidDocumentType(documents, "HEALTH_CERTIFICATE", tournamentEndDate);
        if (!cogginsValid || !healthCertificateValid) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Medical documents must be valid through the tournament end date");
        }
    }

    private boolean hasDocumentType(List<HorseDocument> documents, String documentType) {
        return documents.stream().anyMatch(document -> documentType.equals(document.getDocumentType()));
    }

    private boolean hasValidDocumentType(List<HorseDocument> documents, String documentType,
            LocalDate tournamentEndDate) {
        return documents.stream()
                .filter(document -> documentType.equals(document.getDocumentType()))
                .anyMatch(document -> !document.getExpiryDate().isBefore(tournamentEndDate));
    }

    private String missingDocumentNames(boolean hasCoggins, boolean hasHealthCertificate) {
        if (!hasCoggins && !hasHealthCertificate) {
            return "Coggins and Health Certificate";
        }
        if (!hasCoggins) {
            return "Coggins";
        }
        return "Health Certificate";
    }

    private TournamentRegistrationResponse mapToResponse(TournamentRegistration registration) {
        return TournamentRegistrationResponse.builder()
                .id(registration.getId())
                .tournamentId(registration.getTournament().getId())
                .tournamentName(registration.getTournament().getName())
                .horseId(registration.getHorse().getId())
                .horseName(registration.getHorse().getName())
                .horseImageUrl(registration.getHorse().getImageUrl())
                .horseEvidenceUrl(registration.getHorse().getEvidenceUrl())
                .ownerId(registration.getOwner().getId())
                .ownerName(registration.getOwner().getFullName())
                .note(registration.getNote())
                .status(registration.getStatus())
                .rejectionReason(registration.getRejectionReason())
                .reviewedBy(registration.getReviewedBy() == null ? null : registration.getReviewedBy().getId())
                .createdAt(registration.getCreatedAt())
                .reviewedAt(registration.getReviewedAt())
                .updatedAt(registration.getUpdatedAt())
                .withdrawnAt(registration.getWithdrawnAt())
                .build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String normalizeNote(String note) {
        return note == null || note.isBlank() ? null : note.trim();
    }
}
