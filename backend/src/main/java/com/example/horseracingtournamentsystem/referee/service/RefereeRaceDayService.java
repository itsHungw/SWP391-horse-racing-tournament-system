package com.example.horseracingtournamentsystem.referee.service;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.prediction.service.PredictionService;
import com.example.horseracingtournamentsystem.referee.dto.ParticipantCheckRequest;
import com.example.horseracingtournamentsystem.referee.dto.ParticipantResultEntry;
import com.example.horseracingtournamentsystem.referee.dto.ParticipantVerificationResponse;
import com.example.horseracingtournamentsystem.referee.dto.RefereeRaceResponse;
import com.example.horseracingtournamentsystem.referee.dto.RefereeReportRequest;
import com.example.horseracingtournamentsystem.referee.dto.SubmitResultsRequest;
import com.example.horseracingtournamentsystem.referee.dto.ViolationRequest;
import com.example.horseracingtournamentsystem.referee.entity.PreRaceCheck;
import com.example.horseracingtournamentsystem.referee.entity.RefereeReport;
import com.example.horseracingtournamentsystem.referee.entity.Violation;
import com.example.horseracingtournamentsystem.referee.repository.PreRaceCheckRepository;
import com.example.horseracingtournamentsystem.referee.repository.RefereeReportRepository;
import com.example.horseracingtournamentsystem.referee.repository.ViolationRepository;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.enums.ParticipantCheckStatus;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus;
import com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RefereeRaceDayService {

    private static final List<TournamentStatus> VISIBLE_CHAMPIONSHIP_STATUSES = List.of(
            TournamentStatus.SCHEDULE_PUBLISHED,
            TournamentStatus.ONGOING,
            TournamentStatus.COMPLETED
    );

    private static final Set<ParticipantCheckStatus> COMPLETE_CHECK_STATUSES = Set.of(
            ParticipantCheckStatus.PASSED,
            ParticipantCheckStatus.FAILED,
            ParticipantCheckStatus.CONDITIONAL
    );

    private final RaceRepository raceRepository;
    private final RaceParticipantRepository raceParticipantRepository;
    private final PreRaceCheckRepository preRaceCheckRepository;
    private final RaceResultRepository raceResultRepository;
    private final RefereeReportRepository refereeReportRepository;
    private final ViolationRepository violationRepository;
    private final UserRepository userRepository;
    private final PredictionService predictionService;

    public List<RefereeRaceResponse> listAssignedRaces(String refereeEmail) {
        return raceRepository
                .findAllByReferee_EmailAndTournament_StatusInAndDeletedAtIsNullOrderByRaceAtAsc(
                        refereeEmail,
                        VISIBLE_CHAMPIONSHIP_STATUSES
                )
                .stream()
                .map(this::mapRace)
                .toList();
    }

    public RefereeRaceResponse getRace(Long raceId, String refereeEmail) {
        return mapRace(requireAssignedVisibleRace(raceId, refereeEmail));
    }

    public List<ParticipantVerificationResponse> getParticipants(Long raceId, String refereeEmail) {
        Race race = requireAssignedVisibleRace(raceId, refereeEmail);
        return raceParticipantRepository.findAllByRace_IdOrderByCreatedAtAsc(race.getId())
                .stream()
                .map(this::mapParticipant)
                .toList();
    }

    @Transactional
    public List<ParticipantVerificationResponse> savePreRaceChecks(
            Long raceId,
            String refereeEmail,
            List<ParticipantCheckRequest> checks
    ) {
        Race race = requireAssignedVisibleRace(raceId, refereeEmail);
        User referee = requireUser(refereeEmail);

        if (RaceStatus.SCHEDULED.equals(race.getStatus())) {
            race.updateStatus(RaceStatus.CHECKING);
            predictionService.lockPredictionsForRace(race.getId());
        }

        if (!RaceStatus.CHECKING.equals(race.getStatus()) && !RaceStatus.READY.equals(race.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race is not accepting pre-race checks");
        }

        for (ParticipantCheckRequest request : checks) {
            RaceParticipant participant = raceParticipantRepository
                    .findByIdAndRace_Id(request.participantId(), race.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participant is not in this race"));
            ParticipantCheckStatus result = normalizeCheckResult(request);
            if (ParticipantCheckStatus.NOT_CHECKED.equals(result)) {
                participant.updateCheck(ParticipantCheckStatus.NOT_CHECKED, participant.getStatus(), request.note());
                continue;
            }

            ParticipantStatus participantStatus = ParticipantCheckStatus.FAILED.equals(result)
                    ? ParticipantStatus.WITHDRAWN
                    : ParticipantStatus.APPROVED;
            participant.updateCheck(result, participantStatus, request.note());

            PreRaceCheck check = preRaceCheckRepository
                    .findByRace_IdAndParticipant_Id(race.getId(), participant.getId())
                    .orElseGet(() -> PreRaceCheck.create(race, participant, referee));
            boolean gearOk = Boolean.TRUE.equals(request.gearOk());
            boolean healthOk = Boolean.TRUE.equals(request.healthOk());
            check.update(true, true, gearOk, healthOk, true, result.name(), request.note());
            preRaceCheckRepository.save(check);
        }

        List<RaceParticipant> participants = raceParticipantRepository.findAllByRace_IdOrderByCreatedAtAsc(race.getId());
        if (!participants.isEmpty() && participants.stream().allMatch(p -> COMPLETE_CHECK_STATUSES.contains(p.getCheckStatus()))) {
            race.updateStatus(RaceStatus.READY);
        }

        return participants.stream().map(this::mapParticipant).toList();
    }

    @Transactional
    public RefereeRaceResponse startRace(Long raceId, String refereeEmail) {
        Race race = requireAssignedVisibleRace(raceId, refereeEmail);
        if (!RaceStatus.READY.equals(race.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race must be ready before it can start");
        }
        boolean hasActiveParticipant = raceParticipantRepository
                .findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(race.getId(), ParticipantStatus.WITHDRAWN)
                .stream()
                .anyMatch(p -> !ParticipantStatus.DISQUALIFIED.equals(p.getStatus()));
        if (!hasActiveParticipant) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race needs at least one active participant");
        }
        race.updateStatus(RaceStatus.ONGOING);
        return mapRace(race);
    }

    @Transactional
    public RefereeRaceResponse finishRace(Long raceId, String refereeEmail) {
        Race race = requireAssignedVisibleRace(raceId, refereeEmail);
        if (!RaceStatus.ONGOING.equals(race.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race must be ongoing before it can finish");
        }
        race.updateStatus(RaceStatus.FINISHED);
        return mapRace(race);
    }

    public List<ParticipantResultEntry> getResultEntries(Long raceId, String refereeEmail) {
        Race race = requireAssignedVisibleRace(raceId, refereeEmail);
        List<RaceResult> results = raceResultRepository.findAllByRace_IdOrderByPositionAscCreatedAtAsc(race.getId());
        if (!results.isEmpty()) {
            return results.stream()
                    .map(result -> new ParticipantResultEntry(
                            result.getParticipant().getId(),
                            result.getParticipant().getHorse().getName(),
                            result.getParticipant().getJockey() == null ? "Unassigned" : result.getParticipant().getJockey().getFullName(),
                            result.getPosition(),
                            result.getRawFinishTimeSeconds(),
                            result.getPenaltySeconds(),
                            result.getFinishTimeSeconds(),
                            result.getResultStatus().name(),
                            result.getNote()
                    ))
                    .toList();
        }

        return raceParticipantRepository.findAllByRace_IdOrderByCreatedAtAsc(race.getId())
                .stream()
                .map(participant -> new ParticipantResultEntry(
                        participant.getId(),
                        participant.getHorse().getName(),
                        participant.getJockey() == null ? "Unassigned" : participant.getJockey().getFullName(),
                        null,
                        null,
                        BigDecimal.ZERO,
                        null,
                        "FINISHED",
                        null
                ))
                .toList();
    }

    @Transactional
    public RefereeRaceResponse submitResults(Long raceId, String refereeEmail, SubmitResultsRequest request) {
        Race race = requireAssignedVisibleRace(raceId, refereeEmail);
        if (!RaceStatus.FINISHED.equals(race.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race must be finished before results can be submitted");
        }
        User referee = requireUser(refereeEmail);
        boolean flaggedForReview = Boolean.TRUE.equals(request.requiresAdminReview());
        if (flaggedForReview && (request.reviewReason() == null || request.reviewReason().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review reason is required");
        }

        Map<Long, RaceParticipant> participantsById = validateResultPackage(race, request.results());
        // BR-16 (phân tách trách nhiệm): referee chỉ NỘP kết quả, Ban tổ chức mới chốt (RESULT_CONFIRMED).
        // Vì vậy kết quả luôn ở trạng thái SUBMITTED và race -> RESULT_SUBMITTED, chờ organizer xác nhận.
        ResultRecordStatus resultStatus = ResultRecordStatus.SUBMITTED;
        for (ParticipantResultEntry entry : request.results()) {
            RaceParticipant participant = participantsById.get(entry.participantId());
            RaceResult result = raceResultRepository.findByRace_IdAndParticipant_Id(race.getId(), participant.getId())
                    .orElseGet(() -> RaceResult.create(race, participant, referee));
            ResultFinishStatus entryStatus = normalizeResultStatus(entry.status());
            Integer position = ResultFinishStatus.FINISHED.equals(entryStatus) ? entry.position() : null;
            BigDecimal penaltySeconds = entry.penaltySeconds() == null ? BigDecimal.ZERO : entry.penaltySeconds();
            BigDecimal rawFinishTimeSeconds = entry.rawFinishTimeSeconds();
            BigDecimal finalFinishTimeSeconds = entry.finishTimeSeconds();
            if (rawFinishTimeSeconds != null) {
                finalFinishTimeSeconds = rawFinishTimeSeconds.add(penaltySeconds);
            }
            result.submit(
                    position,
                    rawFinishTimeSeconds,
                    penaltySeconds,
                    finalFinishTimeSeconds,
                    entryStatus,
                    resultStatus,
                    referee,
                    entry.note()
            );
            raceResultRepository.save(result);
        }

        RefereeReport report = refereeReportRepository.findByRace_IdAndReferee_Email(race.getId(), refereeEmail)
                .orElseGet(() -> RefereeReport.create(race, referee));
        String reportSummary = request.reportSummary();
        if (flaggedForReview) {
            reportSummary = ((reportSummary == null || reportSummary.isBlank()) ? "" : reportSummary + "\n\n")
                    + "Review requested by referee: " + request.reviewReason();
        }
        report.submit(
                request.reportTitle() == null || request.reportTitle().isBlank() ? race.getName() + " result package" : request.reportTitle(),
                reportSummary,
                RefereeReport.STATUS_SUBMITTED
        );
        refereeReportRepository.save(report);

        // BR-16: referee chỉ NỘP, race -> RESULT_SUBMITTED; settlement job tạo khi organizer chốt (RESULT_CONFIRMED).
        race.updateStatus(RaceStatus.RESULT_SUBMITTED);
        return mapRace(race);
    }

    @Transactional
    public void logIncident(Long raceId, String refereeEmail, ViolationRequest request) {
        Race race = requireAssignedVisibleRace(raceId, refereeEmail);
        User referee = requireUser(refereeEmail);
        RaceParticipant participant = request.offenderId() == null
                ? null
                : raceParticipantRepository.findByIdAndRace_Id(request.offenderId(), race.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participant is not in this race"));
        String description = request.description() == null || request.description().isBlank()
                ? "Incident logged by referee"
                : request.description();
        violationRepository.save(Violation.create(
                race,
                participant,
                referee,
                request.violationType(),
                description,
                request.penalty(),
                request.severity()
        ));
    }

    @Transactional
    public void submitReport(Long raceId, String refereeEmail, RefereeReportRequest request) {
        Race race = requireAssignedVisibleRace(raceId, refereeEmail);
        User referee = requireUser(refereeEmail);
        RefereeReport report = refereeReportRepository.findByRace_IdAndReferee_Email(race.getId(), refereeEmail)
                .orElseGet(() -> RefereeReport.create(race, referee));
        report.submit(
                request.title() == null || request.title().isBlank() ? race.getName() + " referee report" : request.title(),
                request.summary(),
                RefereeReport.STATUS_SUBMITTED
        );
        refereeReportRepository.save(report);
    }

    @Transactional
    public RefereeRaceResponse advanceNextStep(Long raceId, String refereeEmail) {
        Race race = requireAssignedVisibleRace(raceId, refereeEmail);
        return switch (race.getStatus()) {
            case SCHEDULED -> {
                race.updateStatus(RaceStatus.CHECKING);
                predictionService.lockPredictionsForRace(race.getId());
                yield mapRace(race);
            }
            case CHECKING -> {
                List<RaceParticipant> participants = raceParticipantRepository.findAllByRace_IdOrderByCreatedAtAsc(race.getId());
                if (participants.stream().anyMatch(p -> !COMPLETE_CHECK_STATUSES.contains(p.getCheckStatus()))) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All participants must be verified before proceeding");
                }
                race.updateStatus(RaceStatus.READY);
                yield mapRace(race);
            }
            case READY -> startRace(raceId, refereeEmail);
            case ONGOING -> finishRace(raceId, refereeEmail);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid race status path");
        };
    }

    private Race requireAssignedVisibleRace(Long raceId, String refereeEmail) {
        Race race = raceRepository.findByIdAndReferee_EmailAndDeletedAtIsNull(raceId, refereeEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assigned race not found"));
        if (!VISIBLE_CHAMPIONSHIP_STATUSES.contains(race.getTournament().getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Race schedule is not published");
        }
        return race;
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private RefereeRaceResponse mapRace(Race race) {
        int participantCount = raceParticipantRepository.findAllByRace_IdOrderByCreatedAtAsc(race.getId()).size();
        User referee = race.getReferee();
        return new RefereeRaceResponse(
                race.getId(),
                race.getName(),
                race.getCode(),
                race.getDistanceMeter(),
                race.getStatus().name(),
                race.getRaceAt(),
                race.getTournament().getLocation(),
                race.getTournament().getId(),
                race.getTournament().getName(),
                referee == null ? null : referee.getId(),
                referee == null ? null : referee.getFullName(),
                participantCount,
                nextAction(race.getStatus())
        );
    }

    private ParticipantVerificationResponse mapParticipant(RaceParticipant participant) {
        return new ParticipantVerificationResponse(
                participant.getId(),
                participant.getHorse().getName(),
                participant.getJockey() == null ? "Unassigned" : participant.getJockey().getFullName(),
                participant.getWeightCarriedKg(),
                ParticipantCheckStatus.PASSED.equals(participant.getCheckStatus())
                        || ParticipantCheckStatus.CONDITIONAL.equals(participant.getCheckStatus()),
                !ParticipantCheckStatus.FAILED.equals(participant.getCheckStatus()),
                switch (participant.getCheckStatus()) {
                    case PASSED, CONDITIONAL -> "PASSED";
                    case FAILED -> "FAILED";
                    default -> "PENDING";
                }
        );
    }

    private ParticipantCheckStatus normalizeCheckResult(ParticipantCheckRequest request) {
        String requested = request.status() == null ? "" : request.status().trim().toUpperCase();
        if ("PENDING".equals(requested)) {
            return ParticipantCheckStatus.NOT_CHECKED;
        }
        if (ParticipantCheckStatus.CONDITIONAL.name().equals(requested)) {
            if (request.note() == null || request.note().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conditional checks require a note");
            }
            return ParticipantCheckStatus.CONDITIONAL;
        }
        if ("FAILED".equals(requested) || Boolean.FALSE.equals(request.gearOk()) || Boolean.FALSE.equals(request.healthOk())) {
            return ParticipantCheckStatus.FAILED;
        }
        return ParticipantCheckStatus.PASSED;
    }

    private ResultFinishStatus normalizeResultStatus(String status) {
        String normalized = status == null ? "FINISHED" : status.trim().toUpperCase();
        return switch (normalized) {
            case "FINISHED" -> ResultFinishStatus.FINISHED;
            case "DISQUALIFIED" -> ResultFinishStatus.DISQUALIFIED;
            case "DID_NOT_FINISH" -> ResultFinishStatus.DID_NOT_FINISH;
            case "WITHDRAWN" -> ResultFinishStatus.WITHDRAWN;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported result status");
        };
    }

    private Map<Long, RaceParticipant> validateResultPackage(Race race, List<ParticipantResultEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Result list cannot be empty");
        }

        List<RaceParticipant> participants = raceParticipantRepository.findAllByRace_IdOrderByCreatedAtAsc(race.getId());
        Map<Long, RaceParticipant> participantsById = new HashMap<>();
        for (RaceParticipant participant : participants) {
            participantsById.put(participant.getId(), participant);
        }

        Set<Long> submittedParticipantIds = new HashSet<>();
        Set<Integer> submittedPositions = new HashSet<>();
        for (ParticipantResultEntry entry : entries) {
            if (entry.participantId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participant ID is required");
            }
            if (!participantsById.containsKey(entry.participantId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participant is not in this race");
            }
            if (!submittedParticipantIds.add(entry.participantId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate participant result entry");
            }

            ResultFinishStatus entryStatus = normalizeResultStatus(entry.status());
            BigDecimal penaltySeconds = entry.penaltySeconds() == null ? BigDecimal.ZERO : entry.penaltySeconds();
            if (isNegative(penaltySeconds)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Penalty seconds cannot be negative");
            }
            if (isNegative(entry.rawFinishTimeSeconds()) || isNegative(entry.finishTimeSeconds())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Finish time cannot be negative");
            }

            if (ResultFinishStatus.FINISHED == entryStatus) {
                if (entry.position() == null || entry.position() < 1) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Finished participants require a positive position");
                }
                if (!submittedPositions.add(entry.position())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate finish position");
                }
                if (entry.rawFinishTimeSeconds() == null && entry.finishTimeSeconds() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Finished participants require a finish time");
                }
                if (entry.rawFinishTimeSeconds() != null && entry.finishTimeSeconds() != null) {
                    BigDecimal expected = entry.rawFinishTimeSeconds().add(penaltySeconds);
                    if (expected.compareTo(entry.finishTimeSeconds()) != 0) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Final finish time must equal raw finish time plus penalty");
                    }
                }
            } else if (entry.position() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only finished participants can have a position");
            }
        }

        Set<Long> expectedParticipantIds = participantsById.keySet();
        if (!submittedParticipantIds.equals(expectedParticipantIds)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Results must include every race participant exactly once");
        }
        return participantsById;
    }

    private boolean isNegative(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) < 0;
    }

    private String nextAction(RaceStatus status) {
        return Map.of(
                RaceStatus.SCHEDULED, "Start Checks",
                RaceStatus.CHECKING, "Continue Checks",
                RaceStatus.READY, "Start Race",
                RaceStatus.ONGOING, "Finish Race",
                RaceStatus.FINISHED, "Submit Results",
                RaceStatus.RESULT_SUBMITTED, "Awaiting Organizer Confirmation",
                RaceStatus.RESULT_CONFIRMED, "View Final Result",
                RaceStatus.PUBLISHED, "View Final Result"
        ).getOrDefault(status, "View Race");
    }
}
