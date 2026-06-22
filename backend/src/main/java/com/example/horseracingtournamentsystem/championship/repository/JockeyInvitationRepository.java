package com.example.horseracingtournamentsystem.championship.repository;

import com.example.horseracingtournamentsystem.championship.entity.JockeyInvitation;
import com.example.horseracingtournamentsystem.championship.enums.JockeyInvitationStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JockeyInvitationRepository extends JpaRepository<JockeyInvitation, Long> {

    List<JockeyInvitation> findAllByJockey_EmailOrderByCreatedAtDesc(String jockeyEmail);

    List<JockeyInvitation> findAllByOwner_EmailAndTournament_IdOrderByCreatedAtDesc(String ownerEmail, Long tournamentId);

    Optional<JockeyInvitation> findByIdAndJockey_Email(Long id, String jockeyEmail);

    List<JockeyInvitation> findAllByTournament_IdAndStatusOrderByAcceptedAtAsc(
            Long tournamentId,
            JockeyInvitationStatus status
    );

    boolean existsByTournament_IdAndTournamentRegistration_IdAndStatusIn(
            Long tournamentId,
            Long tournamentRegistrationId,
            Collection<JockeyInvitationStatus> statuses
    );

    boolean existsByTournament_IdAndJockey_IdAndStatusIn(
            Long tournamentId,
            Long jockeyId,
            Collection<JockeyInvitationStatus> statuses
    );

    boolean existsByAgreementUrlAndJockey_Email(String agreementUrl, String jockeyEmail);
}
