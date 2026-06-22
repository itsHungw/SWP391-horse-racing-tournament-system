package com.example.horseracingtournamentsystem.tournamentregistration.service;

import com.example.horseracingtournamentsystem.horse.entity.HorseDocument;
import com.example.horseracingtournamentsystem.horse.repository.HorseDocumentRepository;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.dto.request.TournamentRegistrationRequest;
import com.example.horseracingtournamentsystem.tournamentregistration.dto.response.TournamentRegistrationResponse;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.enums.RegistrationStatus;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.notification.service.NotificationService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    private final NotificationService notificationService;

    public List<TournamentRegistrationResponse> listOwnerRegistrations(String email) {
        return registrationRepository.findAllByOwnerEmailOrderByCreatedAtDesc(email.trim().toLowerCase()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public Page<TournamentRegistrationResponse> listOwnerRegistrations(
            String email,
            Long horseId,
            Long focusId,
            Pageable pageable
    ) {
        String ownerEmail = email.trim().toLowerCase();
        Pageable effectivePageable = focusId == null
                ? pageable
                : pageableForFocusedRegistration(ownerEmail, horseId, focusId, pageable);

        Page<TournamentRegistration> registrations = horseId == null
                ? registrationRepository.findAllByOwnerEmail(ownerEmail, effectivePageable)
                : registrationRepository.findAllByOwnerEmailAndHorseId(ownerEmail, horseId, effectivePageable);
        return registrations.map(this::mapToResponse);
    }

    public List<TournamentRegistrationResponse> listAdminRegistrations(String status) {
        if (status == null || status.isBlank()) {
            return registrationRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(this::mapToResponse)
                    .toList();
        }
        RegistrationStatus registrationStatus;
        try {
            registrationStatus = RegistrationStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid registration status");
        }
        return registrationRepository.findAllByStatusOrderByCreatedAtDesc(registrationStatus).stream()
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

        // BR-11: chủ tổ chức sở hữu giải KHÔNG được đăng ký ngựa dự chính giải của mình (xung đột lợi ích).
        if (tournament.isManagedBy(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You cannot enter a tournament owned by your own organization (BR-11)");
        }

        validateOwnerRegistration(owner, tournament, horse);

        TournamentRegistration registration = registrationRepository
            .findByTournament_IdAndHorse_IdAndStatusIn(
                tournament.getId(),
                horse.getId(),
                List.of(RegistrationStatus.WITHDRAWN, RegistrationStatus.REJECTED))
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
        assertApprovalCapacity(registration.getTournament());
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

    // ---- Organizer gác cổng đăng ký giải của mình (BR-09 / BR-15) ----

    public List<TournamentRegistrationResponse> listForOrganizer(Long tournamentId, String status, String organizerEmail) {
        requireOwnedTournament(tournamentId, organizerEmail);
        List<TournamentRegistration> registrations = (status == null || status.isBlank())
                ? registrationRepository.findAllByTournament_IdOrderByCreatedAtDesc(tournamentId)
                : registrationRepository.findAllByTournament_IdAndStatusOrderByCreatedAtDesc(
                        tournamentId, status.trim().toUpperCase());
        return registrations.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public TournamentRegistrationResponse approveAsOrganizer(Long id, String organizerEmail) {
        TournamentRegistration registration = requireOrganizerRegistration(id, organizerEmail);
        registration.getTournament().assertOrganizationOperational();
        assertApprovalCapacity(registration.getTournament());
        User reviewer = findUserByEmail(organizerEmail);
        registration.approve(reviewer);
        registrationRepository.save(registration);
        notificationService.notify(registration.getOwner(), "ENTRY_APPROVED", "Horse entry approved",
                "“" + registration.getHorse().getName() + "” was approved for “"
                        + registration.getTournament().getName() + "”.",
                "REGISTRATION", registration.getId());
        return mapToResponse(registration);
    }

    @Transactional
    public TournamentRegistrationResponse rejectAsOrganizer(Long id, String organizerEmail, String reason) {
        TournamentRegistration registration = requireOrganizerRegistration(id, organizerEmail);
        registration.getTournament().assertOrganizationOperational();
        User reviewer = findUserByEmail(organizerEmail);
        registration.reject(reviewer, reason);
        registrationRepository.save(registration);
        notificationService.notify(registration.getOwner(), "ENTRY_REJECTED", "Horse entry rejected",
                "“" + registration.getHorse().getName() + "” was not accepted for “"
                        + registration.getTournament().getName() + "”"
                        + (reason == null || reason.isBlank() ? "." : ": " + reason),
                "REGISTRATION", registration.getId());
        return mapToResponse(registration);
    }

    /** BR-15: không duyệt vượt sức chứa giải (cap chỉ áp khi giải có đặt maxHorses). */
    private void assertApprovalCapacity(Tournament tournament) {
        if (tournament.getMaxHorses() == null) {
            return;
        }
        // BR-15: khóa ghi bi quan dòng giải → các lệnh duyệt đồng thời cho cùng giải bị tuần tự hóa,
        // nên đếm-rồi-duyệt (check-then-act) không còn vượt được sức chứa.
        tournamentRepository.findByIdForUpdate(tournament.getId());
        if (registrationRepository.countByTournament_IdAndStatus(tournament.getId(), RegistrationStatus.APPROVED)
                >= tournament.getMaxHorses()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Tournament is full: the approved-horse cap has been reached (BR-15)");
        }
    }

    private Tournament requireOwnedTournament(Long tournamentId, String organizerEmail) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(tournamentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        if (!tournament.isManagedBy(organizerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this tournament");
        }
        return tournament;
    }

    private TournamentRegistration requireOrganizerRegistration(Long id, String organizerEmail) {
        TournamentRegistration registration = registrationRepository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament registration not found"));
        if (!registration.getTournament().isManagedBy(organizerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this tournament");
        }
        return registration;
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
        if (TournamentStatus.OPEN_REGISTRATION != tournament.getStatus()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tournament is not open for registration");
        }
        if (registrationRepository.existsByTournament_IdAndHorse_IdAndStatusIn(
            tournament.getId(),
            horse.getId(),
            List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Horse already has a registration for this tournament");
        }
        if (tournament.getMaxHorses() != null
                && registrationRepository.countByTournament_IdAndStatus(
                        tournament.getId(),
                        RegistrationStatus.APPROVED
                ) >= tournament
                        .getMaxHorses()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tournament is full");
        }
        int maxHorsesPerOwner = tournament.getMaxHorsesPerOwner() == null ? 2 : tournament.getMaxHorsesPerOwner();
        if (registrationRepository.countByTournament_IdAndOwner_IdAndStatusIn(
                tournament.getId(),
                owner.getId(),
                List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED)) >= maxHorsesPerOwner) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Owner horse registration limit reached for this tournament");
        }
    }

    private Pageable pageableForFocusedRegistration(String ownerEmail, Long horseId, Long focusId, Pageable pageable) {
        TournamentRegistration focusedRegistration = horseId == null
                ? registrationRepository.findByIdAndOwnerEmail(focusId, ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament registration not found"))
                : registrationRepository.findByIdAndOwnerEmailAndHorseId(focusId, ownerEmail, horseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament registration not found"));
        long itemsBeforeFocus = registrationRepository.countOwnerRegistrationsBeforeFocus(
                ownerEmail,
                horseId,
                focusedRegistration.getCreatedAt(),
                focusedRegistration.getId()
        );
        int focusedPage = (int) (itemsBeforeFocus / pageable.getPageSize());
        return PageRequest.of(focusedPage, pageable.getPageSize(), pageable.getSort());
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
                .status(registration.getStatus().name())
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
