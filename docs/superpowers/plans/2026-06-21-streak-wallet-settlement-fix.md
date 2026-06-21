# Streak Wallet And Settlement Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deduct streak wagers exactly once and credit winning streaks exactly once with `wager * sum(active leg odds)`, including stake.

**Architecture:** Keep streak ticket creation and point deduction in the existing service transaction, but give streak ledger entries their own reference namespace. Keep settlement in the existing scheduler and make a refunded leg contribute additive identity zero. Add focused service and scheduler tests around the real domain objects, while mocking repository boundaries.

**Tech Stack:** Java 21, Spring Boot 4.0.6, Spring Data JPA, JUnit 5, Mockito, Maven

---

## File Map

- Create `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/StreakPredictionServiceTest.java`: verifies additive odds and streak-specific wager deduction.
- Create `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/StreakPointAccountingIntegrationTest.java`: verifies persisted balance changes and independent race/streak idempotency keys.
- Create `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementSchedulerTest.java`: verifies additive payout, refunded-leg zero contribution, and retry safety.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/point/entity/PointTransaction.java`: define the streak ledger reference namespace.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/StreakPredictionService.java`: use additive odds and the streak ledger reference for deduction.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementScheduler.java`: use additive odds, zero-out refunded legs, and use the streak ledger reference for payout.
- Verify `frontend/src/pages/spectator/predictions/components/StreakSlip.tsx`: retain the already-present additive total shown to the user; no unrelated UI redesign.

### Task 1: Lock the submission accounting contract

**Files:**
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/StreakPredictionServiceTest.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/StreakPredictionServiceTest.java`

- [x] **Step 1: Write the focused submission test**

Create a Mockito test that builds two scheduled races with winner odds `1.50` and `2.25`, submits a 10,000-point streak, and asserts total odds `3.75` plus this exact ledger call:

```java
verify(pointsService).adjustPoints(
        spectator,
        -10_000,
        PointTransactionType.PREDICTION_ENTRY,
        PointTransaction.REF_STREAK_PREDICTION,
        41L,
        "Deducted 10000 points for streak prediction #41"
);
```

The fixture must stub `saveAndFlush` to assign ID `41`, provide participant horse names needed by response mapping, and return a point balance above the wager.

Use this complete test file:

