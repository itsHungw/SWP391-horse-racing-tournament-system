package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.prediction.dto.request.StreakPredictionLegRequest;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitStreakPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.StreakPredictionLegResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.StreakPredictionResponse;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg;
import com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StreakPredictionService {

    private final StreakPredictionRepository streakPredictionRepository;
    private final UserRepository spectatorRepository;
    private final TournamentRepository tournamentRepository;
    private final RaceRepository raceRepository;
    private final RaceParticipantRepository raceParticipantRepository;
    private final OddsCalculationService oddsCalculationService;
    private final WalletService walletService;

    /** Single parlay end-margin (e.g. 0.20 = 20% hold), applied once to the multiplied fair odds. */
    @Value("${app.prediction.streak-takeout:0.20}")
    private BigDecimal parlayTakeout;

    /** Hard cap on a ticket's total multiplier (bounds house risk for this fixed-odds market). */
    @Value("${app.prediction.max-total-odds:100}")
    private BigDecimal maxTotalOdds;

    public StreakPredictionService(
        StreakPredictionRepository streakPredictionRepository,
        UserRepository spectatorRepository,
        TournamentRepository tournamentRepository,
        RaceRepository raceRepository,
        RaceParticipantRepository raceParticipantRepository,
        OddsCalculationService oddsCalculationService,
        WalletService walletService
    ) {
        this.streakPredictionRepository = streakPredictionRepository;
        this.spectatorRepository = spectatorRepository;
        this.tournamentRepository = tournamentRepository;
        this.raceRepository = raceRepository;
        this.raceParticipantRepository = raceParticipantRepository;
        this.oddsCalculationService = oddsCalculationService;
        this.walletService = walletService;
    }

    // Đặt cược chuỗi (Streak Prediction - Cược xiên)
    @Transactional
    public StreakPredictionResponse submitStreakPrediction(Long spectatorId, SubmitStreakPredictionRequest request) {
        // Lấy thông tin người chơi
        User spectator = spectatorRepository.findById(spectatorId)
            .orElseThrow(() -> new IllegalArgumentException("Spectator not found"));

        // Lấy thông tin giải đấu
        Tournament tournament = tournamentRepository.findById(request.getTournamentId())
            .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));

        // Một cược chuỗi (xiên) yêu cầu ít nhất 2 lựa chọn (chân cược - legs)
        if (request.getLegs() == null || request.getLegs().size() < 2) {
            throw new IllegalArgumentException("A streak prediction must have at least 2 legs");
        }

        // Kiểm tra số tiền cược phải hợp lệ
        if (request.getWagerAmount() == null || request.getWagerAmount() <= 0) {
            throw new IllegalArgumentException("Invalid wager amount");
        }

        // Kiểm tra số dư ví xem có đủ tiền cược không
        if (walletService.getBalance(spectator.getId()) < request.getWagerAmount()) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        // Tạo bản ghi cược chuỗi với trạng thái ban đầu là PENDING (Đang chờ)
        StreakPrediction streakPrediction = StreakPrediction.builder()
            .spectator(spectator)
            .tournament(tournament)
            .wagerAmount(request.getWagerAmount())
            .status(StreakPredictionStatus.PENDING)
            .build();

        // Cược xiên thực sự (True parlay) được sửa đổi: mỗi chân cược được định giá theo tỷ lệ thập phân công bằng (1/p).
        // Sau đó các tỷ lệ này được cộng dồn lại với nhau, với một giới hạn tối đa (hard cap) cho tổng tỷ lệ cược.
        BigDecimal sumOdds = BigDecimal.ZERO;

        for (StreakPredictionLegRequest legReq : request.getLegs()) {
            // Kiểm tra từng cuộc đua trong xiên
            Race race = raceRepository.findById(legReq.getRaceId())
                .orElseThrow(() -> new IllegalArgumentException("Race not found: " + legReq.getRaceId()));

            // Chỉ cho phép đặt khi cuộc đua chưa bắt đầu
            if (RaceStatus.SCHEDULED != race.getStatus()) {
                throw new IllegalStateException("Predictions are closed for race: " + race.getName());
            }

            RaceParticipant participant = raceParticipantRepository.findById(legReq.getPredictedWinnerId())
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));

            // Không cho phép chọn ngựa đã rút lui
            if (ParticipantStatus.WITHDRAWN == participant.getStatus()) {
                throw new IllegalArgumentException("Participant is withdrawn: " + participant.getHorse().getName());
            }

            // Lấy danh sách ngựa đua không bị rút lui
            List<RaceParticipant> allParticipants = raceParticipantRepository
                    .findAllByRaceAndStatusNotOrderByLane(
                            race.getId(),
                            ParticipantStatus.WITHDRAWN
                    );
            // Tính toán tỷ lệ cược cho chân cược hiện tại
            Map<Long, BigDecimal> streakOddsMatrix = oddsCalculationService.calculateStreakOddsMatrix(race.getId(), allParticipants);
            BigDecimal legOdds = streakOddsMatrix.get(participant.getId());
            if (legOdds == null || legOdds.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException(
                    "Cannot price streak leg for participant " + participant.getId() + " in race " + race.getId());
            }

            sumOdds = sumOdds.add(legOdds); // Cộng dồn tỷ lệ cược của các chân cược

            // Tạo đối tượng đại diện cho một phần cược trong xiên
            StreakPredictionLeg leg = StreakPredictionLeg.builder()
                .race(race)
                .predictedWinner(participant)
                .placedOdds(legOdds)
                .lockedOdds(legOdds) // Lưu tỷ lệ tại thời điểm đặt cược
                .status(StreakPredictionStatus.PENDING)
                .build();

            streakPrediction.addLeg(leg);
        }

        // Giới hạn tổng tỷ lệ cược bằng maxTotalOdds để tránh rủi ro quá lớn cho nhà cái
        // Sử dụng trực tiếp tổng tỷ lệ, không tính thêm phí hoa hồng (commission) ở đây
        BigDecimal totalOdds = sumOdds;
        if (totalOdds.compareTo(maxTotalOdds) > 0) {
            totalOdds = maxTotalOdds;
        }
        // Ghi nhận tỷ lệ cược tổng cộng với làm tròn 2 chữ số thập phân
        streakPrediction.setTotalOdds(totalOdds.setScale(2, RoundingMode.HALF_UP));

        // Lưu cược chuỗi vào DB
        StreakPrediction saved = streakPredictionRepository.saveAndFlush(streakPrediction);

        // Trừ tiền từ ví của người chơi (gắn với mã giao dịch là ID của cược chuỗi này)
        walletService.adjust(
            spectator, -request.getWagerAmount(), WalletTransactionType.BET_PLACED,
            WalletTransaction.REF_STREAK_PREDICTION, saved.getId(),
            "Placed streak bet of " + request.getWagerAmount() + " VND #" + saved.getId()
        );

        return mapToResponse(saved);
    }

    public List<StreakPredictionResponse> getSpectatorStreaks(Long spectatorId) {
        return streakPredictionRepository.findBySpectator_Id(spectatorId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    private StreakPredictionResponse mapToResponse(StreakPrediction sp) {
        BigDecimal expectedTotalOdds = BigDecimal.ZERO;
        BigDecimal placedTotalOdds = BigDecimal.ZERO;
        List<StreakPredictionLegResponse> legResponses = sp.getLegs().stream().map(leg -> {
            BigDecimal expectedOdds = leg.getLockedOdds();
            if (StreakPredictionStatus.PENDING.equals(leg.getStatus()) && RaceStatus.SCHEDULED.equals(leg.getRace().getStatus())) {
                List<RaceParticipant> participants = raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(
                        leg.getRace().getId(), ParticipantStatus.WITHDRAWN);
                Map<Long, BigDecimal> streakOddsMatrix = oddsCalculationService.calculateStreakOddsMatrix(leg.getRace().getId(), participants);
                if (streakOddsMatrix.containsKey(leg.getPredictedWinner().getId())) {
                    expectedOdds = streakOddsMatrix.get(leg.getPredictedWinner().getId());
                }
            }
            return StreakPredictionLegResponse.builder()
                .id(leg.getId())
                .raceId(leg.getRace().getId())
                .raceName(leg.getRace().getName())
                .raceStartTime(leg.getRace().getRaceAt())
                .predictedWinnerId(leg.getPredictedWinner().getId())
                .predictedWinnerName(leg.getPredictedWinner().getHorse().getName())
                .placedOdds(leg.getPlacedOdds() != null ? leg.getPlacedOdds() : leg.getLockedOdds())
                .expectedOdds(expectedOdds)
                .lockedOdds(leg.getLockedOdds())
                .status(leg.getStatus())
                .build();
        }).collect(Collectors.toList());

        for (StreakPredictionLegResponse legResponse : legResponses) {
            if (!StreakPredictionStatus.REFUNDED.equals(legResponse.getStatus())) {
                expectedTotalOdds = expectedTotalOdds.add(legResponse.getExpectedOdds() != null ? legResponse.getExpectedOdds() : BigDecimal.ZERO);
                placedTotalOdds = placedTotalOdds.add(legResponse.getPlacedOdds() != null ? legResponse.getPlacedOdds() : BigDecimal.ZERO);
            }
        }
        if (expectedTotalOdds.compareTo(maxTotalOdds) > 0) {
            expectedTotalOdds = maxTotalOdds;
        }
        if (placedTotalOdds.compareTo(maxTotalOdds) > 0) {
            placedTotalOdds = maxTotalOdds;
        }

        return StreakPredictionResponse.builder()
            .id(sp.getId())
            .tournamentId(sp.getTournament().getId())
            .wagerAmount(sp.getWagerAmount())
            .totalOdds(sp.getTotalOdds())
            .placedTotalOdds(placedTotalOdds.setScale(2, RoundingMode.HALF_UP))
            .expectedTotalOdds(expectedTotalOdds.setScale(2, RoundingMode.HALF_UP))
            .status(sp.getStatus())
            .rewardPoints(sp.getRewardPoints())
            .createdAt(sp.getCreatedAt())
            .evaluatedAt(sp.getEvaluatedAt())
            .legs(legResponses)
            .build();
    }
}
