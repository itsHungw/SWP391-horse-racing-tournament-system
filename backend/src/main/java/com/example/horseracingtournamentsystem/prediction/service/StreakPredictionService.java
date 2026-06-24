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

    // Maximum total odds allowed to limit house risk
    private static final BigDecimal MAX_TOTAL_ODDS = BigDecimal.valueOf(1000.00);

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

    @Transactional
    public StreakPredictionResponse submitStreakPrediction(Long spectatorId, SubmitStreakPredictionRequest request) {
        User spectator = spectatorRepository.findById(spectatorId)
            .orElseThrow(() -> new IllegalArgumentException("Spectator not found"));

        Tournament tournament = tournamentRepository.findById(request.getTournamentId())
            .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));

        if (request.getLegs() == null || request.getLegs().size() < 2) {
            throw new IllegalArgumentException("A streak prediction must have at least 2 legs");
        }

        if (request.getWagerAmount() == null || request.getWagerAmount() <= 0) {
            throw new IllegalArgumentException("Invalid wager amount");
        }

        if (walletService.getBalance(spectator.getId()) < request.getWagerAmount()) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        StreakPrediction streakPrediction = StreakPrediction.builder()
            .spectator(spectator)
            .tournament(tournament)
            .wagerAmount(request.getWagerAmount())
            .status(StreakPredictionStatus.PENDING)
            .build();

        BigDecimal totalOdds = BigDecimal.ZERO;

        for (StreakPredictionLegRequest legReq : request.getLegs()) {
            Race race = raceRepository.findById(legReq.getRaceId())
                .orElseThrow(() -> new IllegalArgumentException("Race not found: " + legReq.getRaceId()));

            if (RaceStatus.SCHEDULED != race.getStatus()) {
                throw new IllegalStateException("Predictions are closed for race: " + race.getName());
            }

            RaceParticipant participant = raceParticipantRepository.findById(legReq.getPredictedWinnerId())
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));

            if (ParticipantStatus.WITHDRAWN == participant.getStatus()) {
                throw new IllegalArgumentException("Participant is withdrawn: " + participant.getHorse().getName());
            }

            // Calculate odds for WINNER (Position 1)
            List<RaceParticipant> allParticipants = raceParticipantRepository
                    .findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(
                            race.getId(),
                            ParticipantStatus.WITHDRAWN
                    );
            Map<Long, Map<Integer, BigDecimal>> matrix = oddsCalculationService.calculatePositionOddsMatrix(race.getId(), allParticipants);
            
            BigDecimal legOdds = BigDecimal.ZERO;
            if (matrix.containsKey(participant.getId()) && matrix.get(participant.getId()).containsKey(1)) {
                legOdds = matrix.get(participant.getId()).get(1);
            }

            if (legOdds.compareTo(BigDecimal.ZERO) <= 0) {
                boolean containsParticipant = matrix.containsKey(participant.getId());
                boolean containsPos = containsParticipant ? matrix.get(participant.getId()).containsKey(1) : false;
                throw new IllegalStateException(
                    String.format("Failed to calculate odds for participant %d. Race %d. " +
                        "Participant in matrix: %s, Pos1 in matrix: %s",
                        participant.getId(), race.getId(), containsParticipant, containsPos)
                );
            }

            totalOdds = totalOdds.add(legOdds);

            StreakPredictionLeg leg = StreakPredictionLeg.builder()
                .race(race)
                .predictedWinner(participant)
                .lockedOdds(legOdds)
                .status(StreakPredictionStatus.PENDING)
                .build();

            streakPrediction.addLeg(leg);
        }

        // Cap total odds
        if (totalOdds.compareTo(MAX_TOTAL_ODDS) > 0) {
            totalOdds = MAX_TOTAL_ODDS;
        }

        streakPrediction.setTotalOdds(totalOdds.setScale(2, RoundingMode.HALF_UP));

        StreakPrediction saved = streakPredictionRepository.saveAndFlush(streakPrediction);

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
        List<StreakPredictionLegResponse> legResponses = sp.getLegs().stream().map(leg -> 
            StreakPredictionLegResponse.builder()
                .id(leg.getId())
                .raceId(leg.getRace().getId())
                .raceName(leg.getRace().getName())
                .predictedWinnerId(leg.getPredictedWinner().getId())
                .predictedWinnerName(leg.getPredictedWinner().getHorse().getName())
                .lockedOdds(leg.getLockedOdds())
                .status(leg.getStatus())
                .build()
        ).collect(Collectors.toList());

        return StreakPredictionResponse.builder()
            .id(sp.getId())
            .tournamentId(sp.getTournament().getId())
            .wagerAmount(sp.getWagerAmount())
            .totalOdds(sp.getTotalOdds())
            .status(sp.getStatus())
            .rewardPoints(sp.getRewardPoints())
            .createdAt(sp.getCreatedAt())
            .evaluatedAt(sp.getEvaluatedAt())
            .legs(legResponses)
            .build();
    }
}
