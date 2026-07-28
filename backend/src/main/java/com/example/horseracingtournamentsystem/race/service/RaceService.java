package com.example.horseracingtournamentsystem.race.service;

import com.example.horseracingtournamentsystem.prediction.service.PredictionService;
import com.example.horseracingtournamentsystem.race.dto.request.RaceRequest;
import com.example.horseracingtournamentsystem.race.dto.response.JockeyScheduleItemResponse;
import com.example.horseracingtournamentsystem.race.dto.response.RaceParticipantResponse;
import com.example.horseracingtournamentsystem.race.dto.response.RaceResponse;
import com.example.horseracingtournamentsystem.race.dto.response.RaceSummaryResponse;
import com.example.horseracingtournamentsystem.race.dto.response.PublicRaceResultResponse;
import com.example.horseracingtournamentsystem.race.dto.response.PublicRacingSummaryResponse;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RacePublicSearchRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.championship.entity.RefereeContract;
import com.example.horseracingtournamentsystem.championship.repository.TournamentParticipantRepository;
import com.example.horseracingtournamentsystem.championship.repository.RefereeContractRepository;
import com.example.horseracingtournamentsystem.notification.service.NotificationService;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RaceService {

    private final RaceRepository raceRepository;
    private final RacePublicSearchRepository racePublicSearchRepository;
    private final RaceParticipantRepository raceParticipantRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final PredictionService predictionService;
    private final RaceResultRepository raceResultRepository;
    private final TournamentParticipantRepository tournamentParticipantRepository;
    private final RefereeContractRepository refereeContractRepository;
    private final NotificationService notificationService;
    private final com.example.horseracingtournamentsystem.referee.repository.ViolationRepository violationRepository;
    private final com.example.horseracingtournamentsystem.referee.repository.RefereeReportRepository refereeReportRepository;

    private static final Map<RaceStatus, Set<RaceStatus>> ALLOWED_STATUS_TRANSITIONS = Map.of(
            RaceStatus.SCHEDULED, Set.of(RaceStatus.CHECKING, RaceStatus.CANCELLED),
            RaceStatus.CHECKING, Set.of(RaceStatus.READY, RaceStatus.CANCELLED),
            RaceStatus.READY, Set.of(RaceStatus.ONGOING, RaceStatus.CANCELLED),
            RaceStatus.ONGOING, Set.of(RaceStatus.FINISHED, RaceStatus.CANCELLED),
            RaceStatus.FINISHED, Set.of(RaceStatus.RESULT_SUBMITTED),
            RaceStatus.RESULT_SUBMITTED, Set.of(RaceStatus.RESULT_CONFIRMED),
            RaceStatus.RESULT_CONFIRMED, Set.of(RaceStatus.PUBLISHED),
            RaceStatus.PUBLISHED, Set.of()
    );

    private static final List<TournamentStatus> VISIBLE_JOCKEY_SCHEDULE_STATUSES = List.of(
            TournamentStatus.SCHEDULE_PUBLISHED,
            TournamentStatus.ONGOING,
            TournamentStatus.COMPLETED
    );
    private static final List<TournamentStatus> PUBLIC_TOURNAMENT_STATUSES = List.of(
            TournamentStatus.OPEN_REGISTRATION, TournamentStatus.CLOSED_REGISTRATION, TournamentStatus.SCHEDULE_PUBLISHED, TournamentStatus.ONGOING, TournamentStatus.COMPLETED
    );
    private static final Set<ResultRecordStatus> PUBLIC_RESULT_STATUSES = Set.of(
            ResultRecordStatus.CONFIRMED, ResultRecordStatus.PUBLISHED
    );

    @Transactional
    public RaceResponse createRace(RaceRequest req, String creatorEmail) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(req.getTournamentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));

        if (raceRepository.existsByCodeAndDeletedAtIsNull(req.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race code already exists");
        }

        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator not found"));

        LocalDate raceDate = req.getRaceDateTime().toLocalDate();
        if (raceDate.isBefore(tournament.getStartDate()) || raceDate.isAfter(tournament.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Race date must be within the tournament dates (" + tournament.getStartDate() + " to " + tournament.getEndDate() + ")");
        }

        Race race = Race.create(
                tournament, req.getName(), req.getCode(), req.getRaceDateTime(),
                req.getDistanceMeters(), req.getMaxParticipants(), creator
        );

        raceRepository.save(race);
        return mapToResponse(race);
    }

    @Transactional
    public RaceResponse updateRace(Long id, RaceRequest req) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));

        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(req.getTournamentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));

        if (raceRepository.existsByCodeAndIdNotAndDeletedAtIsNull(req.getCode(), id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race code already exists");
        }

        LocalDate raceDate = req.getRaceDateTime().toLocalDate();
        if (raceDate.isBefore(tournament.getStartDate()) || raceDate.isAfter(tournament.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Race date must be within the tournament dates (" + tournament.getStartDate() + " to " + tournament.getEndDate() + ")");
        }

        race.update(tournament, req.getName(), req.getRaceDateTime(), req.getDistanceMeters(), req.getMaxParticipants());
        raceRepository.save(race);
        return mapToResponse(race);
    }

    @Transactional
    public void deleteRace(Long id) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
        race.cancel();
        race.softDelete();
        raceRepository.save(race);
    }

    public RaceResponse getRaceDetail(Long id) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
        return mapToResponse(race);
    }

    public List<RaceResponse> getAdminRaces(Long tournamentId) {
        List<Race> races = tournamentId == null
                ? raceRepository.findAllByDeletedAtIsNullOrderByRaceAtAsc()
                : raceRepository.findAllByTournamentIdAndDeletedAtIsNullOrderByRaceAtAsc(tournamentId);

        return races.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RaceResponse updateRaceStatus(Long id, RaceStatus targetStatus) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
        return transitionRaceStatus(race, targetStatus, null);
    }

    /**
     * Lõi chuyển trạng thái race dùng chung cho admin (Cổng 3) và organizer (BR-16):
     * kiểm tra state machine, đẩy prediction lifecycle, và đồng bộ trạng thái RaceResult
     * (SUBMITTED -> CONFIRMED -> PUBLISHED) để kết quả công khai khớp với trạng thái race.
     */
    private RaceResponse transitionRaceStatus(Race race, RaceStatus targetStatus, User confirmer) {
        if (targetStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid race status");
        }

        if (!ALLOWED_STATUS_TRANSITIONS.containsKey(targetStatus) && RaceStatus.CANCELLED != targetStatus) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported race status");
        }

        Set<RaceStatus> allowedTargets = ALLOWED_STATUS_TRANSITIONS.getOrDefault(race.getStatus(), Set.of());
        if (!allowedTargets.contains(targetStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Race status cannot move from " + race.getStatus() + " to " + targetStatus
            );
        }

        RaceStatus previousStatus = race.getStatus();
        race.updateStatus(targetStatus);
        raceRepository.save(race);
        applyPredictionLifecycle(race, previousStatus, targetStatus);
        applyResultGovernance(race, targetStatus, confirmer);
        return mapToResponse(race);
    }

    /**
     * BR-16: gom hồ sơ trọng tài đã nộp (tường trình + sự cố/khiếu nại) để BTC đọc trước khi chốt.
     * Chỉ đọc — không chặn nút Confirm, vì khiếu nại đã được trọng tài xử lý xong tại chỗ.
     */
    @Transactional(readOnly = true)
    public com.example.horseracingtournamentsystem.race.dto.response.RaceReviewPackageResponse
            getOrganizerReviewPackage(Long id, String organizerEmail) {
        Race race = requireOrganizerRace(id, organizerEmail);

        List<com.example.horseracingtournamentsystem.referee.dto.RaceIncidentResponse> incidents =
                violationRepository.findAllByRace_IdOrderByOccurredAtAsc(race.getId()).stream()
                        .map(violation -> {
                            RaceParticipant participant = violation.getParticipant();
                            return new com.example.horseracingtournamentsystem.referee.dto.RaceIncidentResponse(
                                    violation.getId(),
                                    violation.getViolationType(),
                                    participant == null ? null : participant.getId(),
                                    participant == null ? null : participant.getHorse().getName(),
                                    participant == null || participant.getJockey() == null
                                            ? null
                                            : participant.getJockey().getFullName(),
                                    violation.getDescription(),
                                    violation.getPenalty(),
                                    violation.getSeverity(),
                                    violation.getOccurredAt()
                            );
                        })
                        .toList();

        return refereeReportRepository.findFirstByRace_IdOrderByIdDesc(race.getId())
                .map(report -> new com.example.horseracingtournamentsystem.race.dto.response.RaceReviewPackageResponse(
                        report.getTitle(), report.getSummary(), report.getRejectionReason(), incidents))
                .orElseGet(() -> new com.example.horseracingtournamentsystem.race.dto.response.RaceReviewPackageResponse(
                        null, null, null, incidents));
    }

    /** Đồng bộ trạng thái các dòng RaceResult theo trạng thái race khi chốt/công bố. */
    private void applyResultGovernance(Race race, RaceStatus status, User confirmer) {
        if (RaceStatus.RESULT_CONFIRMED == status) {
            for (RaceResult result : raceResultRepository.findByRace_Id(race.getId())) {
                if (ResultRecordStatus.SUBMITTED == result.getStatus()) {
                    result.confirm(confirmer);
                    raceResultRepository.save(result);
                }
            }
        } else if (RaceStatus.PUBLISHED == status) {
            for (RaceResult result : raceResultRepository.findByRace_Id(race.getId())) {
                if (ResultRecordStatus.CONFIRMED == result.getStatus()) {
                    result.publish();
                    raceResultRepository.save(result);
                }
            }
        }
    }

    @Transactional
    public RaceResponse assignReferee(Long id, Long refereeId) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
        User referee = userRepository.findById(refereeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Referee not found"));
        User refereeWithRoles = userRepository.findWithUserRolesByEmail(referee.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Referee not found"));
        if (!refereeWithRoles.getActiveRoleNames().contains("REFEREE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user is not an approved referee");
        }
        // BR-07: referee phải có hợp đồng ACTIVE với giải của race này.
        if (!refereeContractRepository.existsByTournament_IdAndReferee_IdAndStatus(
                race.getTournament().getId(), referee.getId(), RefereeContract.STATUS_ACTIVE)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Referee has no active contract for this tournament");
        }
        // BR-12: chống trùng lịch — không gán nếu referee đã có race khác quanh khung giờ này (±2h).
        long conflicts = raceRepository.countRefereeScheduleConflicts(
                referee.getId(), race.getId(),
                race.getRaceAt().minusHours(2), race.getRaceAt().plusHours(2));
        if (conflicts > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Referee is already assigned to another race around this time");
        }
        race.assignReferee(referee);
        raceRepository.save(race);
        return mapToResponse(race);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Organizer tự vận hành race card + chốt kết quả giải của mình (BR-09 / BR-16).
    // Mọi method dưới đây kiểm tra quyền sở hữu qua Tournament.isManagedBy.
    // ──────────────────────────────────────────────────────────────────────────

    public List<RaceResponse> getOrganizerRaces(Long tournamentId, String organizerEmail) {
        requireOwnedTournament(tournamentId, organizerEmail);
        return raceRepository.findAllByTournamentIdAndDeletedAtIsNullOrderByRaceAtAsc(tournamentId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public RaceResponse getOrganizerRaceDetail(Long id, String organizerEmail) {
        return mapToResponse(requireOrganizerRace(id, organizerEmail));
    }

    public List<RaceParticipantResponse> getOrganizerRaceParticipants(Long id, String organizerEmail) {
        Race race = requireOrganizerRace(id, organizerEmail);
        return raceParticipantRepository.findAllByRace_IdOrderByCreatedAtAsc(race.getId())
                .stream().map(this::mapParticipantToResponse).collect(Collectors.toList());
    }

    public PublicRaceResultResponse getOrganizerRaceResults(Long id, String organizerEmail) {
        Race race = requireOrganizerRace(id, organizerEmail);
        List<RaceResult> results = raceResultRepository.findAllByRace_IdAndStatusInOrderByPositionAscCreatedAtAsc(
                race.getId(),
                Set.of(ResultRecordStatus.SUBMITTED, ResultRecordStatus.CONFIRMED, ResultRecordStatus.PUBLISHED)
        );
        return PublicRaceResultResponse.builder()
                .raceId(race.getId())
                .official(Set.of(RaceStatus.RESULT_CONFIRMED, RaceStatus.PUBLISHED).contains(race.getStatus()))
                .publishedAt(results.stream().map(RaceResult::getPublishedAt).filter(java.util.Objects::nonNull)
                        .max(LocalDateTime::compareTo).orElse(null))
                .entries(results.stream().map(this::mapPublicResultEntry).toList())
                .build();
    }

    @Transactional
    public RaceResponse createRaceForOrganizer(RaceRequest req, String organizerEmail) {
        requireOwnedTournament(req.getTournamentId(), organizerEmail).assertOrganizationOperational();
        return createRace(req, organizerEmail);
    }

    @Transactional
    public RaceResponse updateRaceForOrganizer(Long id, RaceRequest req, String organizerEmail) {
        Race race = requireOrganizerRace(id, organizerEmail);
        race.getTournament().assertOrganizationOperational();
        assertRaceEditable(race);
        Tournament tournament = requireOwnedTournament(req.getTournamentId(), organizerEmail);
        if (raceRepository.existsByCodeAndIdNotAndDeletedAtIsNull(req.getCode(), id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race code already exists");
        }
        LocalDate raceDate = req.getRaceDateTime().toLocalDate();
        if (raceDate.isBefore(tournament.getStartDate()) || raceDate.isAfter(tournament.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Race date must be within the tournament dates (" + tournament.getStartDate() + " to " + tournament.getEndDate() + ")");
        }

        race.update(tournament, req.getName(), req.getRaceDateTime(), req.getDistanceMeters(), req.getMaxParticipants());
        raceRepository.save(race);
        return mapToResponse(race);
    }

    @Transactional
    public void deleteRaceForOrganizer(Long id, String organizerEmail) {
        Race race = requireOrganizerRace(id, organizerEmail);
        race.getTournament().assertOrganizationOperational();
        assertRaceEditable(race);
        race.cancel();
        race.softDelete();
        raceRepository.save(race);
    }

    @Transactional
    public RaceResponse assignRefereeForOrganizer(Long id, Long refereeId, String organizerEmail) {
        requireOrganizerRace(id, organizerEmail).getTournament().assertOrganizationOperational();
        return assignReferee(id, refereeId);
    }

    /** BR-16: organizer chốt kết quả referee đã nộp (RESULT_SUBMITTED -> RESULT_CONFIRMED). */
    @Transactional
    public RaceResponse confirmRaceResults(Long id, String organizerEmail) {
        Race race = requireOrganizerRace(id, organizerEmail);
        race.getTournament().assertOrganizationOperational();
        if (race.getStatus() != RaceStatus.RESULT_SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only races with submitted results can be confirmed (BR-16)");
        }
        User organizer = requireUserByEmail(organizerEmail);
        return transitionRaceStatus(race, RaceStatus.RESULT_CONFIRMED, organizer);
    }

    /** Lên bảng chính thức (RESULT_CONFIRMED -> PUBLISHED): công khai kết quả + cộng điểm standings. */
    @Transactional
    public RaceResponse publishRaceResults(Long id, String organizerEmail) {
        Race race = requireOrganizerRace(id, organizerEmail);
        race.getTournament().assertOrganizationOperational();
        if (race.getStatus() != RaceStatus.RESULT_CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only confirmed results can be published");
        }
        return transitionRaceStatus(race, RaceStatus.PUBLISHED, null);
    }

    /**
     * Trả kết quả về để referee sửa — AN TOÀN vì chỉ cho phép TRƯỚC khi chốt
     * (RESULT_SUBMITTED -> FINISHED): lúc này prediction CHƯA settle (settle ở RESULT_CONFIRMED) và
     * standings CHƯA cộng (ở PUBLISHED) nên không phát sinh clawback. Sau khi đã chốt thì phải xử lý
     * qua luồng tranh chấp/dispute, KHÔNG reopen ở đây. Referee nộp lại bình thường (FINISHED -> RESULT_SUBMITTED).
     */
    @Transactional
    public RaceResponse reopenResultsForOrganizer(Long id, String organizerEmail, String reason) {
        Race race = requireOrganizerRace(id, organizerEmail);
        race.getTournament().assertOrganizationOperational();
        if (race.getStatus() != RaceStatus.RESULT_SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only submitted results that have not been confirmed can be sent back for correction");
        }
        String trimmed = reason == null ? "" : reason.trim();
        if (trimmed.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A reason is required when sending results back for correction");
        }
        // Lý do thuộc về cả gói kết quả -> lưu trên tường trình. Trước đây nó ghi đè
        // RaceResult.note của TỪNG ngựa, xoá mất ghi chú trọng tài đã nhập lúc nộp.
        refereeReportRepository.findFirstByRace_IdOrderByIdDesc(id)
                .ifPresent(report -> report.markReturned(trimmed));
        race.updateStatus(RaceStatus.FINISHED);
        raceRepository.save(race);
        notificationService.notify(race.getReferee(), "RESULT_REOPENED", "Result sent back for correction",
                "“" + race.getName() + "”: " + trimmed, "RACE", race.getId());
        return mapToResponse(race);
    }

    private Tournament requireOwnedTournament(Long tournamentId, String organizerEmail) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(tournamentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        if (!tournament.isManagedBy(organizerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this tournament");
        }
        return tournament;
    }

    private Race requireOrganizerRace(Long id, String organizerEmail) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
        if (!race.getTournament().isManagedBy(organizerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this race");
        }
        return race;
    }

    private void assertRaceEditable(Race race) {
        if (race.getStatus() != RaceStatus.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Race can only be edited before race-day operations begin (status SCHEDULED)");
        }
    }

    private User requireUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public List<RaceResponse> getPublicRaces(Long tournamentId) {
        List<Race> races;
        if (tournamentId != null) {
            races = raceRepository.findAllByTournamentIdAndDeletedAtIsNull(tournamentId);
        } else {
            races = raceRepository.findAllByDeletedAtIsNull();
        }
        return races.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<RaceSummaryResponse> searchPublicRaces(
            String scope,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long tournamentId,
            String search,
            String horse,
            String jockey,
            String sortBy,
            Pageable pageable
    ) {
        String normalizedScope = scope == null ? "UPCOMING" : scope.trim().toUpperCase(Locale.ROOT);
        String normalizedSort = sortBy == null
                ? ("RESULTS".equals(normalizedScope) ? "LATEST_RESULT" : "NEXT_RACE")
                : sortBy.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("UPCOMING", "RESULTS").contains(normalizedScope)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid race discovery scope");
        }
        if (!Set.of("NEXT_RACE", "LATEST_RESULT").contains(normalizedSort)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid race discovery sort");
        }
        if (fromDate != null && toDate != null && toDate.isBefore(fromDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race discovery end date cannot be before start date");
        }

        Page<Race> races = racePublicSearchRepository.search(
                normalizedScope,
                fromDate,
                toDate,
                tournamentId,
                search == null ? "" : search.trim(),
                horse == null ? "" : horse.trim(),
                jockey == null ? "" : jockey.trim(),
                normalizedSort,
                pageable
        );
        if (races.isEmpty()) {
            return races.map(race -> mapToSummary(race, 0, null));
        }

        List<Long> raceIds = races.getContent().stream().map(Race::getId).toList();
        Map<Long, Long> participantCounts = toCountMap(raceParticipantRepository.countActiveByRaceIds(raceIds));
        Map<Long, RaceResult> winners = raceResultRepository
                .findAllByRace_IdInAndPositionAndStatusIn(raceIds, 1, PUBLIC_RESULT_STATUSES)
                .stream()
                .collect(Collectors.toMap(RaceResult::getRaceId, Function.identity(), (first, ignored) -> first));
        return races.map(race -> mapToSummary(
                race,
                participantCounts.getOrDefault(race.getId(), 0L),
                winners.get(race.getId())
        ));
    }

    public PublicRaceResultResponse getPublicRaceResults(Long raceId) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(raceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
        boolean official = Set.of(RaceStatus.RESULT_CONFIRMED, RaceStatus.PUBLISHED).contains(race.getStatus());
        if (!official) {
            return PublicRaceResultResponse.builder()
                    .raceId(raceId)
                    .official(false)
                    .entries(List.of())
                    .build();
        }
        List<RaceResult> results = raceResultRepository
                .findAllByRace_IdAndStatusInOrderByPositionAscCreatedAtAsc(raceId, PUBLIC_RESULT_STATUSES);
        return PublicRaceResultResponse.builder()
                .raceId(raceId)
                .official(true)
                .publishedAt(results.stream().map(RaceResult::getPublishedAt).filter(java.util.Objects::nonNull)
                        .max(LocalDateTime::compareTo).orElse(null))
                .entries(results.stream().map(this::mapPublicResultEntry).toList())
                .build();
    }

    public PublicRacingSummaryResponse getPublicRacingSummary() {
        return PublicRacingSummaryResponse.builder()
                .raceCount(raceRepository.countByDeletedAtIsNull())
                .raceDayCount(raceRepository.countDistinctRaceDays())
                .championshipCount(tournamentRepository.countByStatusInAndDeletedAtIsNull(PUBLIC_TOURNAMENT_STATUSES))
                .seasonFinale(tournamentRepository.findPublicSeasonFinale(PUBLIC_TOURNAMENT_STATUSES))
                .build();
    }

    public List<RaceParticipantResponse> getRaceParticipants(Long raceId) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(raceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
        return raceParticipantRepository.findAllByRace_IdOrderByCreatedAtAsc(race.getId())
                .stream()
                .map(this::mapParticipantToResponse)
                .collect(Collectors.toList());
    }

    public List<JockeyScheduleItemResponse> getJockeySchedule(String jockeyEmail) {
        User jockey = userRepository.findWithUserRolesByEmail(jockeyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!jockey.getActiveRoleNames().contains("JOCKEY")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only approved jockeys can view race schedule");
        }
        return raceParticipantRepository
                .findAllByJockey_EmailAndRace_Tournament_StatusInOrderByRace_RaceAtAsc(
                        jockeyEmail,
                        VISIBLE_JOCKEY_SCHEDULE_STATUSES
                )
                .stream()
                .map(this::mapToJockeyScheduleItem)
                .collect(Collectors.toList());
    }

    private RaceResponse mapToResponse(Race r) {
        return RaceResponse.builder()
                .id(r.getId())
                .tournamentId(r.getTournament().getId())
                .tournamentName(r.getTournament().getName())
                .name(r.getName())
                .code(r.getCode())
                .raceDateTime(r.getRaceAt())
                .distanceMeters(r.getDistanceMeter())
                .maxParticipants(r.getMaxParticipants())
                .status(r.getStatus())
                .refereeId(r.getReferee() == null ? null : r.getReferee().getId())
                .refereeName(r.getReferee() == null ? null : r.getReferee().getFullName())
                .creatorName(r.getCreatedBy().getFullName())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    private RaceSummaryResponse mapToSummary(Race race, long participantCount, RaceResult winner) {
        boolean resultOfficial = Set.of(RaceStatus.RESULT_CONFIRMED, RaceStatus.PUBLISHED).contains(race.getStatus());
        return RaceSummaryResponse.builder()
                .id(race.getId())
                .name(race.getName())
                .roundName(race.getRoundName())
                .code(race.getCode())
                .tournamentId(race.getTournament().getId())
                .tournamentName(race.getTournament().getName())
                .raceDateTime(race.getRaceAt())
                .location(race.getTrackName() == null ? race.getTournament().getLocation() : race.getTrackName())
                .distanceMeters(race.getDistanceMeter())
                .maxParticipants(race.getMaxParticipants())
                .participantCount(participantCount)
                .status(race.getStatus())
                .predictionOpen(RaceStatus.SCHEDULED == race.getStatus() && race.getRaceAt().isAfter(LocalDateTime.now()))
                .predictionCloseTime(race.getRaceAt())
                .resultOfficial(resultOfficial)
                .winner(!resultOfficial || winner == null ? null : RaceSummaryResponse.WinnerSummary.builder()
                        .horseName(winner.getParticipant().getHorse().getName())
                        .jockeyName(winner.getParticipant().getJockey() == null
                                ? null : winner.getParticipant().getJockey().getFullName())
                        .finishTimeSeconds(winner.getFinishTimeSeconds())
                        .build())
                .build();
    }

    private PublicRaceResultResponse.Entry mapPublicResultEntry(RaceResult result) {
        RaceParticipant participant = result.getParticipant();
        return PublicRaceResultResponse.Entry.builder()
                .raceParticipantId(participant.getId())
                .startNumber(participant.getStartNumber())
                .laneNumber(participant.getLaneNumber())
                .position(result.getPosition())
                .horseName(participant.getHorse().getName())
                .jockeyName(participant.getJockey() == null
                        ? null : participant.getJockey().getFullName())
                .finishTimeSeconds(result.getFinishTimeSeconds())
                .penaltySeconds(result.getPenaltySeconds())
                .points(result.getPoints())
                .resultStatus(result.getResultStatus().name())
                .build();
    }

    private RaceParticipantResponse mapParticipantToResponse(RaceParticipant participant) {
        Race race = participant.getRace();
        return RaceParticipantResponse.builder()
                .id(participant.getId())
                .raceId(race.getId())
                .raceName(race.getName())
                .championshipId(race.getTournament().getId())
                .championshipName(race.getTournament().getName())
                .invitationId(participant.getInvitation() == null ? null : participant.getInvitation().getId())
                .horseId(participant.getHorse().getId())
                .horseName(participant.getHorse().getName())
                .ownerId(participant.getOwner().getId())
                .ownerName(participant.getOwner().getFullName())
                .jockeyId(participant.getJockey() == null ? null : participant.getJockey().getId())
                .jockeyName(participant.getJockey() == null ? null : participant.getJockey().getFullName())
                .startNumber(participant.getStartNumber())
                .laneNumber(participant.getLaneNumber())
                .confirmationStatus(participant.getConfirmationStatus())
                .checkStatus(participant.getCheckStatus())
                .status(participant.getStatus())
                .createdAt(participant.getCreatedAt())
                .updatedAt(participant.getUpdatedAt())
                .build();
    }

    private JockeyScheduleItemResponse mapToJockeyScheduleItem(RaceParticipant participant) {
        Race race = participant.getRace();
        return JockeyScheduleItemResponse.builder()
                .raceParticipantId(participant.getId())
                .raceId(race.getId())
                .raceName(race.getName())
                .raceCode(race.getCode())
                .raceAt(race.getRaceAt())
                .distanceMeters(race.getDistanceMeter())
                .raceStatus(race.getStatus())
                .championshipId(race.getTournament().getId())
                .championshipName(race.getTournament().getName())
                .championshipStatus(race.getTournament().getStatus())
                .horseId(participant.getHorse().getId())
                .horseName(participant.getHorse().getName())
                .ownerId(participant.getOwner().getId())
                .ownerName(participant.getOwner().getFullName())
                .startNumber(participant.getStartNumber())
                .laneNumber(participant.getLaneNumber())
                .confirmationStatus(participant.getConfirmationStatus())
                .checkStatus(participant.getCheckStatus())
                .participantStatus(participant.getStatus())
                .build();
    }

    private void applyPredictionLifecycle(Race race, RaceStatus previousStatus, RaceStatus normalizedStatus) {
        if (RaceStatus.CANCELLED == normalizedStatus) {
            predictionService.refundCancelledRace(race.getId());
            return;
        }
        if (RaceStatus.SCHEDULED == previousStatus && RaceStatus.SCHEDULED != normalizedStatus) {
            predictionService.lockPredictionsForRace(race.getId());
        }
        if (RaceStatus.RESULT_CONFIRMED == normalizedStatus) {
            predictionService.createSettlementJob(race.getId());
        }
        if (RaceStatus.PUBLISHED == normalizedStatus) {
            updateTournamentStandings(race);
        }
    }

    private void updateTournamentStandings(Race race) {
        List<RaceResult> results = raceResultRepository.findByRace_Id(race.getId());
        for (RaceResult result : results) {
            if (result.getPoints() > 0) {
                // Find tournament participant using horse ID since horse is unique per tournament
                tournamentParticipantRepository.findAllByTournament_IdOrderByCreatedAtDesc(race.getTournament().getId())
                    .stream()
                    .filter(tp -> tp.getHorse().getId().equals(result.getParticipant().getHorse().getId()))
                    .findFirst()
                    .ifPresent(tp -> {
                        tp.addPoints(result.getPoints());
                        tournamentParticipantRepository.save(tp);
                    });
            }
        }
    }
}
