# Prediction Realtime Quote Payout UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a backend-driven realtime payout quote layer and a responsible payout estimate UI so users understand VND stake, estimated return, market support, house fee, and quote movement before confirming.

**Architecture:** Add a pure quote calculator for auditable money math, wrap it in a Spring service/controller endpoint, then wire the spectator frontend to backend quotes instead of multiplying stake by grid odds. The grid remains an estimate preview; the payout panel renders only backend quote money values.

**Tech Stack:** Java 21, Spring Boot 4, Spring MVC, Spring Data JPA, JUnit 5, Mockito, React 19, TypeScript, Vitest, React Testing Library, Tailwind CSS.

---

## File Structure

Backend files:

- Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/enums/PredictionLiquidityState.java`
  - Owns quote liquidity state names returned to FE.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/request/PredictionQuoteRequest.java`
  - Validates quote request input.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/response/PredictionQuoteResponse.java`
  - Carries every money row displayed by the payout panel.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculator.java`
  - Pure BigDecimal/long parimutuel quote math with support cap.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteService.java`
  - Loads race, participants, active bets, matchup data, labels, and delegates money math to the calculator.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java`
  - Adds `POST /api/v1/prediction-quotes`.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionService.java`
  - Recomputes quote on submit and rejects unsupported quotes.
  - Keeps update stake fixed for MVP to avoid ledger delta ambiguity.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/entity/RacePrediction.java`
  - Adds quote audit snapshot fields.
- Add `backend/src/main/resources/db/migration/V19__add_prediction_quote_snapshot.sql`
  - Persists quote audit snapshot fields.
- Test `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculatorTest.java`
- Test `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteServiceTest.java`
- Test/update `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/SpectatorPredictionDtoIntegrationTest.java`
- Test/update `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/entity/RacePredictionTest.java`

Frontend files:

- Modify `frontend/src/pages/spectator/predictions/types/prediction.types.ts`
  - Adds quote request/response types and liquidity state union.
- Modify `frontend/src/pages/spectator/predictions/services/spectatorPredictionApi.ts`
  - Adds `getPredictionQuote`.
- Modify `frontend/src/pages/spectator/predictions/predictionCockpitUtils.ts`
  - Adds quote movement helpers and label helpers.
- Test `frontend/src/pages/spectator/predictions/predictionCockpitUtils.test.ts`
- Create `frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.tsx`
  - Replaces money rows currently computed from local grid odds.
- Test `frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.test.tsx`
- Modify `frontend/src/pages/spectator/predictions/components/PredictionSlip.tsx`
  - Renders `PayoutEstimatePanel`; confirm is disabled when quote is missing, expired, moved materially, or rejected.
- Modify `frontend/src/pages/spectator/predictions/components/RunnerTable.tsx`
  - Labels grid odds as estimates and adds thin-pool copy.
- Modify `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`
  - Owns quote polling/debounce state and passes quote to the slip.
- Update `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`
  - Mocks quote API and asserts backend quote values render.

## Task 1: Backend Quote API Contract

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/enums/PredictionLiquidityState.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/request/PredictionQuoteRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/response/PredictionQuoteResponse.java`
- Test: compile only in this task

- [ ] **Step 1: Add liquidity state enum**

Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/enums/PredictionLiquidityState.java`:

```java
package com.example.horseracingtournamentsystem.prediction.enums;

public enum PredictionLiquidityState {
    POOL_ACTIVE,
    LOW_LIQUIDITY_PROTECTED,
    STAKE_TOO_HIGH,
    DISABLED
}
```

- [ ] **Step 2: Add quote request DTO**

Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/request/PredictionQuoteRequest.java`:

```java
package com.example.horseracingtournamentsystem.prediction.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PredictionQuoteRequest {

    @NotNull(message = "Race ID is required")
    private Long raceId;

    @NotNull(message = "Prediction type is required")
    private String predictionType;

    @NotNull(message = "Predicted participant ID is required")
    private Long predictedWinnerId;

    private Integer predictedPosition;

    @NotNull(message = "Stake amount is required")
    @Min(value = 10000, message = "Minimum stake is 10000 VND")
    private Long stakeAmount;
}
```

- [ ] **Step 3: Add quote response DTO**

Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/response/PredictionQuoteResponse.java`:

```java
package com.example.horseracingtournamentsystem.prediction.dto.response;

import com.example.horseracingtournamentsystem.prediction.enums.PredictionLiquidityState;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record PredictionQuoteResponse(
        boolean accepted,
        PredictionLiquidityState liquidityState,
        String selectionLabel,
        Long stakeAmount,
        BigDecimal currentPoolEstimate,
        BigDecimal estimatedAfterStake,
        Long projectedReturn,
        Long estimatedProfit,
        Long potentialLoss,
        Long poolPayout,
        Long marketSupport,
        Long minimumProtectedReturn,
        BigDecimal minimumReturnMultiplier,
        Integer houseFeePercent,
        Long maxSupportedStake,
        LocalDateTime quoteExpiresAt,
        String message
) {}
```

- [ ] **Step 4: Compile backend**

Run:

```bash
cd backend
./mvnw.cmd -DskipTests compile
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/example/horseracingtournamentsystem/prediction/enums/PredictionLiquidityState.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/request/PredictionQuoteRequest.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/response/PredictionQuoteResponse.java
git commit -m "feat: add prediction quote DTO contract"
```

