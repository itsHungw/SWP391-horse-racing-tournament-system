package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionQuoteResponse;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionOptionsResponse.HeadToHeadMatchup;

@Service
public class PredictionService {

    private final RacePredictionRepository predictionRepo;
    private final PredictionSettlementJobRepository jobRepo;
    private final RaceRepository raceRepo;
    private final WalletService walletService;
    private final OddsCalculationService oddsCalculationService;
    private final RaceParticipantRepository raceParticipantRepository;
    private final com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionLegRepository streakPredictionLegRepo;
    private final com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository streakPredictionRepo;

    /** Minimum stake per bet (VND). */
    @Value("${app.prediction.min-wager:10000}")
    private long minWager;

    @Value("${app.prediction.streak-takeout:0.20}")
    private java.math.BigDecimal parlayTakeout;

    @Value("${app.prediction.max-total-odds:100}")
    private java.math.BigDecimal maxTotalOdds;

    public PredictionService(RacePredictionRepository predictionRepo,
                             PredictionSettlementJobRepository jobRepo,
                             RaceRepository raceRepo,
                             WalletService walletService,
                             OddsCalculationService oddsCalculationService,
                             RaceParticipantRepository raceParticipantRepository,
                             com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionLegRepository streakPredictionLegRepo,
                             com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository streakPredictionRepo) {
        this.predictionRepo = predictionRepo;
        this.jobRepo = jobRepo;
        this.raceRepo = raceRepo;
        this.walletService = walletService;
        this.oddsCalculationService = oddsCalculationService;
        this.raceParticipantRepository = raceParticipantRepository;
        this.streakPredictionLegRepo = streakPredictionLegRepo;
        this.streakPredictionRepo = streakPredictionRepo;
    }