```java
package com.example.horseracingtournamentsystem.prediction.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.point.entity.PointTransaction;
import com.example.horseracingtournamentsystem.point.entity.PointTransactionType;
import com.example.horseracingtournamentsystem.point.service.PointAccountService;
import com.example.horseracingtournamentsystem.prediction.dto.request.StreakPredictionLegRequest;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitStreakPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.StreakPredictionResponse;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StreakPredictionServiceTest {

    @Mock private StreakPredictionRepository streakRepository;
    @Mock private UserRepository userRepository;
    @Mock private TournamentRepository tournamentRepository;
    @Mock private RaceRepository raceRepository;
    @Mock private RaceParticipantRepository participantRepository;
    @Mock private OddsCalculationService oddsService;
    @Mock private PointAccountService pointsService;

    private StreakPredictionService service;

    @BeforeEach
    void setUp() {
        service = new StreakPredictionService(
                streakRepository, userRepository, tournamentRepository,
                raceRepository, participantRepository, oddsService, pointsService);
    }

    @Test
    void submitAddsLegOddsAndDeductsUsingStreakReference() {
        User spectator = mock(User.class);
        Tournament tournament = mock(Tournament.class);
        Race raceOne = race(101L, "Race One");
        Race raceTwo = race(102L, "Race Two");
        RaceParticipant horseOne = participant(1001L, "Alpha");
        RaceParticipant horseTwo = participant(1002L, "Bravo");

        when(spectator.getId()).thenReturn(7L);
        when(tournament.getId()).thenReturn(3L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(spectator));
        when(tournamentRepository.findById(3L)).thenReturn(Optional.of(tournament));
        when(raceRepository.findById(101L)).thenReturn(Optional.of(raceOne));
        when(raceRepository.findById(102L)).thenReturn(Optional.of(raceTwo));
        when(participantRepository.findById(1001L)).thenReturn(Optional.of(horseOne));
        when(participantRepository.findById(1002L)).thenReturn(Optional.of(horseTwo));
        when(participantRepository.findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(
                anyLong(), any(ParticipantStatus.class)))
                .thenReturn(List.of(horseOne, horseTwo));
        when(oddsService.calculatePositionOddsMatrix(anyLong(), anyList())).thenReturn(Map.of(
                1001L, Map.of(1, new BigDecimal("1.50")),
                1002L, Map.of(1, new BigDecimal("2.25"))));
        when(pointsService.getBalance(7L)).thenReturn(100_000);
        when(streakRepository.saveAndFlush(any(StreakPrediction.class))).thenAnswer(invocation -> {
            StreakPrediction streak = invocation.getArgument(0);
            streak.setId(41L);
            return streak;
        });

        SubmitStreakPredictionRequest request = new SubmitStreakPredictionRequest();
        request.setTournamentId(3L);
        request.setWagerAmount(10_000);
        request.setLegs(List.of(leg(101L, 1001L), leg(102L, 1002L)));

        StreakPredictionResponse response = service.submitStreakPrediction(7L, request);

        assertEquals(new BigDecimal("3.75"), response.getTotalOdds());
        verify(pointsService).adjustPoints(
                spectator, -10_000, PointTransactionType.PREDICTION_ENTRY,
                PointTransaction.REF_STREAK_PREDICTION, 41L,
                "Deducted 10000 points for streak prediction #41");
    }

    private Race race(Long id, String name) {
        Race race = mock(Race.class);
        when(race.getId()).thenReturn(id);
        when(race.getName()).thenReturn(name);
        when(race.getStatus()).thenReturn(RaceStatus.SCHEDULED);
        return race;
    }

    private RaceParticipant participant(Long id, String horseName) {
        RaceParticipant participant = mock(RaceParticipant.class);
        Horse horse = mock(Horse.class);
        when(participant.getId()).thenReturn(id);
        when(participant.getStatus()).thenReturn(ParticipantStatus.APPROVED);
        when(participant.getHorse()).thenReturn(horse);
        when(horse.getName()).thenReturn(horseName);
        return participant;
    }

    private StreakPredictionLegRequest leg(Long raceId, Long participantId) {
        StreakPredictionLegRequest leg = new StreakPredictionLegRequest();
        leg.setRaceId(raceId);
        leg.setPredictedWinnerId(participantId);
        return leg;
    }
}
```


- [x] **Step 2: Run the submission test**

Run:

```powershell
cd backend
.\mvnw.cmd -Dtest=StreakPredictionServiceTest test
```

Expected against the pre-fix implementation: FAIL because streak entries use `RACE_PREDICTION` and/or total odds are multiplied. The current dirty worktree already contains part of the intended correction, so record whether this regression test passes due to pre-existing user changes rather than pretending a new red failure occurred.

- [x] **Step 3: Preserve only the required submission behavior**

Ensure production code contains:

```java
public static final String REF_STREAK_PREDICTION = "STREAK_PREDICTION";
```

```java
BigDecimal totalOdds = BigDecimal.ZERO;
// for each accepted leg
totalOdds = totalOdds.add(legOdds);
```

```java
pointsService.adjustPoints(
        spectator,
        -request.getWagerAmount(),
        PointTransactionType.PREDICTION_ENTRY,
        PointTransaction.REF_STREAK_PREDICTION,
        saved.getId(),
        "Deducted " + request.getWagerAmount() + " points for streak prediction #" + saved.getId()
);
```

Do not alter unrelated single-race prediction behavior.

- [x] **Step 4: Re-run the focused test**

Run the same Maven command. Expected: PASS.

### Task 2: Lock winning and refunded-leg settlement behavior

