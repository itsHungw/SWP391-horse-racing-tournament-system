package com.example.horseracingtournamentsystem.championship.service;

import com.example.horseracingtournamentsystem.championship.dto.response.ChampionshipWorkspaceResponse;
import com.example.horseracingtournamentsystem.championship.entity.JockeyTournamentApplication;
import com.example.horseracingtournamentsystem.championship.enums.JockeyApplicationStatus;
import com.example.horseracingtournamentsystem.championship.repository.JockeyTournamentApplicationRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.enums.RegistrationStatus;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminChampionshipWorkspaceService {

    private static final Set<TournamentStatus> REGISTRATION_CLOSED_STATUSES = Set.of(
            TournamentStatus.CLOSED_REGISTRATION,
            TournamentStatus.PARTICIPANTS_LOCKED,
            TournamentStatus.SCHEDULE_PUBLISHED,
            TournamentStatus.ONGOING,
            TournamentStatus.COMPLETED
    );
    private static final Set<TournamentStatus> OFFICIAL_SCHEDULE_STATUSES = Set.of(
            TournamentStatus.SCHEDULE_PUBLISHED,
            TournamentStatus.ONGOING,
            TournamentStatus.COMPLETED
    );

    private final TournamentRepository tournamentRepository;
    private final RaceRepository raceRepository;
    private final TournamentRegistrationRepository registrationRepository;
    private final JockeyTournamentApplicationRepository jockeyApplicationRepository;

    public ChampionshipWorkspaceResponse getWorkspace(Long championshipId) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championship not found"));

        List<Race> rounds = raceRepository.findAllByTournamentIdAndDeletedAtIsNullOrderByRaceAtAsc(championshipId);
        Race currentRound = findCurrentRound(rounds);
        long publishedRounds = rounds.stream().filter(round -> RaceStatus.PUBLISHED == round.getStatus()).count();
        long pendingRegistrations = registrationRepository.countByTournament_IdAndStatus(
                championshipId,
                RegistrationStatus.PENDING
        );
        long approvedRegistrations = registrationRepository.countByTournament_IdAndStatus(
                championshipId,
                RegistrationStatus.APPROVED
        );
        long pendingJockeyApplications = jockeyApplicationRepository.countByTournament_IdAndStatus(
                championshipId,
                JockeyApplicationStatus.PENDING
        );
        long approvedJockeyPool = jockeyApplicationRepository.countByTournament_IdAndStatus(
                championshipId,
                JockeyApplicationStatus.APPROVED_FOR_POOL
        );
        boolean officialSchedule = isOfficialSchedule(tournament);

        return new ChampionshipWorkspaceResponse(
                tournament.getId(),
                tournament.getName(),
                tournament.getCode(),
                tournament.getLocation(),
                tournament.getStatus().name(),
                tournament.getStatus().name(),
                phaseLabel(tournament.getStatus()),
                currentRound == null ? null : mapCurrentRound(currentRound, officialSchedule),
                nextAction(tournament, currentRound, rounds, pendingRegistrations, pendingJockeyApplications),
                new ChampionshipWorkspaceResponse.Counts(
                        pendingRegistrations,
                        approvedRegistrations,
                        pendingJockeyApplications,
                        approvedJockeyPool,
                        0,
                        rounds.size(),
                        publishedRounds
                ),
                new ChampionshipWorkspaceResponse.Readiness(
                        !rounds.isEmpty(),
                        REGISTRATION_CLOSED_STATUSES.contains(tournament.getStatus()),
                        OFFICIAL_SCHEDULE_STATUSES.contains(tournament.getStatus()),
                        publishedRounds > 0
                )
        );
    }

    private Race findCurrentRound(List<Race> rounds) {
        return rounds.stream()
                .filter(round -> RaceStatus.PUBLISHED != round.getStatus())
                .filter(round -> RaceStatus.CANCELLED != round.getStatus())
                .findFirst()
                .orElse(null);
    }

    private ChampionshipWorkspaceResponse.CurrentRound mapCurrentRound(Race race, boolean officialSchedule) {
        return new ChampionshipWorkspaceResponse.CurrentRound(
                race.getId(),
                race.getName(),
                race.getCode(),
                race.getStatus().name(),
                officialSchedule,
                race.getRaceAt()
        );
    }

    private ChampionshipWorkspaceResponse.NextAction nextAction(
            Tournament tournament,
            Race currentRound,
            List<Race> rounds,
            long pendingRegistrations,
            long pendingJockeyApplications
    ) {
        return switch (tournament.getStatus()) {
            case DRAFT -> rounds.isEmpty()
                    ? action("CREATE_ROUND", "Create Round", "ROUNDS", null)
                    : action("OPEN_REGISTRATION", "Open Registration", "CONTROLS", null);
            case APPROVED -> action("OPEN_REGISTRATION", "Open Registration", "CONTROLS", null);
            case OPEN_REGISTRATION -> pendingRegistrations > 0 || pendingJockeyApplications > 0
                    ? action("REVIEW_APPLICATIONS", "Review Applications", "APPLICATIONS", null)
                    : action("CLOSE_REGISTRATION", "Close Registration", "CONTROLS", null);
            case CLOSED_REGISTRATION -> pendingRegistrations > 0 || pendingJockeyApplications > 0
                    ? action("REVIEW_REMAINING_APPLICATIONS", "Review Remaining Applications", "APPLICATIONS", null)
                    : action("LOCK_PARTICIPANTS", "Lock Participants", "PARTICIPANTS", null);
            case PARTICIPANTS_LOCKED -> action("PUBLISH_SCHEDULE", "Publish Schedule", "CONTROLS", null);
            case SCHEDULE_PUBLISHED -> nextRoundAction(currentRound);
            case ONGOING -> nextRoundAction(currentRound);
            case COMPLETED -> action("REVIEW_STANDINGS", "Review Standings", "STANDINGS", null);
            default -> action("REVIEW_CHAMPIONSHIP", "Review Championship", "OVERVIEW", null);
        };
    }

    private ChampionshipWorkspaceResponse.NextAction nextRoundAction(Race currentRound) {
        if (currentRound == null) {
            return action("COMPLETE_CHAMPIONSHIP", "Complete Championship", "CONTROLS", null);
        }

        return switch (currentRound.getStatus()) {
            case SCHEDULED -> action("START_CHECKS", "Start Operational Checks", "ROUND_CONTROL_CENTER", currentRound.getId());
            case CHECKING -> action("MARK_READY", "Mark Ready", "ROUND_CONTROL_CENTER", currentRound.getId());
            case READY -> action("START_RACE", "Start Race", "ROUND_CONTROL_CENTER", currentRound.getId());
            case ONGOING -> action("FINISH_RACE", "Finish Race", "ROUND_CONTROL_CENTER", currentRound.getId());
            case FINISHED -> action("SUBMIT_RESULTS", "Submit Results", "ROUND_CONTROL_CENTER", currentRound.getId());
            case RESULT_SUBMITTED -> action("CONFIRM_RESULTS", "Confirm Results", "ROUND_CONTROL_CENTER", currentRound.getId());
            case RESULT_CONFIRMED -> action("PUBLISH_RESULTS", "Publish Results", "ROUND_CONTROL_CENTER", currentRound.getId());
            default -> action("REVIEW_ROUND", "Review Round Status", "ROUND_CONTROL_CENTER", currentRound.getId());
        };
    }

    private ChampionshipWorkspaceResponse.NextAction action(String code, String label, String target, Long roundId) {
        return new ChampionshipWorkspaceResponse.NextAction(code, label, target, roundId);
    }

    private boolean isOfficialSchedule(Tournament tournament) {
        return OFFICIAL_SCHEDULE_STATUSES.contains(tournament.getStatus());
    }

    private String phaseLabel(TournamentStatus status) {
        return switch (status) {
            case DRAFT -> "Draft";
            case PENDING_APPROVAL -> "Pending Approval";
            case APPROVED -> "Approved";
            case OPEN_REGISTRATION -> "Registration Open";
            case CLOSED_REGISTRATION -> "Registration Closed";
            case PARTICIPANTS_LOCKED -> "Participants Locked";
            case SCHEDULE_PUBLISHED -> "Schedule Published";
            case ONGOING -> "Racing";
            case COMPLETED -> "Completed";
            case POSTPONED -> "Postponed";
        };
    }
}
