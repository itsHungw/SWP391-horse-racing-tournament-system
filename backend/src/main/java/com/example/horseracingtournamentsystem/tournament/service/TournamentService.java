package com.example.horseracingtournamentsystem.tournament.service;

import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.championship.repository.TournamentParticipantRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.dto.request.TournamentRequest;
import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentResponse;
import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentSummaryResponse;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.organization.repository.OrganizationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TournamentService {

    private static final List<TournamentStatus> PUBLIC_STATUSES = List.of(
            TournamentStatus.OPEN_REGISTRATION, TournamentStatus.CLOSED_REGISTRATION, TournamentStatus.SCHEDULE_PUBLISHED, TournamentStatus.ONGOING, TournamentStatus.COMPLETED
    );
    private static final Set<String> DISCOVERY_SORTS = Set.of(
            "LATEST", "REGISTRATION_CLOSING_SOON", "ONGOING_FIRST"
    );

    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RaceRepository raceRepository;
    private final RaceParticipantRepository raceParticipantRepository;
    private final TournamentParticipantRepository tournamentParticipantRepository;
    private final RaceResultRepository raceResultRepository;

    @Transactional
    public TournamentResponse createTournament(TournamentRequest req, String creatorEmail) {
        if (tournamentRepository.existsByCodeAndDeletedAtIsNull(req.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tournament code already exists");
        }
        validateTournamentDates(req);

        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator user not found"));

        Tournament tournament = Tournament.create(
                req.getName(), req.getCode(), req.getDescription(), req.getLocation(),
                req.getStartDate(), req.getEndDate(), req.getRegistrationStartAt(),
                req.getRegistrationEndAt(), req.getMaxHorses(), req.getMaxHorsesPerOwner(), creator
        );

        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    // ---- Organizer flow + Cổng 2 (BR-09 / BR-17) ----

    @Transactional
    public TournamentResponse createForOrganizer(TournamentRequest req, String organizerEmail) {
        Organization organization = organizationRepository.findByOwner_EmailAndDeletedAtIsNull(organizerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have an organization"));
        if (!organization.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your organization is not active");
        }
        if (tournamentRepository.existsByCodeAndDeletedAtIsNull(req.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tournament code already exists");
        }
        validateTournamentDates(req);

        User creator = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator user not found"));

        Tournament tournament = Tournament.create(
                req.getName(), req.getCode(), req.getDescription(), req.getLocation(),
                req.getStartDate(), req.getEndDate(), req.getRegistrationStartAt(),
                req.getRegistrationEndAt(), req.getMaxHorses(), req.getMaxHorsesPerOwner(), creator
        );
        tournament.assignOrganization(organization);
        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    public List<TournamentResponse> getMyTournaments(String organizerEmail) {
        return tournamentRepository
                .findAllByOrganization_Owner_EmailAndDeletedAtIsNullOrderByCreatedAtDesc(organizerEmail)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public TournamentResponse submitForApproval(Long id, String organizerEmail) {
        Tournament tournament = requireOwnedTournament(id, organizerEmail);
        if (!"DRAFT".equals(tournament.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only DRAFT tournaments can be submitted for approval");
        }
        tournament.submitForApproval();
        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    @Transactional
    public TournamentResponse approveLaunch(Long id, String adminEmail) {
        Tournament tournament = requirePendingApproval(id);
        User reviewer = requireReviewer(adminEmail);
        tournament.approveLaunch(reviewer);
        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    @Transactional
    public TournamentResponse rejectLaunch(Long id, String adminEmail, String reason) {
        Tournament tournament = requirePendingApproval(id);
        User reviewer = requireReviewer(adminEmail);
        tournament.rejectLaunch(reviewer, reason == null ? null : reason.trim());
        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    @Transactional
    public void updateStatusForOrganizer(Long id, String status, String organizerEmail) {
        requireOwnedTournament(id, organizerEmail);
        TournamentStatus target;
        try {
            target = TournamentStatus.valueOf(status.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tournament status");
        }
        updateStatus(id, target);
    }

    private Tournament requireOwnedTournament(Long id, String organizerEmail) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        Organization organization = tournament.getOrganization();
        if (organization == null || organization.getOwner() == null
                || !organization.getOwner().getEmail().equals(organizerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this tournament");
        }
        return tournament;
    }

    private Tournament requirePendingApproval(Long id) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        if (!"PENDING_APPROVAL".equals(tournament.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only tournaments pending approval can be reviewed");
        }
        return tournament;
    }

    private User requireReviewer(String adminEmail) {
        return userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Reviewer not found"));
    }

    @Transactional
    public TournamentResponse updateTournament(Long id, TournamentRequest req) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));

        if (!java.util.List.of(TournamentStatus.DRAFT, TournamentStatus.POSTPONED).contains(tournament.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tournament settings can only be modified when in DRAFT or POSTPONED status");
        }
        if (tournamentRepository.existsByCodeAndIdNotAndDeletedAtIsNull(req.getCode(), id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tournament code already exists");
        }
        validateTournamentDates(req);

        tournament.update(
                req.getName(), req.getDescription(), req.getLocation(),
                req.getStartDate(), req.getEndDate(), req.getRegistrationStartAt(),
                req.getRegistrationEndAt(), req.getMaxHorses(), req.getMaxHorsesPerOwner()
        );

        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    private void validateTournamentDates(TournamentRequest req) {
        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
        }
        if (req.getRegistrationStartAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration start time cannot be in the past");
        }
        if (req.getRegistrationEndAt().isBefore(req.getRegistrationStartAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration end time cannot be before start time");
        }
        if (!req.getRegistrationEndAt().isBefore(req.getStartDate().atStartOfDay())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration end time must be before tournament start date"
            );
        }
    }

    @Transactional
    public void deleteTournament(Long id) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        if (TournamentStatus.DRAFT != tournament.getStatus()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft tournaments can be deleted. Please postpone active tournaments instead");
        }
        tournament.postpone();
        tournament.softDelete();
        tournamentRepository.save(tournament);
    }

    public TournamentResponse getTournamentDetail(Long id) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        return mapToResponse(tournament);
    }

    public List<TournamentResponse> getAdminTournaments() {
        return tournamentRepository.findAllByDeletedAtIsNull().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TournamentResponse> getPublicTournaments() {
        return tournamentRepository.findAllByStatusInAndDeletedAtIsNull(PUBLIC_STATUSES)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Page<TournamentSummaryResponse> searchPublicTournaments(
            String search,
            TournamentStatus status,
            Integer year,
            String sortBy,
            Pageable pageable
    ) {
        String normalizedSearch = search == null ? "" : search.trim();
        String normalizedSort = sortBy == null ? "ONGOING_FIRST" : sortBy.trim().toUpperCase(Locale.ROOT);
        if (status != null && !PUBLIC_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid public tournament status");
        }
        if (!DISCOVERY_SORTS.contains(normalizedSort)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tournament discovery sort");
        }

        Page<Tournament> tournaments = tournamentRepository.searchPublic(
                normalizedSearch, status, year, normalizedSort, PUBLIC_STATUSES, pageable
        );
        if (tournaments.isEmpty()) {
            return tournaments.map(tournament -> mapToSummary(tournament, 0, 0, null));
        }

        List<Long> tournamentIds = tournaments.getContent().stream().map(Tournament::getId).toList();
        Map<Long, Long> raceCounts = toCountMap(raceRepository.countByTournamentIds(tournamentIds));
        Map<Long, Long> participantCounts =
                toCountMap(tournamentParticipantRepository.countActiveByTournamentIds(tournamentIds));
        Map<Long, Race> nextRaces = raceRepository.findNextByTournamentIds(tournamentIds, LocalDateTime.now()).stream()
                .collect(Collectors.toMap(
                        race -> race.getTournament().getId(),
                        Function.identity(),
                        (first, ignored) -> first
                ));

        return tournaments.map(tournament -> mapToSummary(
                tournament,
                raceCounts.getOrDefault(tournament.getId(), 0L),
                participantCounts.getOrDefault(tournament.getId(), 0L),
                nextRaces.get(tournament.getId())
        ));
    }

    @Transactional
    public void updateStatus(Long id, TournamentStatus status) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tournament status");
        }
        switch (status) {
            case OPEN_REGISTRATION:
                // BR-17: chỉ mở đăng ký sau khi admin duyệt (APPROVED), hoặc khi mở lại giải đã hoãn (POSTPONED).
                if (TournamentStatus.APPROVED != tournament.getStatus() && TournamentStatus.POSTPONED != tournament.getStatus()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Registration can only open after admin approval (status APPROVED) (BR-17)"
                    );
                }
                tournament.openRegistration();
                break;
            case CLOSED_REGISTRATION:
                tournament.closeRegistration();
                break;
            case PARTICIPANTS_LOCKED:
                tournament.lockParticipants();
                break;
            case SCHEDULE_PUBLISHED:
                if (TournamentStatus.PARTICIPANTS_LOCKED != tournament.getStatus()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Schedule can only be published after participants are locked"
                    );
                }
                syncOfficialScheduleParticipants(tournament);
                tournament.publishSchedule();
                break;
            case ONGOING:
                tournament.startOngoing();
                break;
            case COMPLETED:
                tournament.completeTournament();
                break;
            case POSTPONED:
                tournament.postpone();
                break;
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tournament status: " + status);
        }
        tournamentRepository.save(tournament);
    }

    private void syncOfficialScheduleParticipants(Tournament tournament) {
        List<Race> races = raceRepository.findAllByTournamentIdAndDeletedAtIsNullOrderByRaceAtAsc(tournament.getId());
        if (races.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Create at least one championship round before publishing the schedule"
            );
        }
        List<String> missingRefereeRounds = races.stream()
                .filter(race -> race.getReferee() == null)
                .map(Race::getName)
                .toList();
        if (!missingRefereeRounds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot publish schedule. Some races do not have assigned referees: "
                            + String.join(", ", missingRefereeRounds)
            );
        }

        List<TournamentParticipant> participants =
                tournamentParticipantRepository.findAllByTournament_IdOrderByCreatedAtDesc(tournament.getId());
        if (participants.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lock accepted contracts into official participants before publishing the schedule"
            );
        }

        // Pre-calculate win rates for all participants
        Map<Long, Double> winRates = new HashMap<>();
        double sumRates = 0;

        for (TournamentParticipant participant : participants) {
            Long horseId = participant.getHorse().getId();
            long totalRaces = raceResultRepository.countTotalRacesByHorseId(horseId);
            long totalWins = raceResultRepository.countWinsByHorseId(horseId);

            // If the horse is new or hasn't won, give it a baseline chance (e.g., 1 win out of 20 = 0.05)
            double rate = (totalRaces > 0 && totalWins > 0) ? (double) totalWins / totalRaces : 0.05;
            winRates.put(horseId, rate);
            sumRates += rate;
        }

        for (TournamentParticipant participant : participants) {
            Long horseId = participant.getHorse().getId();
            double normalizedProb = winRates.get(horseId) / sumRates;
            BigDecimal baseProb = BigDecimal.valueOf(normalizedProb).setScale(4, RoundingMode.HALF_UP);

            for (Race race : races) {
                if (raceParticipantRepository.existsByRace_IdAndHorse_Id(race.getId(), horseId)) {
                    continue;
                }
                RaceParticipant rp = RaceParticipant.registered(race, participant, null);
                rp.setBaseWinProbability(baseProb);
                raceParticipantRepository.save(rp);
            }
        }
    }

    private TournamentResponse mapToResponse(Tournament t) {
        return TournamentResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .code(t.getCode())
                .description(t.getDescription())
                .location(t.getLocation())
                .startDate(t.getStartDate())
                .endDate(t.getEndDate())
                .registrationStartAt(t.getRegistrationStartAt())
                .registrationEndAt(t.getRegistrationEndAt())
                .maxHorses(t.getMaxHorses())
                .maxHorsesPerOwner(t.getMaxHorsesPerOwner())
                .status(t.getStatus())
                .creatorName(t.getCreatedBy().getFullName())
                .organizationId(t.getOrganization() == null ? null : t.getOrganization().getId())
                .organizationName(t.getOrganization() == null ? null : t.getOrganization().getName())
                .approvedAt(t.getApprovedAt())
                .rejectionReason(t.getRejectionReason())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    private TournamentSummaryResponse mapToSummary(
            Tournament tournament,
            long raceCount,
            long participantCount,
            Race nextRace
    ) {
        return TournamentSummaryResponse.builder()
                .id(tournament.getId())
                .name(tournament.getName())
                .code(tournament.getCode())
                .description(tournament.getDescription())
                .location(tournament.getLocation())
                .startDate(tournament.getStartDate())
                .endDate(tournament.getEndDate())
                .registrationEndAt(tournament.getRegistrationEndAt())
                .maxHorses(tournament.getMaxHorses())
                .status(tournament.getStatus())
                .raceCount(raceCount)
                .participantCount(participantCount)
                .nextRace(nextRace == null ? null : TournamentSummaryResponse.NextRaceSummary.builder()
                        .id(nextRace.getId())
                        .name(nextRace.getName())
                        .raceDateTime(nextRace.getRaceAt())
                        .status(nextRace.getStatus())
                        .build())
                .build();
    }
}