**Files:**
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementSchedulerTest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementScheduler.java`

- [x] **Step 1: Write a winning payout test**

Build a real `StreakPrediction` with a previously won leg at `1.50` and a pending winning leg at `2.25`. Mock the race result as position 1, call `processJob`, and assert:

```java
assertEquals(StreakPredictionStatus.WON, streak.getStatus());
assertEquals(new BigDecimal("3.75"), streak.getTotalOdds());
assertEquals(37_500, streak.getRewardPoints());
verify(pointsService).adjustPoints(
        spectator,
        37_500,
        PointTransactionType.PREDICTION_REWARD,
        PointTransaction.REF_STREAK_PREDICTION,
        streak.getId(),
        "Awarded 37500 points for WON streak prediction #" + streak.getId()
);
```

Use one complete scheduler test class containing both the winning and withdrawn scenarios:

```java
package com.example.horseracingtournamentsystem.prediction.scheduler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.point.entity.PointTransaction;
import com.example.horseracingtournamentsystem.point.entity.PointTransactionType;
import com.example.horseracingtournamentsystem.point.service.PointAccountService;
import com.example.horseracingtournamentsystem.point.service.PointSettingsService;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg;
import com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionLegRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.user.entity.User;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PredictionSettlementSchedulerTest {

    @Mock private PredictionSettlementJobRepository jobRepository;
    @Mock private RacePredictionRepository predictionRepository;
    @Mock private RaceResultRepository resultRepository;
    @Mock private PointAccountService pointsService;
    @Mock private PointSettingsService pointSettingsService;
    @Mock private StreakPredictionRepository streakRepository;
    @Mock private StreakPredictionLegRepository streakLegRepository;

    private PredictionSettlementScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new PredictionSettlementScheduler(
                jobRepository, predictionRepository, resultRepository,
                pointsService, pointSettingsService, streakRepository, streakLegRepository);
    }

    @Test
    void winningStreakCreditsWagerTimesAdditiveOddsOnlyOnce() {
        Fixture fixture = fixture(ResultFinishStatus.FINISHED, 1);

        scheduler.processJob(9L);
        scheduler.processJob(9L);

        assertEquals(StreakPredictionStatus.WON, fixture.streak().getStatus());
        assertEquals(new BigDecimal("3.75"), fixture.streak().getTotalOdds());
        assertEquals(37_500, fixture.streak().getRewardPoints());
        verify(pointsService, times(1)).adjustPoints(
                eq(fixture.spectator()), eq(37_500),
                eq(PointTransactionType.PREDICTION_REWARD),
                eq(PointTransaction.REF_STREAK_PREDICTION),
                eq(51L), anyString());
    }

    @Test
    void withdrawnLegContributesZeroToAdditiveOdds() {
        Fixture fixture = fixture(ResultFinishStatus.WITHDRAWN, null);

        scheduler.processJob(9L);

        assertEquals(StreakPredictionStatus.REFUNDED, fixture.currentLeg().getStatus());
        assertEquals(BigDecimal.ZERO, fixture.currentLeg().getLockedOdds());
        assertEquals(new BigDecimal("1.50"), fixture.streak().getTotalOdds());
        assertEquals(15_000, fixture.streak().getRewardPoints());
        verify(pointsService).adjustPoints(
                eq(fixture.spectator()), eq(15_000),
                eq(PointTransactionType.PREDICTION_REWARD),
                eq(PointTransaction.REF_STREAK_PREDICTION),
                eq(51L), anyString());
    }

    private Fixture fixture(ResultFinishStatus finishStatus, Integer position) {
        User spectator = mock(User.class);
        Tournament tournament = mock(Tournament.class);
        Race previousRace = mock(Race.class);
        Race currentRace = mock(Race.class);
        RaceParticipant previousWinner = participant(1001L);
        RaceParticipant currentWinner = participant(1002L);

        when(currentRace.getId()).thenReturn(202L);

        StreakPrediction streak = StreakPrediction.builder()
                .id(51L)
                .spectator(spectator)
                .tournament(tournament)
                .wagerAmount(10_000)
                .totalOdds(new BigDecimal("3.75"))
                .status(StreakPredictionStatus.PENDING)
                .build();
        StreakPredictionLeg previousLeg = StreakPredictionLeg.builder()
                .id(61L).race(previousRace).predictedWinner(previousWinner)
                .lockedOdds(new BigDecimal("1.50"))
                .status(StreakPredictionStatus.WON).build();
        StreakPredictionLeg currentLeg = StreakPredictionLeg.builder()
                .id(62L).race(currentRace).predictedWinner(currentWinner)
                .lockedOdds(new BigDecimal("2.25"))
                .status(StreakPredictionStatus.PENDING).build();
        streak.addLeg(previousLeg);
        streak.addLeg(currentLeg);

        PredictionSettlementJob job = PredictionSettlementJob.create(currentRace);
        RaceResult result = mock(RaceResult.class);
        when(result.getParticipantId()).thenReturn(1002L);
        when(result.getPosition()).thenReturn(position);
        when(result.getResultStatus()).thenReturn(finishStatus);

        when(jobRepository.findById(9L)).thenReturn(Optional.of(job));
        when(resultRepository.findByRace_Id(202L)).thenReturn(List.of(result));
        when(predictionRepository.findByRace_Id(202L)).thenReturn(List.of());
        when(streakLegRepository.findByRace_Id(202L)).thenReturn(List.of(currentLeg));

        return new Fixture(streak, currentLeg, spectator);
    }

    private RaceParticipant participant(Long id) {
        RaceParticipant participant = mock(RaceParticipant.class);
        when(participant.getId()).thenReturn(id);
        return participant;
    }

    private record Fixture(
            StreakPrediction streak,
            StreakPredictionLeg currentLeg,
            User spectator
    ) {}
}
```


- [x] **Step 2: Write the failing refunded-leg test**

Build a streak with a won leg at `1.50` and a pending leg at `2.25` whose race result status is `WITHDRAWN`. Assert the withdrawn leg is `REFUNDED`, its locked odds become `0`, final total odds remain `1.50`, and payout is `15,000`.

- [x] **Step 3: Verify the refunded-leg test fails for the expected reason**

Run:

```powershell
cd backend
.\mvnw.cmd -Dtest=PredictionSettlementSchedulerTest test
```

Expected before the minimal fix: FAIL because settlement sets refunded odds to `1` and additive settlement incorrectly adds that value.

- [x] **Step 4: Apply the minimal settlement fix**

Use additive identity zero for refunded legs and retain streak-specific payout references:

```java
if (ResultFinishStatus.WITHDRAWN.equals(participantStatuses.get(winnerId))) {
    leg.setStatus(StreakPredictionStatus.REFUNDED);
    leg.setLockedOdds(BigDecimal.ZERO);
}
```

```java
BigDecimal currentTotalOdds = BigDecimal.ZERO;
currentTotalOdds = currentTotalOdds.add(l.getLockedOdds());
```

```java
pointsService.adjustPoints(
        streak.getSpectator(),
        reward,
        PointTransactionType.PREDICTION_REWARD,
        PointTransaction.REF_STREAK_PREDICTION,
        streak.getId(),
        "Awarded " + reward + " points for WON streak prediction #" + streak.getId()
);
```

- [x] **Step 5: Add retry-safety assertion**

Invoke settlement a second time with the same already-resolved legs and verify the reward adjustment remains exactly one invocation:

```java
verify(pointsService, times(1)).adjustPoints(
        eq(spectator),
        eq(expectedReward),
        eq(PointTransactionType.PREDICTION_REWARD),
        eq(PointTransaction.REF_STREAK_PREDICTION),
        eq(streak.getId()),
        anyString()
);
```

- [x] **Step 6: Re-run scheduler tests**

Expected: PASS with zero failures.

### Task 3: Verify the complete accounting slice

**Files:**
- Verify: all files listed above

- [x] **Step 1: Run all prediction tests**

```powershell
cd backend
.\mvnw.cmd -Dtest="OddsCalculationServiceTest,RacePredictionTest,SpectatorPredictionDtoIntegrationTest,StreakPredictionServiceTest,StreakPointAccountingIntegrationTest,PredictionSettlementSchedulerTest" test
```

Expected: all prediction tests pass.

- [x] **Step 2: Run backend compilation and full tests**

```powershell
cd backend
.\mvnw.cmd test
```

Expected accounting result: new streak tests pass. Record the existing unrelated `RaceIntegrationTest` baseline failures separately if they remain.

- [x] **Step 3: Run frontend prediction tests and build**

```powershell
cd frontend
npm test -- --run src/pages/spectator/predictions
npm run build
```

Expected: prediction tests and TypeScript/Vite build pass; the streak slip displays additive odds.

- [x] **Step 4: Inspect the final diff**

```powershell
git diff --check
git diff -- backend/src/main/java/com/example/horseracingtournamentsystem/point/entity/PointTransaction.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/StreakPredictionService.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementScheduler.java backend/src/test/java/com/example/horseracingtournamentsystem/prediction
```

Confirm there are no whitespace errors, no accidental multiplication of streak odds, and no edits to unrelated user-owned changes.

- [x] **Step 5: Perform inline code review**

Review the focused diff against the approved design, fix all critical or important findings, and rerun the relevant verification commands before reporting completion.
