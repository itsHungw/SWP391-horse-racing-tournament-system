package com.example.horseracingtournamentsystem.championship.service;

import com.example.horseracingtournamentsystem.championship.dto.response.JockeyPoolApplicationResponse;
import com.example.horseracingtournamentsystem.championship.entity.JockeyTournamentApplication;
import com.example.horseracingtournamentsystem.championship.repository.JockeyTournamentApplicationRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class JockeyPoolApplicationService {

    private static final List<String> ACTIVE_APPLICATION_STATUSES = List.of(
            JockeyTournamentApplication.STATUS_PENDING,
            JockeyTournamentApplication.STATUS_APPROVED_FOR_POOL
    );

    private final JockeyTournamentApplicationRepository applicationRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;

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

        JockeyTournamentApplication application = JockeyTournamentApplication.pending(tournament, jockey, message);
        return mapToResponse(applicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public List<JockeyPoolApplicationResponse> listForAdmin(Long championshipId, String status) {
        ensureTournamentExists(championshipId);
        List<JockeyTournamentApplication> applications = status == null || status.isBlank()
                ? applicationRepository.findAllByTournament_IdOrderByCreatedAtDesc(championshipId)
                : applicationRepository.findAllByTournament_IdAndStatusOrderByCreatedAtDesc(championshipId, status);
        return applications.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<JockeyPoolApplicationResponse> listApprovedPoolForOwner(Long championshipId) {
        ensureTournamentExists(championshipId);
        return applicationRepository
                .findAllByTournament_IdAndStatusOrderByReviewedAtDesc(
                        championshipId,
                        JockeyTournamentApplication.STATUS_APPROVED_FOR_POOL
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
        if (!"OPEN_REGISTRATION".equals(tournament.getStatus())) {
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
                .status(application.getStatus())
                .reviewedBy(reviewer == null ? null : reviewer.getId())
                .reviewedAt(application.getReviewedAt())
                .rejectionReason(application.getRejectionReason())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .withdrawnAt(application.getWithdrawnAt())
                .build();
    }
}
