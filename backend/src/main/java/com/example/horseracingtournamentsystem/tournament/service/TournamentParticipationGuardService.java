package com.example.horseracingtournamentsystem.tournament.service;

import com.example.horseracingtournamentsystem.championship.enums.JockeyApplicationStatus;
import com.example.horseracingtournamentsystem.championship.enums.TournamentParticipantStatus;
import com.example.horseracingtournamentsystem.championship.repository.JockeyTournamentApplicationRepository;
import com.example.horseracingtournamentsystem.championship.repository.RefereeContractRepository;
import com.example.horseracingtournamentsystem.championship.repository.TournamentParticipantRepository;
import com.example.horseracingtournamentsystem.championship.entity.RefereeContract;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentParticipationRole;
import com.example.horseracingtournamentsystem.tournamentregistration.enums.RegistrationStatus;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TournamentParticipationGuardService {

    private static final List<RegistrationStatus> ACTIVE_OWNER_STATUSES = List.of(
            RegistrationStatus.PENDING,
            RegistrationStatus.APPROVED
    );
    private static final List<JockeyApplicationStatus> ACTIVE_JOCKEY_APPLICATION_STATUSES = List.of(
            JockeyApplicationStatus.PENDING,
            JockeyApplicationStatus.APPROVED_FOR_POOL
    );

    private final TournamentRegistrationRepository registrationRepository;
    private final JockeyTournamentApplicationRepository jockeyApplicationRepository;
    private final TournamentParticipantRepository participantRepository;
    private final RefereeContractRepository refereeContractRepository;

    public void assertNoConflictingParticipation(
            Long tournamentId,
            User user,
            TournamentParticipationRole requestedRole
    ) {
        findActiveParticipationRole(tournamentId, user)
                .filter(existingRole -> existingRole != requestedRole)
                .ifPresent(existingRole -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "You are already participating in this tournament as " + existingRole
                                    + ". Use that dashboard or leave that participation before joining with another role.");
                });
    }

    private Optional<TournamentParticipationRole> findActiveParticipationRole(Long tournamentId, User user) {
        Long userId = user.getId();
        if (registrationRepository.countByTournament_IdAndOwner_IdAndStatusIn(
                tournamentId,
                userId,
                ACTIVE_OWNER_STATUSES
        ) > 0) {
            return Optional.of(TournamentParticipationRole.HORSE_OWNER);
        }
        if (jockeyApplicationRepository.existsByTournament_IdAndJockey_IdAndStatusIn(
                tournamentId,
                userId,
                ACTIVE_JOCKEY_APPLICATION_STATUSES
        ) || participantRepository.existsByTournament_IdAndJockey_IdAndStatus(
                tournamentId,
                userId,
                TournamentParticipantStatus.ACTIVE
        )) {
            return Optional.of(TournamentParticipationRole.JOCKEY);
        }
        if (refereeContractRepository.existsByTournament_IdAndReferee_IdAndStatus(
                tournamentId,
                userId,
                RefereeContract.STATUS_ACTIVE
        )) {
            return Optional.of(TournamentParticipationRole.REFEREE);
        }
        return Optional.empty();
    }
}
