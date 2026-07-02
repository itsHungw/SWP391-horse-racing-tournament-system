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

        // True parlay: each leg priced as fair decimal odds (1/p), multiplied together, with a
        // SINGLE end-margin applied once (not compounded per leg) and a hard cap on the total.
        BigDecimal product = BigDecimal.ONE;

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

            // Fair win probability for this leg's pick (position 1), then fair odds = 1 / p.
            List<RaceParticipant> allParticipants = raceParticipantRepository
                    .findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(
                            race.getId(),
                            ParticipantStatus.WITHDRAWN
                    );
            Map<Long, BigDecimal> winProbs = oddsCalculationService.getWinProbabilities(allParticipants);
            BigDecimal p = winProbs.get(participant.getId());
            if (p == null || p.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException(
                    "Cannot price streak leg for participant " + participant.getId() + " in race " + race.getId());
            }

            BigDecimal legOdds = BigDecimal.ONE.divide(p, 4, RoundingMode.HALF_UP);
            product = product.multiply(legOdds);

            StreakPredictionLeg leg = StreakPredictionLeg.builder()
                .race(race)
                .predictedWinner(participant)
                .lockedOdds(legOdds)
                .status(StreakPredictionStatus.PENDING)
                .build();

            streakPrediction.addLeg(leg);
        }

        BigDecimal totalOdds = product.multiply(BigDecimal.ONE.subtract(parlayTakeout));
        if (totalOdds.compareTo(maxTotalOdds) > 0) {
            totalOdds = maxTotalOdds;
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