## Task 2: Pure Quote Calculator

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculator.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculatorTest.java`

- [ ] **Step 1: Write failing calculator tests**

Create `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculatorTest.java`:

```java
package com.example.horseracingtournamentsystem.prediction.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.example.horseracingtournamentsystem.prediction.enums.PredictionLiquidityState;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class PredictionQuoteCalculatorTest {

    @Test
    void activePoolNeedsNoSupportWhenPoolPayoutBeatsMinimumReturn() {
        PredictionQuoteCalculator.QuoteResult result = PredictionQuoteCalculator.quote(
                new PredictionQuoteCalculator.QuoteInput(
                        2L,
                        100_000L,
                        List.of(
                                new PredictionQuoteCalculator.Stake(1L, 900_000L),
                                new PredictionQuoteCalculator.Stake(2L, 100_000L)
                        ),
                        new BigDecimal("0.15"),
                        new BigDecimal("1.10"),
                        500_000L,
                        10_000L,
                        500_000L
                )
        );

        assertTrue(result.accepted());
        assertEquals(PredictionLiquidityState.POOL_ACTIVE, result.state());
        assertEquals(935_000L, result.poolPayout());
        assertEquals(0L, result.supportAmount());
        assertEquals(935_000L, result.projectedReturn());
        assertEquals(new BigDecimal("9.3500"), result.effectiveOdds());
    }

    @Test
    void lowLiquidityUsesSupportToProtectMinimumReturn() {
        PredictionQuoteCalculator.QuoteResult result = PredictionQuoteCalculator.quote(
                new PredictionQuoteCalculator.QuoteInput(
                        1L,
                        100_000L,
                        List.of(),
                        new BigDecimal("0.15"),
                        new BigDecimal("1.10"),
                        500_000L,
                        10_000L,
                        500_000L
                )
        );

        assertTrue(result.accepted());
        assertEquals(PredictionLiquidityState.LOW_LIQUIDITY_PROTECTED, result.state());
        assertEquals(85_000L, result.poolPayout());
        assertEquals(25_000L, result.supportAmount());
        assertEquals(110_000L, result.projectedReturn());
        assertEquals(new BigDecimal("1.1000"), result.effectiveOdds());
    }

    @Test
    void stakeTooHighReturnsMaximumSupportedStake() {
        PredictionQuoteCalculator.QuoteResult result = PredictionQuoteCalculator.quote(
                new PredictionQuoteCalculator.QuoteInput(
                        1L,
                        500_000L,
                        List.of(),
                        new BigDecimal("0.15"),
                        new BigDecimal("1.10"),
                        20_000L,
                        10_000L,
                        500_000L
                )
        );

        assertFalse(result.accepted());
        assertEquals(PredictionLiquidityState.STAKE_TOO_HIGH, result.state());
        assertEquals(80_000L, result.maxSupportedStake());
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd backend
./mvnw.cmd -Dtest=PredictionQuoteCalculatorTest test
```

Expected: FAIL because `PredictionQuoteCalculator` does not exist.

- [ ] **Step 3: Add calculator implementation**

Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculator.java`:

```java
package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.prediction.enums.PredictionLiquidityState;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class PredictionQuoteCalculator {

    private PredictionQuoteCalculator() {
    }

    public record Stake(Long outcomeId, long amount) {}

    public record QuoteInput(
            Long selectedOutcomeId,
            long stakeAmount,
            List<Stake> existingStakes,
            BigDecimal houseFeeRate,
            BigDecimal minimumReturnMultiplier,
            long supportCap,
            long minimumStake,
            long maximumStake
    ) {}

    public record QuoteResult(
            boolean accepted,
            PredictionLiquidityState state,
            long stakeAmount,
            long grossPool,
            long selectedOutcomePool,
            long poolPayout,
            long supportAmount,
            long minimumProtectedReturn,
            long projectedReturn,
            long estimatedProfit,
            BigDecimal effectiveOdds,
            long maxSupportedStake
    ) {}

    public static QuoteResult quote(QuoteInput input) {
        QuoteResult requested = calculate(input, input.stakeAmount());
        if (requested.accepted()) {
            return requested;
        }

        long maxSupportedStake = findMaxSupportedStake(input);
        PredictionLiquidityState state = maxSupportedStake < input.minimumStake()
                ? PredictionLiquidityState.DISABLED
                : PredictionLiquidityState.STAKE_TOO_HIGH;

        return new QuoteResult(
                false,
                state,
                input.stakeAmount(),
                requested.grossPool(),
                requested.selectedOutcomePool(),
                requested.poolPayout(),
                requested.supportAmount(),
                requested.minimumProtectedReturn(),
                requested.projectedReturn(),
                requested.estimatedProfit(),
                requested.effectiveOdds(),
                maxSupportedStake
        );
    }

    private static QuoteResult calculate(QuoteInput input, long stakeAmount) {
        List<Stake> simulated = new ArrayList<>(input.existingStakes());
        simulated.add(new Stake(input.selectedOutcomeId(), stakeAmount));

        long grossPool = simulated.stream().mapToLong(Stake::amount).sum();
        long selectedOutcomePool = simulated.stream()
                .filter(s -> input.selectedOutcomeId().equals(s.outcomeId()))
                .mapToLong(Stake::amount)
                .sum();

        BigDecimal keep = BigDecimal.ONE.subtract(input.houseFeeRate());
        BigDecimal netPool = BigDecimal.valueOf(grossPool).multiply(keep);
        long poolPayout = payoutFor(stakeAmount, netPool, selectedOutcomePool);
        long minimumProtectedReturn = BigDecimal.valueOf(stakeAmount)
                .multiply(input.minimumReturnMultiplier())
                .setScale(0, RoundingMode.DOWN)
                .longValueExact();
        long supportAmount = Math.max(0L, minimumProtectedReturn - poolPayout);
        long projectedReturn = poolPayout + supportAmount;
        BigDecimal effectiveOdds = stakeAmount > 0
                ? BigDecimal.valueOf(projectedReturn).divide(BigDecimal.valueOf(stakeAmount), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

        long worstCaseSupport = worstCaseSupport(simulated, netPool, input.minimumReturnMultiplier());
        boolean accepted = stakeAmount >= input.minimumStake()
                && stakeAmount <= input.maximumStake()
                && worstCaseSupport <= input.supportCap();

        PredictionLiquidityState state = supportAmount > 0
                ? PredictionLiquidityState.LOW_LIQUIDITY_PROTECTED
                : PredictionLiquidityState.POOL_ACTIVE;

        return new QuoteResult(
                accepted,
                state,
                stakeAmount,
                grossPool,
                selectedOutcomePool,
                poolPayout,
                supportAmount,
                minimumProtectedReturn,
                projectedReturn,
                projectedReturn - stakeAmount,
                effectiveOdds,
                accepted ? stakeAmount : 0L
        );
    }

    private static long payoutFor(long stake, BigDecimal netPool, long winningStake) {
        if (winningStake <= 0L) {
            return 0L;
        }
        return BigDecimal.valueOf(stake)
                .multiply(netPool)
                .divide(BigDecimal.valueOf(winningStake), 0, RoundingMode.DOWN)
                .longValueExact();
    }

    private static long worstCaseSupport(List<Stake> stakes, BigDecimal netPool, BigDecimal minimumReturnMultiplier) {
        Map<Long, Long> outcomePools = new HashMap<>();
        for (Stake stake : stakes) {
            outcomePools.merge(stake.outcomeId(), stake.amount(), Long::sum);
        }

        long max = 0L;
        for (Map.Entry<Long, Long> entry : outcomePools.entrySet()) {
            Long outcomeId = entry.getKey();
            long winningStake = entry.getValue();
            long support = 0L;
            for (Stake stake : stakes) {
                if (!outcomeId.equals(stake.outcomeId())) {
                    continue;
                }
                long payout = payoutFor(stake.amount(), netPool, winningStake);
                long minimum = BigDecimal.valueOf(stake.amount())
                        .multiply(minimumReturnMultiplier)
                        .setScale(0, RoundingMode.DOWN)
                        .longValueExact();
                support += Math.max(0L, minimum - payout);
            }
            max = Math.max(max, support);
        }
        return max;
    }

    private static long findMaxSupportedStake(QuoteInput input) {
        long low = 0L;
        long high = Math.min(input.maximumStake(), input.stakeAmount());
        while (low < high) {
            long mid = (low + high + 1L) / 2L;
            if (calculate(input, mid).accepted()) {
                low = mid;
            } else {
                high = mid - 1L;
            }
        }
        return low;
    }
}
```

- [ ] **Step 4: Run calculator tests**

Run:

```bash
cd backend
./mvnw.cmd -Dtest=PredictionQuoteCalculatorTest test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculator.java backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculatorTest.java
git commit -m "feat: add prediction quote calculator"
```

## Task 3: Backend Quote Service and Endpoint

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteServiceTest.java`

- [ ] **Step 1: Write failing service test**

Create `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteServiceTest.java`:

```java
package com.example.horseracingtournamentsystem.prediction.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.prediction.dto.request.PredictionQuoteRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionQuoteResponse;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionLiquidityState;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class PredictionQuoteServiceTest {

    private RaceRepository raceRepository;
    private RaceParticipantRepository participantRepository;
    private RacePredictionRepository predictionRepository;
    private OddsCalculationService oddsCalculationService;
    private PredictionQuoteService service;

    @BeforeEach
    void setUp() {
        raceRepository = mock(RaceRepository.class);
        participantRepository = mock(RaceParticipantRepository.class);
        predictionRepository = mock(RacePredictionRepository.class);
        oddsCalculationService = mock(OddsCalculationService.class);
        service = new PredictionQuoteService(raceRepository, participantRepository, predictionRepository, oddsCalculationService);
        ReflectionTestUtils.setField(service, "takeoutRate", new BigDecimal("0.15"));
        ReflectionTestUtils.setField(service, "minimumReturnMultiplier", new BigDecimal("1.10"));
        ReflectionTestUtils.setField(service, "supportCap", 500_000L);
        ReflectionTestUtils.setField(service, "minWager", 10_000L);
        ReflectionTestUtils.setField(service, "maxWager", 500_000L);
        ReflectionTestUtils.setField(service, "quoteTtlSeconds", 15L);
    }

    @Test
    void quotesExactPositionWithLowLiquidityProtection() {
        Race race = mock(Race.class);
        RaceParticipant participant = mock(RaceParticipant.class);
        when(race.getId()).thenReturn(7L);
        when(race.getStatus()).thenReturn(RaceStatus.SCHEDULED);
        when(race.getRaceAt()).thenReturn(LocalDateTime.now().plusHours(1));
        when(participant.getId()).thenReturn(11L);

        PredictionQuoteRequest request = new PredictionQuoteRequest();
        request.setRaceId(7L);
        request.setPredictionType(RacePrediction.TYPE_EXACT_POSITION);
        request.setPredictedWinnerId(11L);
        request.setPredictedPosition(1);
        request.setStakeAmount(100_000L);

        Map<Long, Map<Integer, BigDecimal>> odds = new HashMap<>();
        odds.put(11L, Map.of(1, new BigDecimal("50.00")));

        when(raceRepository.findById(7L)).thenReturn(Optional.of(race));
        when(participantRepository.findByIdAndRace_Id(11L, 7L)).thenReturn(Optional.of(participant));
        when(participantRepository.findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(7L, ParticipantStatus.WITHDRAWN))
                .thenReturn(List.of(participant));
        when(predictionRepository.findByRace_IdAndStatus(7L, PredictionStatus.PENDING)).thenReturn(List.of());
        when(predictionRepository.findByRace_IdAndStatus(7L, PredictionStatus.LOCKED)).thenReturn(List.of());
        when(oddsCalculationService.calculatePositionOddsMatrix(7L, List.of(participant))).thenReturn(odds);

        PredictionQuoteResponse response = service.quote(request);

        assertEquals(true, response.accepted());
        assertEquals(PredictionLiquidityState.LOW_LIQUIDITY_PROTECTED, response.liquidityState());
        assertEquals(new BigDecimal("50.00"), response.currentPoolEstimate());
        assertEquals(new BigDecimal("1.1000"), response.estimatedAfterStake());
        assertEquals(85_000L, response.poolPayout());
        assertEquals(25_000L, response.marketSupport());
        assertEquals(110_000L, response.projectedReturn());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend
./mvnw.cmd -Dtest=PredictionQuoteServiceTest test
```

Expected: FAIL because `PredictionQuoteService` does not exist.

- [ ] **Step 3: Add quote service**

Create `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteService.java`:

```java
package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.prediction.dto.request.PredictionQuoteRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionOptionsResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionQuoteResponse;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionLiquidityState;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PredictionQuoteService {

    private final RaceRepository raceRepository;
    private final RaceParticipantRepository participantRepository;
    private final RacePredictionRepository predictionRepository;
    private final OddsCalculationService oddsCalculationService;

    @Value("${app.prediction.takeout-rate:0.15}")
    private BigDecimal takeoutRate;

    @Value("${app.prediction.minimum-return-multiplier:1.10}")
    private BigDecimal minimumReturnMultiplier;

    @Value("${app.prediction.support-cap:500000}")
    private long supportCap;

    @Value("${app.prediction.min-wager:10000}")
    private long minWager;

    @Value("${app.prediction.max-wager:500000}")
    private long maxWager;

    @Value("${app.prediction.quote-ttl-seconds:15}")
    private long quoteTtlSeconds;

    public PredictionQuoteService(
            RaceRepository raceRepository,
            RaceParticipantRepository participantRepository,
            RacePredictionRepository predictionRepository,
            OddsCalculationService oddsCalculationService
    ) {
        this.raceRepository = raceRepository;
        this.participantRepository = participantRepository;
        this.predictionRepository = predictionRepository;
        this.oddsCalculationService = oddsCalculationService;
    }

    public PredictionQuoteResponse quote(PredictionQuoteRequest request) {
        Race race = raceRepository.findById(request.getRaceId())
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        if (!RaceStatus.SCHEDULED.equals(race.getStatus()) || !race.getRaceAt().isAfter(LocalDateTime.now())) {
            return rejected(PredictionLiquidityState.DISABLED, request.getStakeAmount(), 0L, "Predictions are locked for this race.");
        }

        RaceParticipant selected = participantRepository.findByIdAndRace_Id(request.getPredictedWinnerId(), request.getRaceId())
                .orElseThrow(() -> new IllegalArgumentException("Predicted participant not found for this race"));
        List<RaceParticipant> activeParticipants = participantRepository.findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(
                request.getRaceId(), ParticipantStatus.WITHDRAWN);

        MarketContext market = marketContext(request, activeParticipants);
        List<PredictionQuoteCalculator.Stake> existingStakes = market.existingStakes();

        PredictionQuoteCalculator.QuoteResult result = PredictionQuoteCalculator.quote(
                new PredictionQuoteCalculator.QuoteInput(
                        request.getPredictedWinnerId(),
                        request.getStakeAmount(),
                        existingStakes,
                        takeoutRate,
                        minimumReturnMultiplier,
                        supportCap,
                        minWager,
                        maxWager
                )
        );

        String label = market.label(selected);
        String message = result.accepted()
                ? "Final payout is calculated at betting lock."
                : result.state().equals(PredictionLiquidityState.DISABLED)
                    ? "This market cannot support the minimum protected return right now."
                    : "Maximum supported stake for this selection is " + result.maxSupportedStake() + " VND.";

        return PredictionQuoteResponse.builder()
                .accepted(result.accepted())
                .liquidityState(result.state())
                .selectionLabel(label)
                .stakeAmount(request.getStakeAmount())
                .currentPoolEstimate(market.currentPoolEstimate())
                .estimatedAfterStake(result.effectiveOdds())
                .projectedReturn(result.projectedReturn())
                .estimatedProfit(result.estimatedProfit())
                .potentialLoss(request.getStakeAmount())
                .poolPayout(result.poolPayout())
                .marketSupport(result.supportAmount())
                .minimumProtectedReturn(result.minimumProtectedReturn())
                .minimumReturnMultiplier(minimumReturnMultiplier)
                .houseFeePercent(takeoutRate.multiply(new BigDecimal("100")).intValue())
                .maxSupportedStake(result.accepted() ? maxWager : result.maxSupportedStake())
                .quoteExpiresAt(LocalDateTime.now().plusSeconds(quoteTtlSeconds))
                .message(message)
                .build();
    }

    private PredictionQuoteResponse rejected(PredictionLiquidityState state, Long stakeAmount, Long maxSupportedStake, String message) {
        return PredictionQuoteResponse.builder()
                .accepted(false)
                .liquidityState(state)
                .stakeAmount(stakeAmount)
                .currentPoolEstimate(BigDecimal.ZERO)
                .estimatedAfterStake(BigDecimal.ZERO)
                .projectedReturn(0L)
                .estimatedProfit(0L)
                .potentialLoss(stakeAmount)
                .poolPayout(0L)
                .marketSupport(0L)
                .minimumProtectedReturn(0L)
                .minimumReturnMultiplier(minimumReturnMultiplier)
                .houseFeePercent(takeoutRate.multiply(new BigDecimal("100")).intValue())
                .maxSupportedStake(maxSupportedStake)
                .quoteExpiresAt(LocalDateTime.now().plusSeconds(quoteTtlSeconds))
                .message(message)
                .build();
    }

    private MarketContext marketContext(PredictionQuoteRequest request, List<RaceParticipant> activeParticipants) {
        List<RacePrediction> activePredictions = new ArrayList<>();
        activePredictions.addAll(predictionRepository.findByRace_IdAndStatus(request.getRaceId(), PredictionStatus.PENDING));
        activePredictions.addAll(predictionRepository.findByRace_IdAndStatus(request.getRaceId(), PredictionStatus.LOCKED));

        if (RacePrediction.TYPE_EXACT_POSITION.equals(request.getPredictionType())) {
            if (request.getPredictedPosition() == null) {
                throw new IllegalArgumentException("Predicted position is required for EXACT_POSITION");
            }
            Map<Long, Map<Integer, BigDecimal>> oddsMatrix =
                    oddsCalculationService.calculatePositionOddsMatrix(request.getRaceId(), activeParticipants);
            BigDecimal currentEstimate = oddsMatrix.getOrDefault(request.getPredictedWinnerId(), Map.of())
                    .getOrDefault(request.getPredictedPosition(), BigDecimal.ZERO);
            List<PredictionQuoteCalculator.Stake> stakes = activePredictions.stream()
                    .filter(p -> RacePrediction.TYPE_EXACT_POSITION.equals(p.getPredictionType()))
                    .filter(p -> Objects.equals(p.getPredictedPosition(), request.getPredictedPosition()))
                    .map(p -> new PredictionQuoteCalculator.Stake(p.getPredictedWinnerId(), stakeOf(p)))
                    .toList();
            return new MarketContext(currentEstimate, stakes, " to finish " + ordinal(request.getPredictedPosition()));
        }

        if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(request.getPredictionType())) {
            PredictionOptionsResponse.HeadToHeadMatchup matchup = oddsCalculationService
                    .calculateH2HMatchups(request.getRaceId(), activeParticipants)
                    .stream()
                    .filter(m -> Objects.equals(m.getParticipantAId(), request.getPredictedWinnerId())
                            || Objects.equals(m.getParticipantBId(), request.getPredictedWinnerId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Invalid participant for H2H matchup"));
            Long a = matchup.getParticipantAId();
            Long b = matchup.getParticipantBId();
            BigDecimal currentEstimate = Objects.equals(a, request.getPredictedWinnerId())
                    ? matchup.getOddsA()
                    : matchup.getOddsB();
            List<PredictionQuoteCalculator.Stake> stakes = activePredictions.stream()
                    .filter(p -> RacePrediction.TYPE_HEAD_TO_HEAD.equals(p.getPredictionType()))
                    .filter(p -> samePair(a, b, p.getPredictedWinnerId(), p.getMatchupOpponentId()))
                    .map(p -> new PredictionQuoteCalculator.Stake(p.getPredictedWinnerId(), stakeOf(p)))
                    .toList();
            return new MarketContext(currentEstimate, stakes, " to win head-to-head");
        }

        throw new IllegalArgumentException("Unsupported prediction type: " + request.getPredictionType());
    }

    private boolean samePair(Long a, Long b, Long x, Long y) {
        return Objects.equals(Math.min(a, b), Math.min(x, y)) && Objects.equals(Math.max(a, b), Math.max(x, y));
    }

    private long stakeOf(RacePrediction prediction) {
        return prediction.getWagerAmount() != null ? prediction.getWagerAmount() : prediction.getEntryCostPoints();
    }

    private String ordinal(Integer value) {
        return switch (value) {
            case 1 -> "1st";
            case 2 -> "2nd";
            case 3 -> "3rd";
            default -> value + "th";
        };
    }

    private record MarketContext(
            BigDecimal currentPoolEstimate,
            List<PredictionQuoteCalculator.Stake> existingStakes,
            String labelSuffix
    ) {
        String label(RaceParticipant selected) {
            String horseName = selected.getHorse() != null ? selected.getHorse().getName() : "Selected runner";
            return horseName + labelSuffix;
        }
    }
}
```

- [ ] **Step 4: Wire controller endpoint**

Modify `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java`:

Add imports:

```java
import com.example.horseracingtournamentsystem.prediction.dto.request.PredictionQuoteRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionQuoteResponse;
import com.example.horseracingtournamentsystem.prediction.service.PredictionQuoteService;
```

Add field:

```java
private final PredictionQuoteService predictionQuoteService;
```

Add constructor parameter and assignment:

```java
PredictionQuoteService predictionQuoteService
```

```java
this.predictionQuoteService = predictionQuoteService;
```

Add endpoint before `/predictions` submit:

```java
@PostMapping("/prediction-quotes")
public ResponseEntity<PredictionQuoteResponse> quotePrediction(@Valid @RequestBody PredictionQuoteRequest request) {
    return ResponseEntity.ok(predictionQuoteService.quote(request));
}
```

- [ ] **Step 5: Run backend tests**

Run:

```bash
cd backend
./mvnw.cmd -Dtest=PredictionQuoteServiceTest,PredictionQuoteCalculatorTest test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteService.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteServiceTest.java
git commit -m "feat: expose prediction quote endpoint"
```

## Task 4: Submit Guard, Quote Snapshot, and Fixed-Stake Update Rule

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/entity/RacePrediction.java`
- Add: `backend/src/main/resources/db/migration/V19__add_prediction_quote_snapshot.sql`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionService.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/entity/RacePredictionTest.java`

- [ ] **Step 1: Write failing entity test**

Append to `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/entity/RacePredictionTest.java`:

```java
@Test
void storesQuoteSnapshotFields() {
    RacePrediction prediction = new RacePrediction();
    prediction.setQuotedPoolPayout(85_000L);
    prediction.setQuotedSupportAmount(25_000L);
    prediction.setQuotedEffectiveOdds(new BigDecimal("1.1000"));
    prediction.setQuoteLiquidityState("LOW_LIQUIDITY_PROTECTED");
    java.time.LocalDateTime quotedAt = java.time.LocalDateTime.now();
    prediction.setQuotedAt(quotedAt);

    assertEquals(85_000L, prediction.getQuotedPoolPayout());
    assertEquals(25_000L, prediction.getQuotedSupportAmount());
    assertEquals(new BigDecimal("1.1000"), prediction.getQuotedEffectiveOdds());
    assertEquals("LOW_LIQUIDITY_PROTECTED", prediction.getQuoteLiquidityState());
    assertEquals(quotedAt, prediction.getQuotedAt());
}
```

- [ ] **Step 2: Run entity test to verify it fails**

Run:

```bash
cd backend
./mvnw.cmd -Dtest=RacePredictionTest test
```

Expected: FAIL because quote snapshot fields do not exist.

- [ ] **Step 3: Add quote snapshot fields**

Modify `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/entity/RacePrediction.java` by adding fields after `lockedOdds`:

```java
@Column(name = "quoted_pool_payout")
private Long quotedPoolPayout;

@Column(name = "quoted_support_amount")
private Long quotedSupportAmount;

@Column(name = "quoted_effective_odds", precision = 18, scale = 4)
private BigDecimal quotedEffectiveOdds;

@Column(name = "quote_liquidity_state", length = 40)
private String quoteLiquidityState;

@Column(name = "quoted_at")
private LocalDateTime quotedAt;
```

- [ ] **Step 4: Add migration**

Create `backend/src/main/resources/db/migration/V19__add_prediction_quote_snapshot.sql`:

```sql
ALTER TABLE race_predictions
    ADD COLUMN IF NOT EXISTS quoted_pool_payout BIGINT,
    ADD COLUMN IF NOT EXISTS quoted_support_amount BIGINT,
    ADD COLUMN IF NOT EXISTS quoted_effective_odds NUMERIC(18,4),
    ADD COLUMN IF NOT EXISTS quote_liquidity_state VARCHAR(40),
    ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMP;
```

- [ ] **Step 5: Inject quote service into PredictionService**

Modify `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionService.java`.

Add import:

```java
import com.example.horseracingtournamentsystem.prediction.dto.request.PredictionQuoteRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionQuoteResponse;
```

Add field:

```java
private final PredictionQuoteService predictionQuoteService;
```

Add constructor parameter:

```java
PredictionQuoteService predictionQuoteService
```

Assign it:

```java
this.predictionQuoteService = predictionQuoteService;
```

- [ ] **Step 6: Add helper to create a quote request**

Add this private method in `PredictionService`:

```java
private PredictionQuoteRequest toQuoteRequest(SubmitPredictionRequest request) {
    PredictionQuoteRequest quoteRequest = new PredictionQuoteRequest();
    quoteRequest.setRaceId(request.getRaceId());
    quoteRequest.setPredictionType(request.getPredictionType());
    quoteRequest.setPredictedWinnerId(request.getPredictedWinnerId());
    quoteRequest.setPredictedPosition(request.getPredictedPosition());
    quoteRequest.setStakeAmount(request.getWagerAmount());
    return quoteRequest;
}
```

- [ ] **Step 7: Recompute quote before saving submit**

In `submitPrediction`, after stake min/max validation and before creating `RacePrediction`, add:

```java
PredictionQuoteResponse quote = predictionQuoteService.quote(toQuoteRequest(request));
if (!quote.accepted()) {
    throw new IllegalStateException(quote.message());
}
```

After setting `lockedOdds`, set quote snapshot values:

```java
prediction.setQuotedPoolPayout(quote.poolPayout());
prediction.setQuotedSupportAmount(quote.marketSupport());
prediction.setQuotedEffectiveOdds(quote.estimatedAfterStake());
prediction.setQuoteLiquidityState(quote.liquidityState().name());
prediction.setQuotedAt(LocalDateTime.now());
```

- [ ] **Step 8: Keep update stake fixed for MVP**

In `updatePrediction`, after checking prediction type, add:

```java
long existingStake = prediction.getWagerAmount() != null ? prediction.getWagerAmount() : prediction.getEntryCostPoints();
if (!Objects.equals(existingStake, request.getWagerAmount())) {
    throw new IllegalArgumentException("Changing stake on an existing prediction is not supported yet. Place a new prediction instead.");
}
```

When update changes selection, recompute quote with the existing stake and update quote snapshot:

```java
PredictionQuoteResponse quote = predictionQuoteService.quote(toQuoteRequest(request));
if (!quote.accepted()) {
    throw new IllegalStateException(quote.message());
}
prediction.setQuotedPoolPayout(quote.poolPayout());
prediction.setQuotedSupportAmount(quote.marketSupport());
prediction.setQuotedEffectiveOdds(quote.estimatedAfterStake());
prediction.setQuoteLiquidityState(quote.liquidityState().name());
prediction.setQuotedAt(LocalDateTime.now());
```

- [ ] **Step 9: Run backend tests**

Run:

```bash
cd backend
./mvnw.cmd -Dtest=RacePredictionTest,PredictionQuoteCalculatorTest,PredictionQuoteServiceTest test
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/src/main/java/com/example/horseracingtournamentsystem/prediction/entity/RacePrediction.java backend/src/main/resources/db/migration/V19__add_prediction_quote_snapshot.sql backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionService.java backend/src/test/java/com/example/horseracingtournamentsystem/prediction/entity/RacePredictionTest.java
git commit -m "feat: validate predictions with realtime quote"
```

## Task 5: Frontend Quote Types, API, and Quote Movement Helpers

**Files:**
- Modify: `frontend/src/pages/spectator/predictions/types/prediction.types.ts`
- Modify: `frontend/src/pages/spectator/predictions/services/spectatorPredictionApi.ts`
- Modify: `frontend/src/pages/spectator/predictions/predictionCockpitUtils.ts`
- Modify: `frontend/src/pages/spectator/predictions/predictionCockpitUtils.test.ts`

- [ ] **Step 1: Write failing utility tests**

Append to `frontend/src/pages/spectator/predictions/predictionCockpitUtils.test.ts`:

```ts
import { hasMaterialQuoteMovement, quoteStateLabel } from "./predictionCockpitUtils";

it("detects material quote movement by projected return", () => {
  expect(hasMaterialQuoteMovement(500000, 420000, 0.1)).toBe(true);
  expect(hasMaterialQuoteMovement(500000, 470000, 0.1)).toBe(false);
  expect(hasMaterialQuoteMovement(0, 100000, 0.1)).toBe(false);
});

it("labels quote liquidity states for users", () => {
  expect(quoteStateLabel("POOL_ACTIVE")).toBe("POOL ACTIVE | PROVISIONAL");
  expect(quoteStateLabel("LOW_LIQUIDITY_PROTECTED")).toBe("LOW LIQUIDITY | PROTECTED");
  expect(quoteStateLabel("STAKE_TOO_HIGH")).toBe("STAKE TOO HIGH");
  expect(quoteStateLabel("DISABLED")).toBe("TEMPORARILY UNAVAILABLE");
});
```

- [ ] **Step 2: Run utility tests to verify they fail**

Run:

```bash
cd frontend
npm test -- predictionCockpitUtils.test.ts --run
```

Expected: FAIL because quote helpers do not exist.

- [ ] **Step 3: Add frontend quote types**

Append to `frontend/src/pages/spectator/predictions/types/prediction.types.ts`:

```ts
export type PredictionLiquidityState =
  | "POOL_ACTIVE"
  | "LOW_LIQUIDITY_PROTECTED"
  | "STAKE_TOO_HIGH"
  | "DISABLED";

export interface PredictionQuoteRequest {
  raceId: number;
  predictionType: "EXACT_POSITION" | "HEAD_TO_HEAD";
  predictedWinnerId: number;
  predictedPosition?: number | null;
  stakeAmount: number;
}

export interface PredictionQuoteResponse {
  accepted: boolean;
  liquidityState: PredictionLiquidityState;
  selectionLabel?: string;
  stakeAmount: number;
  currentPoolEstimate: number;
  estimatedAfterStake: number;
  projectedReturn: number;
  estimatedProfit: number;
  potentialLoss: number;
  poolPayout: number;
  marketSupport: number;
  minimumProtectedReturn: number;
  minimumReturnMultiplier: number;
  houseFeePercent: number;
  maxSupportedStake: number;
  quoteExpiresAt: string;
  message: string;
}
```

- [ ] **Step 4: Add quote API client**

Modify `frontend/src/pages/spectator/predictions/services/spectatorPredictionApi.ts`.

Add imports:

```ts
  PredictionQuoteRequest,
  PredictionQuoteResponse,
```

Add method inside `spectatorPredictionApi`:

```ts
  getPredictionQuote: (payload: PredictionQuoteRequest) =>
    httpClient.post<PredictionQuoteResponse>("/prediction-quotes", payload).then(res => res.data),
```

- [ ] **Step 5: Add quote helpers**

Append to `frontend/src/pages/spectator/predictions/predictionCockpitUtils.ts`:

```ts
import type { PredictionLiquidityState } from "./types/prediction.types";

export function hasMaterialQuoteMovement(previousReturn: number, currentReturn: number, threshold = 0.1): boolean {
  if (!Number.isFinite(previousReturn) || previousReturn <= 0) return false;
  if (!Number.isFinite(currentReturn) || currentReturn < 0) return false;
  return Math.abs(currentReturn - previousReturn) / previousReturn > threshold;
}

export function quoteStateLabel(state: PredictionLiquidityState): string {
  switch (state) {
    case "POOL_ACTIVE":
      return "POOL ACTIVE | PROVISIONAL";
    case "LOW_LIQUIDITY_PROTECTED":
      return "LOW LIQUIDITY | PROTECTED";
    case "STAKE_TOO_HIGH":
      return "STAKE TOO HIGH";
    case "DISABLED":
      return "TEMPORARILY UNAVAILABLE";
  }
}
```

If the file already imports from `prediction.types`, merge this import with the existing type import instead of adding a duplicate import.

- [ ] **Step 6: Run frontend utility tests**

Run:

```bash
cd frontend
npm test -- predictionCockpitUtils.test.ts --run
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/spectator/predictions/types/prediction.types.ts frontend/src/pages/spectator/predictions/services/spectatorPredictionApi.ts frontend/src/pages/spectator/predictions/predictionCockpitUtils.ts frontend/src/pages/spectator/predictions/predictionCockpitUtils.test.ts
git commit -m "feat: add prediction quote frontend contract"
```

## Task 6: PayoutEstimatePanel Component

**Files:**
- Create: `frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.test.tsx`

- [ ] **Step 1: Write failing component tests**

Create `frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PayoutEstimatePanel } from "./PayoutEstimatePanel";
import type { PredictionQuoteResponse } from "../types/prediction.types";

const quote: PredictionQuoteResponse = {
  accepted: true,
  liquidityState: "LOW_LIQUIDITY_PROTECTED",
  selectionLabel: "Crimson Dynasty to finish 1st",
  stakeAmount: 100000,
  currentPoolEstimate: 50,
  estimatedAfterStake: 1.1,
  projectedReturn: 110000,
  estimatedProfit: 10000,
  potentialLoss: 100000,
  poolPayout: 85000,
  marketSupport: 25000,
  minimumProtectedReturn: 110000,
  minimumReturnMultiplier: 1.1,
  houseFeePercent: 15,
  maxSupportedStake: 120000,
  quoteExpiresAt: new Date(Date.now() + 15000).toISOString(),
  message: "Final payout is calculated at betting lock.",
};

describe("PayoutEstimatePanel", () => {
  it("renders backend quote money rows without local payout math", () => {
    render(<PayoutEstimatePanel quote={quote} loading={false} quoteNeedsReview={false} onReviewQuote={vi.fn()} />);

    expect(screen.getByText(/LOW LIQUIDITY \| PROTECTED/i)).toBeInTheDocument();
    expect(screen.getByText(/Crimson Dynasty to finish 1st/i)).toBeInTheDocument();
    expect(screen.getByText(/110,000 VND/i)).toBeInTheDocument();
    expect(screen.getByText(/\+10,000 VND/i)).toBeInTheDocument();
    expect(screen.getByText(/Pool payout/i)).toBeInTheDocument();
    expect(screen.getByText(/85,000 VND/i)).toBeInTheDocument();
    expect(screen.getByText(/Market support/i)).toBeInTheDocument();
    expect(screen.getByText(/25,000 VND/i)).toBeInTheDocument();
    expect(screen.getByText(/You lose: 100,000 VND/i)).toBeInTheDocument();
  });

  it("shows stake-too-high action copy", () => {
    render(
      <PayoutEstimatePanel
        quote={{ ...quote, accepted: false, liquidityState: "STAKE_TOO_HIGH", maxSupportedStake: 120000, message: "Maximum supported stake for this selection is 120,000 VND." }}
        loading={false}
        quoteNeedsReview={false}
        onReviewQuote={vi.fn()}
      />
    );

    expect(screen.getByText(/Stake exceeds available market support/i)).toBeInTheDocument();
    expect(screen.getByText(/120,000 VND/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run component test to verify it fails**

Run:

```bash
cd frontend
npm test -- PayoutEstimatePanel.test.tsx --run
```

Expected: FAIL because `PayoutEstimatePanel` does not exist.

- [ ] **Step 3: Add PayoutEstimatePanel component**

Create `frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.tsx`:

```tsx
import { AlertTriangle, Info, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { formatVnd, quoteStateLabel } from "../predictionCockpitUtils";
import type { PredictionQuoteResponse } from "../types/prediction.types";

interface PayoutEstimatePanelProps {
  quote: PredictionQuoteResponse | null;
  loading: boolean;
  quoteNeedsReview: boolean;
  onReviewQuote: () => void;
}

export function PayoutEstimatePanel({ quote, loading, quoteNeedsReview, onReviewQuote }: PayoutEstimatePanelProps) {
  if (loading) {
    return (
      <section className="rounded-lg border border-turf-800 bg-turf-850 p-4" aria-label="Payout estimate">
        <div className="flex items-center gap-2 text-[12px] font-bold text-ivory-dim">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Updating payout estimate...
        </div>
      </section>
    );
  }

  if (!quote) {
    return (
      <section className="rounded-lg border border-turf-800 bg-turf-850 p-4" aria-label="Payout estimate">
        <p className="font-data text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">Payout Estimate</p>
        <p className="mt-2 text-[12px] font-semibold text-ivory-dim">
          Choose a horse and enter a stake to see a realtime estimate.
        </p>
      </section>
    );
  }

  if (quote.liquidityState === "STAKE_TOO_HIGH") {
    return (
      <section className="rounded-lg border border-amber-400/30 bg-amber-400/8 p-4" aria-label="Payout estimate">
        <p className="font-data text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">Stake exceeds available market support</p>
        <p className="mt-3 text-[12px] font-semibold text-ivory-dim">Maximum supported stake</p>
        <p className="font-data text-2xl font-black text-amber-200">{formatVnd(quote.maxSupportedStake)} VND</p>
        <p className="mt-2 text-[12px] font-semibold text-ivory-dim">Reduce your stake to keep minimum return protection.</p>
      </section>
    );
  }

  if (quote.liquidityState === "DISABLED") {
    return (
      <section className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-4" aria-label="Payout estimate">
        <p className="font-data text-[10px] font-bold uppercase tracking-[0.16em] text-rose-200">Temporarily unavailable</p>
        <p className="mt-2 text-[12px] font-semibold text-rose-100">{quote.message}</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-turf-800 bg-turf-850 p-4" aria-label="Payout estimate">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">Payout Estimate</p>
          <p className="mt-1 font-data text-[10px] font-bold uppercase tracking-[0.14em] text-ivory-faint">
            {quoteStateLabel(quote.liquidityState)}
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 text-gold-300" />
      </div>

      {quote.selectionLabel ? (
        <p className="mt-3 rounded-md border border-turf-800 bg-turf-900/60 px-3 py-2 text-[12px] font-bold text-ivory">
          {quote.selectionLabel}
        </p>
      ) : null}

      {quoteNeedsReview ? (
        <div className="mt-3 rounded-md border border-amber-400/30 bg-amber-400/10 p-3">
          <div className="flex items-center gap-2 text-[12px] font-bold text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Quote updated. Please review before confirming.
          </div>
          <button
            type="button"
            onClick={onReviewQuote}
            className="mt-2 rounded-md bg-amber-300 px-3 py-1.5 text-[12px] font-extrabold text-turf-950"
          >
            Review latest quote
          </button>
        </div>
      ) : null}

      <dl className="mt-3 space-y-2 text-[12px] font-semibold">
        <div className="flex justify-between gap-3">
          <dt className="text-ivory-dim">Your stake</dt>
          <dd className="font-data text-ivory">{formatVnd(quote.stakeAmount)} VND</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ivory-dim">Current pool estimate</dt>
          <dd className="font-data text-ivory">{quote.currentPoolEstimate.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ivory-dim">Estimated after your stake</dt>
          <dd className="font-data text-gold-300">{quote.estimatedAfterStake.toFixed(2)}</dd>
        </div>
      </dl>

      <div className="mt-3 rounded-lg border border-emerald-glow/25 bg-emerald-glow/[0.07] p-3">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-soft" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-soft">If correct</p>
        </div>
        <p className="mt-2 font-data text-2xl font-black leading-none text-emerald-soft">
          {formatVnd(quote.projectedReturn)} <span className="text-[12px]">VND</span>
        </p>
        <p className="mt-1 text-[12px] font-semibold text-emerald-soft/85">
          Estimated profit: +{formatVnd(quote.estimatedProfit)} VND
        </p>
      </div>

      <dl className="mt-3 space-y-2 rounded-lg border border-turf-800 bg-turf-900/60 p-3 text-[12px] font-semibold">
        <div className="flex justify-between gap-3">
          <dt className="text-ivory-dim">Pool payout</dt>
          <dd className="font-data text-ivory">{formatVnd(quote.poolPayout)} VND</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ivory-dim">Market support</dt>
          <dd className="font-data text-ivory">{formatVnd(quote.marketSupport)} VND</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ivory-dim">House fee</dt>
          <dd className="font-data text-ivory">{quote.houseFeePercent}% included</dd>
        </div>
      </dl>

      <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-[12px] font-bold text-rose-200">
        If incorrect, you lose: {formatVnd(quote.potentialLoss)} VND
      </p>

      <p className="mt-3 flex items-start gap-1.5 text-[10.5px] font-medium leading-relaxed text-ivory-faint">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        <span>Your stake stays fixed. Estimated return may move with the market until betting locks.</span>
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Run component tests**

Run:

```bash
cd frontend
npm test -- PayoutEstimatePanel.test.tsx --run
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.tsx frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.test.tsx
git commit -m "feat: add payout estimate panel"
```

## Task 7: Wire Realtime Quotes Into Prediction UI

**Files:**
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`
- Modify: `frontend/src/pages/spectator/predictions/components/PredictionSlip.tsx`
- Modify: `frontend/src/pages/spectator/predictions/components/RunnerTable.tsx`
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`

- [ ] **Step 1: Update API mock in page test**

Modify the mock in `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx` to include:

```ts
getPredictionQuote: vi.fn(),
```

Add this default in `beforeEach`:

```ts
vi.mocked(spectatorPredictionApi.getPredictionQuote).mockResolvedValue({
  accepted: true,
  liquidityState: "LOW_LIQUIDITY_PROTECTED",
  selectionLabel: "Thunder Bay to finish 1st",
  stakeAmount: 10000,
  currentPoolEstimate: 50,
  estimatedAfterStake: 1.1,
  projectedReturn: 11000,
  estimatedProfit: 1000,
  potentialLoss: 10000,
  poolPayout: 8500,
  marketSupport: 2500,
  minimumProtectedReturn: 11000,
  minimumReturnMultiplier: 1.1,
  houseFeePercent: 15,
  maxSupportedStake: 120000,
  quoteExpiresAt: new Date(Date.now() + 15000).toISOString(),
  message: "Final payout is calculated at betting lock.",
});
```

- [ ] **Step 2: Update test selection to exact-position cell**

Replace the winner button click helper in the first test with an exact-position cell click:

```ts
fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
const positionCells = await screen.findAllByRole("button", { name: /50\.00|-/i });
fireEvent.click(positionCells[0]);
```

Then assert:

```ts
expect(await screen.findByText(/Thunder Bay to finish 1st/i)).toBeInTheDocument();
expect(screen.getByText(/11,000 VND/i)).toBeInTheDocument();
expect(spectatorPredictionApi.getPredictionQuote).toHaveBeenCalled();
```

- [ ] **Step 3: Run page test to verify it fails**

Run:

```bash
cd frontend
npm test -- SpectatorPredictionsPage.test.tsx --run
```

Expected: FAIL because the page does not call `getPredictionQuote` or render `PayoutEstimatePanel`.

- [ ] **Step 4: Add quote state to SpectatorPredictionsPage**

Modify `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`.

Add type import:

```ts
import type { PredictionQuoteResponse } from "./types/prediction.types";
```

Add state near `wagerAmount`:

```ts
const [predictionQuote, setPredictionQuote] = useState<PredictionQuoteResponse | null>(null);
const [quoteLoading, setQuoteLoading] = useState(false);
const [quoteNeedsReview, setQuoteNeedsReview] = useState(false);
const previousProjectedReturnRef = useRef<number | null>(null);
```

Add effect after validation:

```ts
useEffect(() => {
  if (!selectedRace || predType === "WINNING_STREAK" || !picks.winnerId || (predType === "EXACT_POSITION" && !picks.predictedPosition)) {
    setPredictionQuote(null);
    previousProjectedReturnRef.current = null;
    return;
  }

  const handle = window.setTimeout(() => {
    setQuoteLoading(true);
    spectatorPredictionApi.getPredictionQuote({
      raceId: selectedRace.raceId,
      predictionType: predType as "EXACT_POSITION" | "HEAD_TO_HEAD",
      predictedWinnerId: picks.winnerId,
      predictedPosition: predType === "EXACT_POSITION" ? picks.predictedPosition : null,
      stakeAmount: wagerAmount,
    })
      .then((quote) => {
        const previous = previousProjectedReturnRef.current;
        if (previous != null && Math.abs(quote.projectedReturn - previous) / previous > 0.1) {
          setQuoteNeedsReview(true);
        }
        previousProjectedReturnRef.current = quote.projectedReturn;
        setPredictionQuote(quote);
      })
      .catch(() => {
        setPredictionQuote(null);
      })
      .finally(() => setQuoteLoading(false));
  }, 350);

  return () => window.clearTimeout(handle);
}, [selectedRace?.raceId, predType, picks.winnerId, picks.predictedPosition, wagerAmount]);
```

Add periodic refresh:

```ts
useEffect(() => {
  if (!selectedRace || predType === "WINNING_STREAK" || !picks.winnerId || (predType === "EXACT_POSITION" && !picks.predictedPosition)) {
    return;
  }
  const interval = window.setInterval(() => {
    spectatorPredictionApi.getPredictionQuote({
      raceId: selectedRace.raceId,
      predictionType: predType as "EXACT_POSITION" | "HEAD_TO_HEAD",
      predictedWinnerId: picks.winnerId,
      predictedPosition: predType === "EXACT_POSITION" ? picks.predictedPosition : null,
      stakeAmount: wagerAmount,
    }).then((quote) => {
      const previous = previousProjectedReturnRef.current;
      if (previous != null && Math.abs(quote.projectedReturn - previous) / previous > 0.1) {
        setQuoteNeedsReview(true);
      }
      previousProjectedReturnRef.current = quote.projectedReturn;
      setPredictionQuote(quote);
    }).catch(() => undefined);
  }, 5000);
  return () => window.clearInterval(interval);
}, [selectedRace?.raceId, predType, picks.winnerId, picks.predictedPosition, wagerAmount]);
```

Add review handler prop:

```ts
const handleReviewLatestQuote = () => setQuoteNeedsReview(false);
```

- [ ] **Step 5: Pass quote into PredictionSlip**

Modify the `PredictionSlip` JSX call:

```tsx
<PredictionSlip
  race={selectedRace}
  options={predictionOptions}
  predType={predType}
  picks={picks}
  wagerAmount={wagerAmount}
  pointBalance={pointBalance}
  isUpdate={Boolean(existingPred)}
  myPredictions={myPredictions}
  predictionQuote={predictionQuote}
  quoteLoading={quoteLoading}
  quoteNeedsReview={quoteNeedsReview}
  onReviewQuote={handleReviewLatestQuote}
  onClear={handleClearSelections}
  onConfirm={handleCockpitConfirm}
  onEditPrediction={handleEdit}
  onViewAll={() => setIsAllPredictionsModalOpen(true)}
/>
```

- [ ] **Step 6: Render panel in PredictionSlip and gate confirm**

Modify `PredictionSlipProps` in `frontend/src/pages/spectator/predictions/components/PredictionSlip.tsx`:

```ts
import type { OpenRacePrediction, PredictionOptions, PredictionQuoteResponse, PredictionType, UserPrediction } from "../types/prediction.types";
import { PayoutEstimatePanel } from "./PayoutEstimatePanel";
```

Add props:

```ts
predictionQuote: PredictionQuoteResponse | null;
quoteLoading: boolean;
quoteNeedsReview: boolean;
onReviewQuote: () => void;
```

Destructure them in the component signature.

Change `canConfirm`:

```ts
const quoteAllowsConfirm = Boolean(predictionQuote?.accepted) && !quoteNeedsReview && !quoteLoading;
const canConfirm = validation.canConfirm && quoteAllowsConfirm && !submitting && success == null;
```

Replace the `PayoutReceipt` block with:

```tsx
<PayoutEstimatePanel
  quote={predictionQuote}
  loading={quoteLoading}
  quoteNeedsReview={quoteNeedsReview}
  onReviewQuote={onReviewQuote}
/>
```

- [ ] **Step 7: Update grid wording**

Modify exact-position cell text in `frontend/src/pages/spectator/predictions/components/RunnerTable.tsx`:

```tsx
<span className="block leading-tight">{odds ? odds.toFixed(2) : "-"}</span>
{odds && odds >= 20 ? <span className="block text-[9px] font-semibold opacity-75">Thin pool</span> : null}
```

Add `title` to the button:

```tsx
title="Current pool estimate. Your payout is quoted after your stake and may change until betting locks."
```

- [ ] **Step 8: Run frontend page test**

Run:

```bash
cd frontend
npm test -- SpectatorPredictionsPage.test.tsx --run
```

Expected: PASS.

- [ ] **Step 9: Run focused frontend tests**

Run:

```bash
cd frontend
npm test -- predictionCockpitUtils.test.ts PayoutEstimatePanel.test.tsx SpectatorPredictionsPage.test.tsx --run
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx frontend/src/pages/spectator/predictions/components/PredictionSlip.tsx frontend/src/pages/spectator/predictions/components/RunnerTable.tsx frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx
git commit -m "feat: wire realtime payout quotes into spectator UI"
```

## Task 8: Verification and Regression Sweep

**Files:**
- Modify only files from previous tasks if verification finds failures.

- [ ] **Step 1: Run backend focused prediction tests**

Run:

```bash
cd backend
./mvnw.cmd -Dtest=PredictionQuoteCalculatorTest,PredictionQuoteServiceTest,RacePredictionTest,PredictionSettlementSchedulerTest,SpectatorPredictionDtoIntegrationTest test
```

Expected: PASS. If a pre-existing unrelated failure appears, record the exact failing class and method in the final handoff.

- [ ] **Step 2: Run frontend focused tests**

Run:

```bash
cd frontend
npm test -- predictionCockpitUtils.test.ts PayoutEstimatePanel.test.tsx SpectatorPredictionsPage.test.tsx --run
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run backend compile**

Run:

```bash
cd backend
./mvnw.cmd -DskipTests compile
```

Expected: PASS.

- [ ] **Step 5: Commit verification fixes if any**

If files changed during verification:

```bash
git add backend/src/main/java/com/example/horseracingtournamentsystem/prediction/enums/PredictionLiquidityState.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/request/PredictionQuoteRequest.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/response/PredictionQuoteResponse.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculator.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteService.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionService.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/entity/RacePrediction.java backend/src/main/resources/db/migration/V19__add_prediction_quote_snapshot.sql backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteCalculatorTest.java backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/PredictionQuoteServiceTest.java backend/src/test/java/com/example/horseracingtournamentsystem/prediction/entity/RacePredictionTest.java frontend/src/pages/spectator/predictions/types/prediction.types.ts frontend/src/pages/spectator/predictions/services/spectatorPredictionApi.ts frontend/src/pages/spectator/predictions/predictionCockpitUtils.ts frontend/src/pages/spectator/predictions/predictionCockpitUtils.test.ts frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.tsx frontend/src/pages/spectator/predictions/components/PayoutEstimatePanel.test.tsx frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx frontend/src/pages/spectator/predictions/components/PredictionSlip.tsx frontend/src/pages/spectator/predictions/components/RunnerTable.tsx frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx
git commit -m "fix: stabilize prediction quote payout flow"
```

If no files changed, do not create an empty commit.

## Execution Notes

- The current worktree already contains many uncommitted prediction changes outside this plan. Do not revert them.
- Keep each task commit scoped to files listed in that task.
- Do not add WebSocket/SSE in this implementation.
- Do not add automatic stake changes.
- Do not make grid odds look like guaranteed fixed odds.
- Keep real money rows sourced from `PredictionQuoteResponse`.
- Treat `PayoutReceipt.tsx` as replaceable after `PayoutEstimatePanel` is wired; remove it only if no imports remain.

## Review Checklist

- Backend quote values are generated by backend code, not frontend multiplication.
- `PredictionService.submitPrediction` recomputes quote before wallet deduction.
- Existing prediction stake changes are rejected for MVP.
- Grid copy says estimate/thin pool, not fixed payout.
- Confirm button requires an accepted current quote.
- Material quote movement requires review.
- Tests cover low-liquidity support and stake-too-high behavior.
