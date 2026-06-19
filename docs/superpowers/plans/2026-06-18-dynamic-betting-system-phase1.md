# Dynamic Betting System: Core AMM Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the foundational AMM Virtual Liquidity odds calculation algorithm and update the prediction entities to support variable wagers instead of fixed entry costs.

**Architecture:** We will create an `OddsCalculationService` containing the pure math for the AMM algorithm. We will update `RacePrediction` to hold a `wagerAmount` (Integer) and `lockedOdds` (BigDecimal). We will update `PredictionService` to use the AMM engine to calculate live odds when saving a prediction.

**Tech Stack:** Java, Spring Boot, JUnit 5

---

### Task 1: Update Entities and DTOs for Variable Wagers

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/entity/RacePrediction.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/request/SubmitPredictionRequest.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/entity/RacePredictionTest.java`

- [ ] **Step 1: Write the failing test**

```java
package com.example.horseracingtournamentsystem.prediction.entity;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

class RacePredictionTest {
    @Test
    void testVariableWagerAndLockedOdds() {
        RacePrediction prediction = new RacePrediction();
        prediction.setWagerAmount(50000);
        prediction.setLockedOdds(new BigDecimal("1.85"));
        
        assertEquals(50000, prediction.getWagerAmount());
        assertEquals(new BigDecimal("1.85"), prediction.getLockedOdds());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=RacePredictionTest`
Expected: FAIL due to missing getter/setters for wagerAmount and lockedOdds.

- [ ] **Step 3: Write minimal implementation**

Modify `RacePrediction.java`:
```java
// Add to RacePrediction.java fields:
@Column(name = "wager_amount")
private Integer wagerAmount;

@Column(name = "locked_odds", precision = 10, scale = 2)
private BigDecimal lockedOdds;

// Add getters and setters for wagerAmount and lockedOdds
public Integer getWagerAmount() { return wagerAmount; }
public void setWagerAmount(Integer wagerAmount) { this wagerAmount = wagerAmount; }

public BigDecimal getLockedOdds() { return lockedOdds; }
public void setLockedOdds(BigDecimal lockedOdds) { this lockedOdds = lockedOdds; }
```

Modify `SubmitPredictionRequest.java`:
```java
// Add to SubmitPredictionRequest.java:
@NotNull(message = "Wager amount is required")
@Min(value = 10000, message = "Minimum wager is 10000 points")
private Integer wagerAmount;

// Add getter and setter
public Integer getWagerAmount() { return wagerAmount; }
public void setWagerAmount(Integer wagerAmount) { this wagerAmount = wagerAmount; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=RacePredictionTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/example/horseracingtournamentsystem/prediction/entity/RacePrediction.java backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/request/SubmitPredictionRequest.java backend/src/test/java/com/example/horseracingtournamentsystem/prediction/entity/RacePredictionTest.java
git commit -m "feat: add variable wager and locked odds to prediction entity"
```

### Task 2: Implement AMM Odds Calculation Service

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/OddsCalculationService.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/OddsCalculationServiceTest.java`

- [ ] **Step 1: Write the failing test**

```java
package com.example.horseracingtournamentsystem.prediction.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

class OddsCalculationServiceTest {
    
    private final OddsCalculationService service = new OddsCalculationService();

    @Test
    void testCalculateOdds() {
        // vPool = 10000, R = 0.85
        // horse initial probability P = 0.5 -> vHorse = 5000
        // No real bets yet
        BigDecimal odds = service.calculateOdds(10000, 0, 0.85, 5000, 0);
        // Formula: (10000 + 0) * 0.85 / (5000 + 0) = 8500 / 5000 = 1.70
        assertEquals(new BigDecimal("1.70"), odds);

        // With real bets: Total real bets = 1000. Real bets on this horse = 1000
        BigDecimal oddsAfterBet = service.calculateOdds(10000, 1000, 0.85, 5000, 1000);
        // Formula: (10000 + 1000) * 0.85 / (5000 + 1000) = 9350 / 6000 = 1.5583 -> 1.56
        assertEquals(new BigDecimal("1.56"), oddsAfterBet);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=OddsCalculationServiceTest`
Expected: FAIL due to class not found.

- [ ] **Step 3: Write minimal implementation**

Create `OddsCalculationService.java`:
```java
package com.example.horseracingtournamentsystem.prediction.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class OddsCalculationService {

    public BigDecimal calculateOdds(double vPool, double totalRealBets, double rMargin, double vHorse, double realBetsOnHorse) {
        double numerator = (vPool + totalRealBets) * rMargin;
        double denominator = vHorse + realBetsOnHorse;
        if (denominator == 0) return BigDecimal.ZERO;
        
        double rawOdds = numerator / denominator;
        return BigDecimal.valueOf(rawOdds).setScale(2, RoundingMode.HALF_UP);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=OddsCalculationServiceTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/OddsCalculationService.java backend/src/test/java/com/example/horseracingtournamentsystem/prediction/service/OddsCalculationServiceTest.java
git commit -m "feat: implement AMM virtual liquidity odds calculation logic"
```
