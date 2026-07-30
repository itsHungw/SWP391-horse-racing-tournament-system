package com.example.horseracingtournamentsystem.prediction.controller;

import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.prediction.dto.response.AdminRaceSummaryResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.AdminRaceDetailResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.AdminAuditPredictionResponse;
import com.example.horseracingtournamentsystem.prediction.dto.request.UpdatePredictionSettingRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionSettingResponse;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSetting;
import com.example.horseracingtournamentsystem.prediction.dto.response.AdminStreakPredictionResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.AdminStreakPredictionLegResponse;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettingRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import java.math.BigDecimal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/predictions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPredictionController {

    private final PredictionSettlementJobRepository jobRepo;
    private final RacePredictionRepository predictionRepo;
    private final RaceRepository raceRepo;
    private final RaceResultRepository resultRepo;
    private final PredictionSettingRepository predictionSettingRepo;
    private final UserRepository userRepository;
    private final StreakPredictionRepository streakRepo;

    public AdminPredictionController(PredictionSettlementJobRepository jobRepo,
                                     RacePredictionRepository predictionRepo,
                                     RaceRepository raceRepo,
                                     RaceResultRepository resultRepo,
                                     PredictionSettingRepository predictionSettingRepo,
                                     UserRepository userRepository,
                                     StreakPredictionRepository streakRepo) {
        this.jobRepo = jobRepo;
        this.predictionRepo = predictionRepo;
        this.raceRepo = raceRepo;
        this.resultRepo = resultRepo;
        this.predictionSettingRepo = predictionSettingRepo;
        this.userRepository = userRepository;
        this.streakRepo = streakRepo;
    }

    // API lấy danh sách tất cả các dự đoán chuỗi (Streak Predictions) của người chơi
    @GetMapping("/streaks")
    public ResponseEntity<List<AdminStreakPredictionResponse>> getStreaks() {
        List<StreakPrediction> streaks = streakRepo.findAll();
        
        List<AdminStreakPredictionResponse> response = streaks.stream().map(s -> {
            List<AdminStreakPredictionLegResponse> legs = s.getLegs().stream().map(leg -> 
                AdminStreakPredictionLegResponse.builder()
                    .id(leg.getId())
                    .raceId(leg.getRace().getId())
                    .raceName(leg.getRace().getName())
                    .predictedWinnerId(leg.getPredictedWinner().getId())
                    .predictedWinnerName(leg.getPredictedWinner().getHorse().getName())
                    .lockedOdds(leg.getLockedOdds())
                    .status(leg.getStatus())
                    .build()
            ).collect(java.util.stream.Collectors.toList());

            return AdminStreakPredictionResponse.builder()
                .id(s.getId())
                .spectatorId(s.getSpectator().getId())
                .spectatorName(s.getSpectator().getFullName())
                .spectatorEmail(s.getSpectator().getEmail())
                .tournamentId(s.getTournament().getId())
                .tournamentName(s.getTournament().getName())
                .wagerAmount(s.getWagerAmount())
                .totalOdds(s.getTotalOdds())
                .status(s.getStatus())
                .rewardPoints(s.getRewardPoints())
                .createdAt(s.getCreatedAt())
                .evaluatedAt(s.getEvaluatedAt())
                .legs(legs)
                .build();
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    // API lấy danh sách tóm tắt tất cả các cuộc đua và thông tin cược tương ứng
    @GetMapping("/races")
    public ResponseEntity<List<AdminRaceSummaryResponse>> getRaces() {
        List<Race> races = raceRepo.findAll();
        List<AdminRaceSummaryResponse> response = races.stream().map(r -> {
            AdminRaceSummaryResponse s = new AdminRaceSummaryResponse();
            s.setRaceId(r.getId());
            s.setRaceName(r.getName());
            s.setRoundName(r.getRoundName());
            if (r.getTournament() != null) {
                s.setTournamentId(r.getTournament().getId());
                s.setTournamentName(r.getTournament().getName());
            }
            s.setRaceAt(r.getRaceAt());
            s.setRaceStatus(r.getStatus().name());

            // Counts
            List<RacePrediction> preds = predictionRepo.findByRace_Id(r.getId());
            s.setTotalPredictions(preds.size());
            s.setWinnerPickCount(preds.stream().filter(p -> RacePrediction.TYPE_WINNER.equals(p.getPredictionType())).count());

            // Settlement Job Status
            PredictionSettlementJob job = jobRepo.findByRace_Id(r.getId()).orElse(null);
            String predStatus = "OPEN";
            if (RaceStatus.CANCELLED == r.getStatus()) {
                predStatus = "REFUNDED";
            } else if (job != null) {
                // Map job status directly to UI prediction status
                if (PredictionSettlementJobStatus.PENDING == job.getStatus()) {
                    predStatus = "SETTLEMENT_PENDING";
                } else {
                    predStatus = job.getStatus().name(); // PROCESSING, COMPLETED, FAILED
                }
                s.setSettlementJobStatus(job.getStatus().name());
            } else if (RaceStatus.SCHEDULED != r.getStatus()) {
                predStatus = "LOCKED";
            }
            s.setPredictionStatus(predStatus);

            // Correct/Incorrect totals
            s.setCorrectWinnerCount(preds.stream().filter(p -> PredictionStatus.CORRECT == p.getStatus()).count());
            s.setIncorrectCount(preds.stream().filter(p -> PredictionStatus.INCORRECT == p.getStatus()).count());

            return s;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    // API lấy thông tin chi tiết về cược của một cuộc đua cụ thể (dựa vào raceId)
    @GetMapping("/races/{raceId}")
    public ResponseEntity<AdminRaceDetailResponse> getRaceDetail(@PathVariable Long raceId) {
        Race r = raceRepo.findById(raceId)
            .orElseThrow(() -> new IllegalArgumentException("Race not found: " + raceId));

        AdminRaceDetailResponse d = new AdminRaceDetailResponse();
        d.setRaceId(r.getId());
        d.setRaceName(r.getName());
        d.setRoundName(r.getRoundName());
        if (r.getTournament() != null) {
            d.setTournamentName(r.getTournament().getName());
        }
        d.setRaceStatus(r.getStatus().name());

        PredictionSettlementJob job = jobRepo.findByRace_Id(r.getId()).orElse(null);
        String predStatus = "OPEN";
        if (RaceStatus.CANCELLED == r.getStatus()) {
            predStatus = "REFUNDED";
        } else if (job != null) {
            if (PredictionSettlementJobStatus.PENDING == job.getStatus()) {
                predStatus = "SETTLEMENT_PENDING";
            } else {
                predStatus = job.getStatus().name();
            }
        } else if (RaceStatus.SCHEDULED != r.getStatus()) {
            predStatus = "LOCKED";
        }
        d.setPredictionStatus(predStatus);

        List<RacePrediction> preds = predictionRepo.findByRace_Id(r.getId());
        AdminRaceDetailResponse.SummaryInfo s = new AdminRaceDetailResponse.SummaryInfo();
        s.setTotalPredictions(preds.size());
        s.setWinnerPickCount(preds.stream().filter(p -> RacePrediction.TYPE_WINNER.equals(p.getPredictionType())).count());

        s.setWinnerCorrectCount(preds.stream().filter(p -> PredictionStatus.CORRECT == p.getStatus()).count());
        s.setIncorrectCount(preds.stream().filter(p -> PredictionStatus.INCORRECT == p.getStatus()).count());
        s.setRefundedCount(preds.stream().filter(p -> PredictionStatus.REFUNDED == p.getStatus()).count());
        s.setRewardedPoints(preds.stream().mapToLong(RacePrediction::getRewardPoints).sum());
        d.setSummary(s);

        if (job != null) {
            AdminRaceDetailResponse.SettlementJobInfo j = new AdminRaceDetailResponse.SettlementJobInfo();
            j.setId(job.getId());
            j.setStatus(job.getStatus());
            j.setProcessedCount(job.getProcessedCount());
            j.setRewardedCount(job.getRewardedCount());
            j.setFailedCount(job.getFailedCount());
            j.setRetryCount(job.getRetryCount());
            j.setErrorMessage(job.getErrorMessage());
            j.setStartedAt(job.getStartedAt());
            j.setCompletedAt(job.getCompletedAt());
            d.setSettlementJob(j);
        }

        return ResponseEntity.ok(d);
    }

    // API lấy danh sách chi tiết các vé cược (Audit) của một cuộc đua cụ thể
    @GetMapping("/races/{raceId}/predictions")
    public ResponseEntity<List<AdminAuditPredictionResponse>> getRacePredictions(@PathVariable Long raceId) {
        List<RacePrediction> preds = predictionRepo.findByRace_Id(raceId);
        
        // Fetch participant horse names map to construct displays
        List<Object[]> rawHorses = predictionRepo.findParticipantHorseNamesByRaceId(raceId);
        Map<Long, String> participantHorseNames = rawHorses.stream()
            .collect(Collectors.toMap(
                row -> ((Number) row[0]).longValue(),
                row -> (String) row[1],
                (h1, h2) -> h1
            ));

        List<AdminAuditPredictionResponse> response = preds.stream().map(p -> {
            AdminAuditPredictionResponse r = new AdminAuditPredictionResponse();
            r.setPredictionId(p.getId());
            if (p.getSpectator() != null) {
                r.setSpectatorName(p.getSpectator().getFullName());
                r.setSpectatorEmail(p.getSpectator().getEmail());
            }
            r.setPredictionType(p.getPredictionType());
            
            // Build selected horse names list
            List<String> selections = new ArrayList<>();
            String pickedHorse = participantHorseNames.getOrDefault(p.getPredictedWinnerId(), "Unknown (#" + p.getPredictedWinnerId() + ")");
            
            if (RacePrediction.TYPE_EXACT_POSITION.equals(p.getPredictionType())) {
                selections.add(pickedHorse + " (Pos: " + p.getPredictedPosition() + ")");
            } else if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(p.getPredictionType())) {
                String opponentHorse = participantHorseNames.getOrDefault(p.getMatchupOpponentId(), "Unknown (#" + p.getMatchupOpponentId() + ")");
                selections.add("Pick: " + pickedHorse);
                selections.add("vs: " + opponentHorse);
            } else {
                selections.add(pickedHorse);
            }
            r.setSelections(selections);
            r.setEntryCostPoints(p.getEntryCostPoints());
            r.setStatus(p.getStatus());
            
            // Map display statuses
            String displayStatus = p.getStatus().name();
            String resCategory = "Pending";
            
            if (PredictionStatus.PENDING == p.getStatus()) {
                displayStatus = "Submitted";
                resCategory = "Pending";
            } else if (PredictionStatus.LOCKED == p.getStatus()) {
                displayStatus = "Locked";
                resCategory = "Locked";
            } else if (PredictionStatus.REFUNDED == p.getStatus()) {
                displayStatus = "Refunded";
                resCategory = "Refunded";
            } else if (PredictionStatus.INCORRECT == p.getStatus()) {
                displayStatus = "Lost";
                resCategory = "Incorrect";
            } else if (PredictionStatus.CORRECT == p.getStatus()) {
                displayStatus = "Won";
                if (RacePrediction.TYPE_EXACT_POSITION.equals(p.getPredictionType())) {
                    resCategory = "Position Correct";
                } else if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(p.getPredictionType())) {
                    resCategory = "Matchup Correct";
                } else if (RacePrediction.TYPE_WINNER.equals(p.getPredictionType())) {
                    resCategory = "Winner Correct";
                } else {
                    resCategory = "Correct";
                }
            }
            
            r.setDisplayStatus(displayStatus);
            r.setResultCategory(resCategory);
            r.setRewardPoints(p.getRewardPoints());
            r.setSubmittedAt(p.getCreatedAt());
            r.setEvaluatedAt(p.getEvaluatedAt());

            return r;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // API thử chạy lại tiến trình trả thưởng (Settlement Job) nếu trước đó bị lỗi (FAILED)
    @PostMapping("/settlement-jobs/{jobId}/retry")
    public ResponseEntity<Void> retryJob(@PathVariable Long jobId) {
        PredictionSettlementJob job = jobRepo.findById(jobId)
            .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (PredictionSettlementJobStatus.FAILED == job.getStatus()) {
            job.setStatus(PredictionSettlementJobStatus.PENDING);
            job.setErrorMessage(null);
            job.setUpdatedAt(LocalDateTime.now());
            jobRepo.save(job);
        }
        return ResponseEntity.ok().build();
    }

    // API lấy cấu hình chung của hệ thống cược (như thanh khoản ảo, tỷ lệ hoa hồng)
    // - displaySeed: Lượng điểm ảo ban đầu dùng để tính toán tỷ lệ cược mượt mà (Price Smoothing)
    // - takeoutRate: Tỷ lệ phần trăm hoa hồng hệ thống giữ lại từ tổng cược (ví dụ: 0.15 = 15%)
    @GetMapping("/settings")
    public ResponseEntity<PredictionSettingResponse> getSettings() {
        // Lấy cấu hình lưu trong database (ID luôn bằng 1 vì chỉ có 1 cấu hình chung).
        // Nếu database chưa có, hệ thống sẽ tự khởi tạo bằng giá trị mặc định.
        PredictionSetting setting = predictionSettingRepo.findById(1L).orElseGet(() -> {
            PredictionSetting s = new PredictionSetting();
            s.setId(1L);
            s.setDisplaySeed(40000000.0); // Mặc định điểm ảo khởi tạo
            s.setTakeoutRate(BigDecimal.valueOf(0.15)); // Mặc định hoa hồng 15%
            s.setUpdatedAt(LocalDateTime.now());
            return predictionSettingRepo.save(s);
        });

        // Build object trả về cho Frontend (Admin Dashboard)
        PredictionSettingResponse response = new PredictionSettingResponse();
        response.setDisplaySeed(setting.getDisplaySeed());
        response.setTakeoutRate(setting.getTakeoutRate());
        response.setUpdatedAt(setting.getUpdatedAt());
        if (setting.getUpdatedBy() != null) {
            response.setUpdatedByUserName(setting.getUpdatedBy().getFullName());
        }
        return ResponseEntity.ok(response);
    }

    // API cập nhật cấu hình chung của hệ thống cược
    // Cho phép Admin tùy chỉnh thay đổi mức điểm ảo (displaySeed) hoặc tỷ lệ hoa hồng (takeoutRate) theo tình hình thực tế
    @PutMapping("/settings")
    public ResponseEntity<PredictionSettingResponse> updateSettings(
            @jakarta.validation.Valid @RequestBody UpdatePredictionSettingRequest request,
            org.springframework.security.core.Authentication authentication
    ) {
        // Lấy thông tin user hiện tại (Admin) đang thực hiện thay đổi để lưu vào biến updatedBy (Track lịch sử)
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "User not found"));

        // Lấy cấu hình cũ ra hoặc tạo mới nếu chưa có
        PredictionSetting setting = predictionSettingRepo.findById(1L).orElseGet(() -> {
            PredictionSetting s = new PredictionSetting();
            s.setId(1L);
            return s;
        });

        // Gán đè các giá trị mới từ Request (Dữ liệu Admin điền vào form)
        setting.setDisplaySeed(request.getDisplaySeed());
        setting.setTakeoutRate(request.getTakeoutRate());
        setting.setUpdatedAt(LocalDateTime.now());
        setting.setUpdatedBy(user); // Lưu lại ai là người cập nhật
        
        // Lưu cấu hình mới xuống database
        predictionSettingRepo.save(setting);

        // Build object trả về cho Frontend
        PredictionSettingResponse response = new PredictionSettingResponse();
        response.setDisplaySeed(setting.getDisplaySeed());
        response.setTakeoutRate(setting.getTakeoutRate());
        response.setUpdatedAt(setting.getUpdatedAt());
        response.setUpdatedByUserName(user.getFullName());
        return ResponseEntity.ok(response);
    }
}