    @Transactional
    public RacePrediction submitPrediction(User spectator, SubmitPredictionRequest request) {
        // Tìm kiếm thông tin cuộc đua dựa trên ID được gửi lên
        Race race = raceRepo.findById(request.getRaceId())
            .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        // Quy tắc: Chỉ cho phép đặt cược khi cuộc đua đang ở trạng thái SCHEDULED (Đã lên lịch)
        if (RaceStatus.SCHEDULED != race.getStatus()) {
            throw new IllegalStateException("Predictions can only be made when the race is SCHEDULED");
        }

        // Loại bỏ kèo TOP3; từ chối bất kỳ yêu cầu nào từ client/API gửi lên cho loại kèo này.
        // Chỉ hỗ trợ EXACT_POSITION (Dự đoán vị trí chính xác) và HEAD_TO_HEAD (Đối đầu 1v1)
        if (!RacePrediction.TYPE_EXACT_POSITION.equals(request.getPredictionType())
                && !RacePrediction.TYPE_HEAD_TO_HEAD.equals(request.getPredictionType())) {
            throw new IllegalArgumentException("Unsupported prediction type: " + request.getPredictionType());
        }

        long cost = request.getWagerAmount(); // Số tiền cược
        // Kiểm tra xem số tiền cược có lớn hơn hoặc bằng mức tối thiểu không
        if (cost < minWager) {
            throw new IllegalArgumentException("Minimum wager is " + minWager + " VND");
        }
        Long opponentId = null;
        Double handicapSeconds = null;

        // Tính toán tỷ lệ cược (Odds)
        // Tìm kiếm chiến mã dự đoán thắng dựa trên ID
        RaceParticipant participant = raceParticipantRepository.findById(request.getPredictedWinnerId())
            .orElseThrow(() -> new IllegalArgumentException("Predicted participant not found"));

        // Xử lý logic cho loại cược EXACT_POSITION (Dự đoán vị trí chính xác)
        if (RacePrediction.TYPE_EXACT_POSITION.equals(request.getPredictionType())) {
            if (request.getPredictedPosition() == null) {
                throw new IllegalArgumentException("Predicted position is required for EXACT_POSITION");
            }
            // Lấy danh sách các ngựa đua không bị rút lui
            List<RaceParticipant> participants = raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(race.getId(), com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);
            // Tính toán ma trận tỷ lệ cược cho các vị trí
            Map<Long, Map<Integer, java.math.BigDecimal>> oddsMatrix = oddsCalculationService.calculatePositionOddsMatrix(race.getId(), participants);
            Map<Integer, java.math.BigDecimal> horseOdds = oddsMatrix.get(request.getPredictedWinnerId());
            // Kiểm tra tính hợp lệ của tỷ lệ cược cho vị trí dự đoán
            if (horseOdds == null || !horseOdds.containsKey(request.getPredictedPosition())) {
                throw new IllegalArgumentException("Invalid prediction parameters or participant is withdrawn");
            }
        } else if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(request.getPredictionType())) {
            // Xử lý logic cho loại cược HEAD_TO_HEAD (Đối đầu)
            List<RaceParticipant> participants = raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(race.getId(), com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);
            // Lấy danh sách các cặp đấu đối đầu
            List<HeadToHeadMatchup> h2hMatchups = oddsCalculationService.calculateH2HMatchups(race.getId(), participants);

            // Tìm cặp đấu chứa chiến mã được dự đoán
            HeadToHeadMatchup selectedMatchup = h2hMatchups.stream()
                .filter(m -> m.getParticipantAId().equals(request.getPredictedWinnerId()) || m.getParticipantBId().equals(request.getPredictedWinnerId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid participant for H2H matchup"));

            // Xác định ID của đối thủ và điểm chấp (handicap) tương ứng
            if (selectedMatchup.getParticipantAId().equals(request.getPredictedWinnerId())) {
                opponentId = selectedMatchup.getParticipantBId();
                handicapSeconds = selectedMatchup.getHandicapSeconds();
            } else {
                opponentId = selectedMatchup.getParticipantAId();
                handicapSeconds = -selectedMatchup.getHandicapSeconds();
            }
        }

        // 1. Tạo và lưu dự đoán trước vào cơ sở dữ liệu để có ID
        RacePrediction prediction = RacePrediction.create(
            race, spectator, request.getPredictionType(),
            request.getPredictedWinnerId(), request.getPredictedPosition(),
            opponentId, handicapSeconds, cost
        );
        prediction.setWagerAmount(cost);
        RacePrediction saved = predictionRepo.saveAndFlush(prediction);

        // 2. Trừ tiền cược khỏi ví (idempotent theo prediction id) và ghi lại giao dịch vào sổ cái
        walletService.adjust(
            spectator, -cost, WalletTransactionType.BET_PLACED,
            WalletTransaction.REF_RACE_PREDICTION, saved.getId(),
            "Placed bet of " + cost + " VND on race prediction #" + saved.getId()
        );

        return saved;
    }

    // Hàm dùng để lấy báo giá (tỷ lệ cược) cho một dự đoán trước khi người dùng thực sự đặt cược
    @Transactional(readOnly = true)
    public PredictionQuoteResponse quotePrediction(SubmitPredictionRequest request) {
        Race race = raceRepo.findById(request.getRaceId())
            .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        // Báo giá chỉ áp dụng khi cuộc đua vẫn đang mở (SCHEDULED)
        if (RaceStatus.SCHEDULED != race.getStatus()) {
            throw new IllegalStateException("Predictions can only be quoted when the race is SCHEDULED");
        }

        long stake = request.getWagerAmount();
        if (stake < minWager) {
            throw new IllegalArgumentException("Minimum wager is " + minWager + " VND");
        }

        List<RaceParticipant> participants = raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(
                race.getId(), com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);

        if (RacePrediction.TYPE_EXACT_POSITION.equals(request.getPredictionType())) {
            if (request.getPredictedPosition() == null) {
                throw new IllegalArgumentException("Predicted position is required for EXACT_POSITION");
            }
            return oddsCalculationService.quoteExactPosition(
                    race.getId(),
                    participants,
                    request.getPredictedWinnerId(),
                    request.getPredictedPosition(),
                    stake
            );
        }

        if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(request.getPredictionType())) {
            return oddsCalculationService.quoteHeadToHead(
                    race.getId(),
                    participants,
                    request.getPredictedWinnerId(),
                    stake
            );
        }

        throw new IllegalArgumentException("Unsupported prediction type: " + request.getPredictionType());
    }

    // Khóa cược cho cuộc đua: Chuyển các cược từ PENDING sang LOCKED và cố định tỷ lệ cược
    @Transactional
    public void lockPredictionsForRace(Long raceId) {
        // Lấy tất cả dự đoán đang chờ xử lý
        List<RacePrediction> pendingPredictions = predictionRepo.findByRace_IdAndStatus(raceId, com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING);
        List<RaceParticipant> participants = raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(
            raceId, com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);
        
        // Tính toán tỷ lệ cược cuối cùng tại thời điểm chốt cược
        Map<Long, Map<Integer, java.math.BigDecimal>> positionOdds = oddsCalculationService.calculatePositionOddsMatrix(raceId, participants);
        List<HeadToHeadMatchup> h2hMatchups = oddsCalculationService.calculateH2HMatchups(raceId, participants);

        for (RacePrediction p : pendingPredictions) {
            p.setLockedOdds(resolveLockedOdds(p, positionOdds, h2hMatchups)); // Lưu tỷ lệ cược cố định
            p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED); // Chuyển trạng thái sang Đã khóa
            p.setLockedAt(LocalDateTime.now());
            predictionRepo.save(p);
        }

