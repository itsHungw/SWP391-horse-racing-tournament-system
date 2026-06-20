package com.example.horseracingtournamentsystem.championship.service;

import com.example.horseracingtournamentsystem.championship.dto.response.JockeyPoolApplicationResponse;
import com.example.horseracingtournamentsystem.championship.dto.response.JockeyChampionshipResponse;
import com.example.horseracingtournamentsystem.championship.entity.JockeyTournamentApplication;
import com.example.horseracingtournamentsystem.championship.enums.JockeyApplicationStatus;
import com.example.horseracingtournamentsystem.championship.repository.JockeyTournamentApplicationRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.util.Map;
import java.util.List;
import java.util.Locale;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class JockeyPoolApplicationService {

    private static final List<JockeyApplicationStatus> ACTIVE_APPLICATION_STATUSES = List.of(
            JockeyApplicationStatus.PENDING,
            JockeyApplicationStatus.APPROVED_FOR_POOL
    );

    private final JockeyTournamentApplicationRepository applicationRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<JockeyChampionshipResponse> listChampionshipsForJockey(String jockeyEmail) {
        User jockey = getUserWithRoles(jockeyEmail);
        requireRole(jockey, "JOCKEY", "Only approved jockeys can view jockey championships");

        Map<Long, JockeyTournamentApplication> applicationsByTournament = applicationRepository
                .findAllByJockey_IdOrderByCreatedAtDesc(jockey.getId())
                .stream()
                .collect(Collectors.toMap(
                        application -> application.getTournament().getId(),
                        Function.identity(),
                        (first, ignored) -> first
                ));

        return tournamentRepository.findAllByStatusInAndDeletedAtIsNull(
                        List.of(
                                TournamentStatus.OPEN_REGISTRATION,
                                TournamentStatus.CLOSED_REGISTRATION,
                                TournamentStatus.ONGOING,
                                TournamentStatus.COMPLETED
                        )
                )
                .stream()
                .map(tournament -> mapToJockeyChampionshipResponse(
                        tournament,
                        applicationsByTournament.get(tournament.getId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<JockeyPoolApplicationResponse> listOwnApplications(String jockeyEmail) {
        User jockey = getUserWithRoles(jockeyEmail);
        requireRole(jockey, "JOCKEY", "Only approved jockeys can view jockey pool applications");

        return applicationRepository.findAllByJockey_IdOrderByCreatedAtDesc(jockey.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public JockeyPoolApplicationResponse apply(Long championshipId, String jockeyEmail, String message) {
        Tournament tournament = getOpenTournament(championshipId);
        User jockey = getUserWithRoles(jockeyEmail);
        requireRole(jockey, "JOCKEY", "Only approved jockeys can apply to a championship pool");

        if (applicationRepository.existsByTournament_IdAndJockey_IdAndStatusIn(
                championshipId,
                jockey.getId(),
                ACTIVE_APPLICATION_STATUSES
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already have an active application for this championship pool");
        }

        JockeyTournamentApplication application = applicationRepository
                .findByTournament_IdAndJockey_Id(championshipId, jockey.getId())
                .map(existing -> {
                    existing.resubmit(message);
                    return existing;
                })
                .orElseGet(() -> JockeyTournamentApplication.pending(tournament, jockey, message));
        return mapToResponse(applicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public List<JockeyPoolApplicationResponse> listForAdmin(Long championshipId, String status) {
        ensureTournamentExists(championshipId);
        List<JockeyTournamentApplication> applications;
        if (status == null || status.isBlank()) {
            applications = applicationRepository.findAllByTournament_IdOrderByCreatedAtDesc(championshipId);
        } else {
            JockeyApplicationStatus applicationStatus;
            try {
                applicationStatus = JockeyApplicationStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid jockey application status");
            }
            applications = applicationRepository.findAllByTournament_IdAndStatusOrderByCreatedAtDesc(
                    championshipId,
                    applicationStatus
            );
        }
        return applications.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<JockeyPoolApplicationResponse> listApprovedPoolForOwner(Long championshipId) {
        ensureTournamentExists(championshipId);
        return applicationRepository
                .findAllByTournament_IdAndStatusOrderByReviewedAtDesc(
                        championshipId,
                        JockeyApplicationStatus.APPROVED_FOR_POOL
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public JockeyPoolApplicationResponse approve(Long championshipId, Long applicationId, String adminEmail) {
        JockeyTournamentApplication application = getApplication(championshipId, applicationId);
        User reviewer = getUser(adminEmail);
        application.approve(reviewer);
        return mapToResponse(application);
    }

    @Transactional
    public JockeyPoolApplicationResponse reject(
            Long championshipId,
            Long applicationId,
            String adminEmail,
            String reason
    ) {
        JockeyTournamentApplication application = getApplication(championshipId, applicationId);
        User reviewer = getUser(adminEmail);
        application.reject(reviewer, reason);
        return mapToResponse(application);
    }

    // ---- Organizer gác cổng jockey pool giải của mình (BR-09) ----

    @Transactional(readOnly = true)
    public List<JockeyPoolApplicationResponse> listForOrganizer(Long championshipId, String status, String organizerEmail) {
        requireOwnedTournament(championshipId, organizerEmail);
        List<JockeyTournamentApplication> applications;
        if (status == null || status.isBlank()) {
            applications = applicationRepository.findAllByTournament_IdOrderByCreatedAtDesc(championshipId);
        } else {
            JockeyApplicationStatus applicationStatus;
            try {
                applicationStatus = JockeyApplicationStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid jockey application status");
            }
            applications = applicationRepository.findAllByTournament_IdAndStatusOrderByCreatedAtDesc(championshipId, applicationStatus);
        }
        return applications.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public JockeyPoolApplicationResponse approveAsOrganizer(Long championshipId, Long applicationId, String organizerEmail) {
        requireOwnedTournament(championshipId, organizerEmail);
        JockeyTournamentApplication application = getApplication(championshipId, applicationId);
        application.approve(getUser(organizerEmail));
        return mapToResponse(application);
    }

    @Transactional
    public JockeyPoolApplicationResponse rejectAsOrganizer(
            Long championshipId,
            Long applicationId,
            String organizerEmail,
            String reason
    ) {
        requireOwnedTournament(championshipId, organizerEmail);
        JockeyTournamentApplication application = getApplication(championshipId, applicationId);
        application.reject(getUser(organizerEmail), reason);
        return mapToResponse(application);
    }

    private Tournament requireOwnedTournament(Long championshipId, String organizerEmail) {
        Tournament tournament = ensureTournamentExists(championshipId);
        if (!tournament.isManagedBy(organizerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this championship");
        }
        return tournament;
    }

    @Transactional
    public JockeyPoolApplicationResponse withdraw(Long championshipId, Long applicationId, String jockeyEmail) {
        JockeyTournamentApplication application = getApplication(championshipId, applicationId);
        if (!application.getJockey().getEmail().equals(jockeyEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only withdraw your own application");
        }
        application.withdraw();
        return mapToResponse(application);
    }

    private Tournament getOpenTournament(Long championshipId) {
        Tournament tournament = ensureTournamentExists(championshipId);
        if (TournamentStatus.OPEN_REGISTRATION != tournament.getStatus()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Jockey pool applications are only open during championship registration");
        }
        return tournament;
    }

    private Tournament ensureTournamentExists(Long championshipId) {
        return tournamentRepository.findByIdAndDeletedAtIsNull(championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championship not found"));
    }

    private JockeyTournamentApplication getApplication(Long championshipId, Long applicationId) {
        return applicationRepository.findByIdAndTournament_Id(applicationId, championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Jockey pool application not found"));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private User getUserWithRoles(String email) {
        return userRepository.findWithUserRolesByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void requireRole(User user, String role, String message) {
        if (!user.getActiveRoleNames().contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
        }
    }

    private JockeyChampionshipResponse mapToJockeyChampionshipResponse(
            Tournament tournament,
            JockeyTournamentApplication application
    ) {
        String applicationStatus = application == null ? "NOT_APPLIED" : application.getStatus().name();
        boolean applicationWindowOpen = TournamentStatus.OPEN_REGISTRATION == tournament.getStatus();
        boolean canApply = applicationWindowOpen && (
                application == null
                        || JockeyApplicationStatus.REJECTED == application.getStatus()
                        || JockeyApplicationStatus.WITHDRAWN == application.getStatus()
        );

        return JockeyChampionshipResponse.builder()
                .id(tournament.getId())
                .name(tournament.getName())
                .code(tournament.getCode())
                .description(tournament.getDescription())
                .location(tournament.getLocation())
                .startDate(tournament.getStartDate())
                .endDate(tournament.getEndDate())
                .registrationStartAt(tournament.getRegistrationStartAt())
                .registrationEndAt(tournament.getRegistrationEndAt())
                .maxHorses(tournament.getMaxHorses())
                .status(tournament.getStatus().name())
                .applicationStatus(applicationStatus)
                .applicationId(application == null ? null : application.getId())
                .applicationMessage(application == null ? null : application.getMessage())
                .rejectionReason(application == null ? null : application.getRejectionReason())
                .applicationCreatedAt(application == null ? null : application.getCreatedAt())
                .reviewedAt(application == null ? null : application.getReviewedAt())
                .approvedPoolCount(applicationRepository.countByTournament_IdAndStatus(
                        tournament.getId(),
                        JockeyApplicationStatus.APPROVED_FOR_POOL
                ))
                .applicationWindowOpen(applicationWindowOpen)
                .canApply(canApply)
                .build();
    }

    private JockeyPoolApplicationResponse mapToResponse(JockeyTournamentApplication application) {
        User jockey = application.getJockey();
        User reviewer = application.getReviewedBy();
        Tournament tournament = application.getTournament();
        return JockeyPoolApplicationResponse.builder()
                .id(application.getId())
                .championshipId(tournament.getId())
                .championshipName(tournament.getName())
                .jockeyId(jockey.getId())
                .jockeyName(jockey.getFullName())
                .jockeyEmail(jockey.getEmail())
                .jockeyAvatarUrl(jockey.getAvatarUrl())
                .message(application.getMessage())
                .status(application.getStatus().name())
                .reviewedBy(reviewer == null ? null : reviewer.getId())
                .reviewedAt(application.getReviewedAt())
                .rejectionReason(application.getRejectionReason())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .withdrawnAt(application.getWithdrawnAt())
                .build();
    }
}
