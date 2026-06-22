# Dynamic Betting System: Phase 2 (Settlement & Real-time Odds Calculation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `PredictionService` to calculate and lock real-time odds at the moment of betting, update `PredictionSettlementScheduler` to distribute dynamic payouts based on `wagerAmount * lockedOdds`, and auto-calculate base win probabilities from leaderboard statistics.

**Architecture:**
- `RaceParticipant` will gain a `baseWinProbability` field.
- A new automated mechanism will inject probability based on the horse's historical win rate (Wins / Total Races) from the Leaderboard.
- `PredictionService` will fetch the current betting pool (all pending/locked predictions for the race) to calculate dynamic odds via `OddsCalculationService` before saving the prediction.
- `PredictionSettlementScheduler` will use `BigDecimal` math to calculate dynamic rewards.

**Tech Stack:** Java, Spring Boot, JUnit 5

---

### Task 1: Add Base Win Probability to RaceParticipant

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/entity/RaceParticipant.java`
- Create: `backend/src/main/resources/db/migration/V2__add_dynamic_odds.sql`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java`

- [ ] **Step 1: Write SQL Migration**
```sql
ALTER TABLE race_participants ADD COLUMN base_win_probability DECIMAL(5,4) DEFAULT 0.1000;
```

- [ ] **Step 2: Update Entity**
Add `baseWinProbability` to `RaceParticipant`.

- [ ] **Step 3: Update RaceService (Auto-Calculate Logic)**
When adding participants to a race, fetch the horse's historical stats (total wins / total races). If it's a new horse, assign a default 5% probability. Normalize all probabilities in the race to sum to 100%.

- [ ] **Step 4: Commit**

### Task 2: Refactor PredictionService for Dynamic Odds

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionService.java`

- [ ] **Step 1: Write Implementation**
Update `submitPrediction`:
- Remove fetching fixed entry cost from `PointSettingsService`.
- Use `request.getWagerAmount()` as the cost.
- Query total pool and horse pool from `RacePredictionRepository`.
- Call `oddsCalculationService.calculateOdds(...)` using the `baseWinProbability` of the horse.
- Save prediction with `lockedOdds` and `wagerAmount`.
- Deduct points.

- [ ] **Step 2: Commit**

### Task 3: Refactor PredictionSettlementScheduler for Dynamic Payouts

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementScheduler.java`

- [ ] **Step 1: Write Implementation**
Update `processJob`:
- If correct prediction, calculate `reward = wagerAmount * lockedOdds`.
- Remove fixed reward fetching from `PointSettingsService`.
- Award points and update prediction status.

- [ ] **Step 2: Commit**