        // Lock Streak Prediction Legs
        List<com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg> activeLegs = streakPredictionLegRepo.findActiveLegsByRaceId(raceId);
        if (!activeLegs.isEmpty()) {
            Map<Long, java.math.BigDecimal> streakOddsMatrix = oddsCalculationService.calculateStreakOddsMatrix(raceId, participants);
            java.util.Set<com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction> affectedStreaks = new java.util.HashSet<>();
            for (com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg leg : activeLegs) {
                if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.PENDING.equals(leg.getStatus())) {
                    java.math.BigDecimal newOdds = streakOddsMatrix.get(leg.getPredictedWinner().getId());
                    if (newOdds != null) {
                        leg.setLockedOdds(newOdds);
                        streakPredictionLegRepo.save(leg);
                        affectedStreaks.add(leg.getStreakPrediction());
                    }
                }
            }

            for (com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction streak : affectedStreaks) {
                java.math.BigDecimal sumOdds = java.math.BigDecimal.ZERO;
                for (com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg leg : streak.getLegs()) {
                    if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.REFUNDED.equals(leg.getStatus())) {
                        continue;
                    }
                    sumOdds = sumOdds.add(leg.getLockedOdds() != null && leg.getLockedOdds().compareTo(java.math.BigDecimal.ZERO) > 0 ? leg.getLockedOdds() : java.math.BigDecimal.ZERO);
                }
                java.math.BigDecimal totalOdds = sumOdds;
                if (totalOdds.compareTo(maxTotalOdds) > 0) {
                    totalOdds = maxTotalOdds;
                }
                streak.setTotalOdds(totalOdds.setScale(2, java.math.RoundingMode.HALF_UP));
                streakPredictionRepo.save(streak);
            }
        }
    }

    private java.math.BigDecimal resolveLockedOdds(
            RacePrediction prediction,
            Map<Long, Map<Integer, java.math.BigDecimal>> positionOdds,
            List<HeadToHeadMatchup> h2hMatchups
    ) {
        if (RacePrediction.TYPE_EXACT_POSITION.equals(prediction.getPredictionType())) {
            return positionOdds.getOrDefault(prediction.getPredictedWinnerId(), Map.of())
                .getOrDefault(prediction.getPredictedPosition(), java.math.BigDecimal.ZERO);
        }

        if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(prediction.getPredictionType())) {
            return h2hMatchups.stream()
                .filter(m -> Objects.equals(m.getParticipantAId(), prediction.getPredictedWinnerId())
                        || Objects.equals(m.getParticipantBId(), prediction.getPredictedWinnerId()))
                .findFirst()
                .map(m -> Objects.equals(m.getParticipantAId(), prediction.getPredictedWinnerId())
                        ? m.getOddsA()
                        : m.getOddsB())
                .orElse(java.math.BigDecimal.ZERO);
        }

        return java.math.BigDecimal.ZERO;
    }

    @Transactional
    public void refundCancelledRace(Long raceId) {
        List<RacePrediction> predictions = predictionRepo.findByRace_Id(raceId);
        for (RacePrediction p : predictions) {
            if (com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING == p.getStatus() || com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED == p.getStatus()) {
                LocalDateTime refundedAt = LocalDateTime.now();
                p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.REFUNDED);
                p.setEvaluatedAt(refundedAt);
                p.setUpdatedAt(refundedAt);
                predictionRepo.save(p);

                // Hoàn tiền cược (idempotent theo prediction id)
                walletService.adjust(
                    p.getSpectator(), p.getEntryCostPoints(), WalletTransactionType.BET_REFUND,
                    WalletTransaction.REF_RACE_PREDICTION, p.getId(),
                    "Refund " + p.getEntryCostPoints() + " VND for cancelled race"
                );
            }
        }
    }

    @Transactional
    public void createSettlementJob(Long raceId) {
        Race race = raceRepo.findById(raceId)
            .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        if (jobRepo.findByRace_Id(raceId).isEmpty()) {
            PredictionSettlementJob job = PredictionSettlementJob.create(race);
            jobRepo.save(job);
        }
    }

    public List<RacePrediction> getMyPredictions(User spectator) {
        return predictionRepo.findBySpectatorId(spectator.getId());
    }
}
