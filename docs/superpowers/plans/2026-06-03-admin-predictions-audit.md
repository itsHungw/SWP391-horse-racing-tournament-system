# Admin Predictions Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Predictions and Points backend entities, service logic, background settlement scheduler with concurrency/idempotency guards, and the complete Race-based Admin Predictions Workspace frontend.

**Architecture:** Use Spring Boot backend logic with Spring Data JPA for persistence. The background settlement scheduler runs periodically to atomically claim and process PENDING jobs using transactional Outbox pattern. The admin dashboard manages predictions grouped by Race, drilling down to detail metrics (Winner Correct, Exact Top 3, Top 3 Any Order, Incorrect) and user audit lists.

**Tech Stack:** Java, Spring Boot, Hibernate, Microsoft SQL Server, React, TypeScript, Tailwind CSS, Vite.

---

## Component Layout

### Database Migrations
*   Modify `backend/src/main/resources/schema.sql` to define point accounts, transactions, predictions, and jobs.

### Backend - Points Module
*   `points/entity/UserPointAccount.java`
*   `points/entity/PointTransaction.java`
*   `points/repository/UserPointAccountRepository.java`
*   `points/repository/PointTransactionRepository.java`
*   `points/service/PointsService.java` (and `PointsServiceImpl.java`)

### Backend - Predictions Module
*   `prediction/entity/RacePrediction.java`
*   `prediction/entity/PredictionSettlementJob.java`
*   `prediction/repository/RacePredictionRepository.java`
*   `prediction/repository/PredictionSettlementJobRepository.java`
*   `prediction/service/PredictionService.java` (and `PredictionServiceImpl.java`)
*   `prediction/scheduler/PredictionSettlementScheduler.java`
*   `prediction/dto/request/SubmitPredictionRequest.java`
*   `prediction/dto/response/PredictionOptionsResponse.java`
*   `prediction/dto/response/AdminRaceSummaryResponse.java`
*   `prediction/dto/response/AdminRaceDetailResponse.java`
*   `prediction/dto/response/AdminAuditPredictionResponse.java`
*   `prediction/controller/SpectatorPredictionController.java`
*   `prediction/controller/AdminPredictionController.java`

### Frontend - Admin Predictions Workspace
*   `frontend/src/pages/admin/AdminPredictionsWorkspace.tsx`
*   `frontend/src/pages/admin/AdminRacePredictionDetailPage.tsx`
*   `frontend/src/routes/AppRouter.tsx` (Route integration)

---

## Tasks

### Task 1: Database Schema Migration
Ensure all tables and constraints are registered in SQL Server schema initialization.

**Files:**
*   Modify: [schema.sql](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/resources/schema.sql)

- [ ] **Step 1: Append predictions and points tables to `schema.sql`**
    Add the following SQL statements to the end of [schema.sql](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/resources/schema.sql):
    ```sql
    IF OBJECT_ID(N'dbo.user_point_accounts', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_point_accounts (
            user_id BIGINT NOT NULL,
            point_balance INT NOT NULL DEFAULT 0,
            updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
            CONSTRAINT pk_user_point_accounts PRIMARY KEY (user_id),
            CONSTRAINT fk_upa_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
            CONSTRAINT chk_upa_balance CHECK (point_balance >= 0)
        )
    END;

    IF OBJECT_ID(N'dbo.point_transactions', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.point_transactions (
            id BIGINT IDENTITY(1,1) NOT NULL,
            user_id BIGINT NOT NULL,
            amount INT NOT NULL,
            transaction_type VARCHAR(50) NOT NULL,
            reference_type VARCHAR(50) NULL,
            reference_id BIGINT NULL,
            description NVARCHAR(500) NULL,
            created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
            CONSTRAINT pk_point_transactions PRIMARY KEY (id),
            CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
            CONSTRAINT chk_pt_transaction_type CHECK (
                transaction_type IN ('PREDICTION_ENTRY', 'PREDICTION_REWARD', 'BLOG_REWARD', 'RACE_CANCEL_REFUND', 'ADMIN_ADJUSTMENT')
            ),
            CONSTRAINT chk_pt_reference_type CHECK (
                reference_type IS NULL OR reference_type IN ('RACE_PREDICTION', 'RACE_RESULT', 'BLOG', 'ADMIN', 'RACE')
            )
        )
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = N'uq_point_tx_idempotency' 
          AND object_id = OBJECT_ID(N'dbo.point_transactions')
    )
    BEGIN
        CREATE UNIQUE INDEX uq_point_tx_idempotency 
        ON dbo.point_transactions(reference_type, reference_id, transaction_type)
        WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
    END;

    IF OBJECT_ID(N'dbo.race_predictions', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.race_predictions (
            id BIGINT IDENTITY(1,1) NOT NULL,
            race_id BIGINT NOT NULL,
            spectator_id BIGINT NOT NULL,
            prediction_type VARCHAR(30) NOT NULL DEFAULT 'WINNER',
            predicted_winner_id BIGINT NOT NULL,
            predicted_second_id BIGINT NULL,
            predicted_third_id BIGINT NULL,
            entry_cost_points INT NOT NULL,
            reward_points INT NOT NULL DEFAULT 0,
            status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
            locked_at DATETIME2 NULL,
            evaluated_at DATETIME2 NULL,
            created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
            updated_at DATETIME2 NULL,
            CONSTRAINT pk_race_predictions PRIMARY KEY (id),
            CONSTRAINT uq_race_spectator_prediction UNIQUE (race_id, spectator_id, prediction_type),
            CONSTRAINT fk_rpred_race FOREIGN KEY (race_id) REFERENCES dbo.races(id),
            CONSTRAINT fk_rpred_spectator FOREIGN KEY (spectator_id) REFERENCES dbo.users(id),
            CONSTRAINT fk_rpred_winner FOREIGN KEY (predicted_winner_id) REFERENCES dbo.race_participants(id),
            CONSTRAINT fk_rpred_second FOREIGN KEY (predicted_second_id) REFERENCES dbo.race_participants(id),
            CONSTRAINT fk_rpred_third FOREIGN KEY (predicted_third_id) REFERENCES dbo.race_participants(id),
            CONSTRAINT chk_rpred_type CHECK (prediction_type IN ('WINNER', 'TOP3')),
            CONSTRAINT chk_rpred_status CHECK (status IN ('PENDING', 'LOCKED', 'CORRECT', 'INCORRECT', 'CANCELLED', 'REFUNDED')),
            CONSTRAINT chk_rpred_top3_distinct CHECK (
                prediction_type <> 'TOP3' OR (
                    predicted_second_id IS NOT NULL 
                    AND predicted_third_id IS NOT NULL
                    AND predicted_winner_id <> predicted_second_id
                    AND predicted_winner_id <> predicted_third_id
                    AND predicted_second_id <> predicted_third_id
                )
            )
        )
    END;

    IF OBJECT_ID(N'dbo.prediction_settlement_jobs', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.prediction_settlement_jobs (
            id BIGINT IDENTITY(1,1) NOT NULL,
            race_id BIGINT NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
            processed_count INT NOT NULL DEFAULT 0,
            rewarded_count INT NOT NULL DEFAULT 0,
            failed_count INT NOT NULL DEFAULT 0,
            retry_count INT NOT NULL DEFAULT 0,
            error_message NVARCHAR(MAX) NULL,
            started_at DATETIME2 NULL,
            completed_at DATETIME2 NULL,
            created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
            updated_at DATETIME2 NULL,
            CONSTRAINT pk_prediction_settlement_jobs PRIMARY KEY (id),
            CONSTRAINT fk_psj_race FOREIGN KEY (race_id) REFERENCES dbo.races(id),
            CONSTRAINT uq_psj_race UNIQUE (race_id),
            CONSTRAINT chk_psj_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
        )
    END;
    ```

---

### Task 2: Backend Points Module Implementation
Define entities, repositories, and logic for virtual point account management and transactions.

**Files:**
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/points/entity/UserPointAccount.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/points/entity/PointTransaction.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/points/repository/UserPointAccountRepository.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/points/repository/PointTransactionRepository.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/points/service/PointsService.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/points/service/PointsServiceImpl.java`

- [ ] **Step 1: Create `UserPointAccount` Entity**
    ```java
    package com.example.horseracingtournamentsystem.points.entity;

    import com.example.horseracingtournamentsystem.user.entity.User;
    import jakarta.persistence.*;
    import java.time.LocalDateTime;
    import lombok.Getter;
    import lombok.Setter;
    import lombok.NoArgsConstructor;

    @Entity
    @Table(name = "user_point_accounts")
    @Getter @Setter @NoArgsConstructor
    public class UserPointAccount {
        @Id
        @Column(name = "user_id")
        private Long userId;

        @OneToOne(fetch = FetchType.LAZY)
        @MapsId
        @JoinColumn(name = "user_id")
        private User user;

        @Column(name = "point_balance", nullable = false)
        private Integer pointBalance = 0;

        @Column(name = "updated_at", nullable = false)
        private LocalDateTime updatedAt = LocalDateTime.now();

        public UserPointAccount(User user, int initialBalance) {
            this.user = user;
            this.userId = user.getId();
            this.pointBalance = initialBalance;
            this.updatedAt = LocalDateTime.now();
        }
    }
    ```
- [ ] **Step 2: Create `PointTransaction` Entity**
    ```java
    package com.example.horseracingtournamentsystem.points.entity;

    import com.example.horseracingtournamentsystem.user.entity.User;
    import jakarta.persistence.*;
    import java.time.LocalDateTime;
    import lombok.Getter;
    import lombok.Setter;
    import lombok.NoArgsConstructor;

    @Entity
    @Table(name = "point_transactions")
    @Getter @Setter @NoArgsConstructor
    public class PointTransaction {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private User user;

        @Column(name = "amount", nullable = false)
        private Integer amount;

        @Column(name = "transaction_type", nullable = false)
        private String transactionType;

        @Column(name = "reference_type")
        private String referenceType;

        @Column(name = "reference_id")
        private Long referenceId;

        @Column(name = "description")
        private String description;

        @Column(name = "created_at", nullable = false)
        private LocalDateTime createdAt = LocalDateTime.now();
    }
    ```
- [ ] **Step 3: Create JPA Repositories**
    ```java
    package com.example.horseracingtournamentsystem.points.repository;
    import com.example.horseracingtournamentsystem.points.entity.UserPointAccount;
    import org.springframework.data.jpa.repository.JpaRepository;
    public interface UserPointAccountRepository extends JpaRepository<UserPointAccount, Long> {}
    ```
    ```java
    package com.example.horseracingtournamentsystem.points.repository;
    import com.example.horseracingtournamentsystem.points.entity.PointTransaction;
    import org.springframework.data.jpa.repository.JpaRepository;
    public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
        boolean existsByReferenceTypeAndReferenceIdAndTransactionType(
            String referenceType, Long referenceId, String transactionType
        );
    }
    ```
- [ ] **Step 4: Create Points Service Interface**
    ```java
    package com.example.horseracingtournamentsystem.points.service;
    import com.example.horseracingtournamentsystem.user.entity.User;
    public interface PointsService {
        void initializeAccount(User user, int initialPoints);
        void adjustPoints(User user, int amount, String txType, String refType, Long refId, String desc);
        int getBalance(Long userId);
        boolean isTransactionIdempotent(String refType, Long refId, String txType);
    }
    ```
- [ ] **Step 5: Create Points Service Implementation**
    Ensure duplicate check evaluates `uq_point_tx_idempotency` constraints.
    ```java
    package com.example.horseracingtournamentsystem.points.service;

    import com.example.horseracingtournamentsystem.points.entity.UserPointAccount;
    import com.example.horseracingtournamentsystem.points.entity.PointTransaction;
    import com.example.horseracingtournamentsystem.points.repository.UserPointAccountRepository;
    import com.example.horseracingtournamentsystem.points.repository.PointTransactionRepository;
    import com.example.horseracingtournamentsystem.user.entity.User;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;
    import java.time.LocalDateTime;

    @Service
    public class PointsServiceImpl implements PointsService {
        private final UserPointAccountRepository accountRepo;
        private final PointTransactionRepository transactionRepo;

        public PointsServiceImpl(UserPointAccountRepository accountRepo, PointTransactionRepository transactionRepo) {
            this.accountRepo = accountRepo;
            this.transactionRepo = transactionRepo;
        }

        @Override
        @Transactional
        public void initializeAccount(User user, int initialPoints) {
            if (!accountRepo.existsById(user.getId())) {
                UserPointAccount account = new UserPointAccount(user, initialPoints);
                accountRepo.save(account);
            }
        }

        @Override
        @Transactional
        public void adjustPoints(User user, int amount, String txType, String refType, Long refId, String desc) {
            if (refType != null && refId != null && transactionRepo.existsByReferenceTypeAndReferenceIdAndTransactionType(refType, refId, txType)) {
                return; // Duplicate transaction prevention (Idempotency)
            }

            UserPointAccount account = accountRepo.findById(user.getId())
                .orElseGet(() -> accountRepo.save(new UserPointAccount(user, 0)));

            int newBalance = account.getPointBalance() + amount;
            if (newBalance < 0) {
                throw new IllegalArgumentException("Insufficient virtual points balance");
            }
            account.setPointBalance(newBalance);
            account.setUpdatedAt(LocalDateTime.now());
            accountRepo.save(account);

            PointTransaction tx = new PointTransaction();
            tx.setUser(user);
            tx.setAmount(amount);
            tx.setTransactionType(txType);
            tx.setReferenceType(refType);
            tx.setReferenceId(refId);
            tx.setDescription(desc);
            tx.setCreatedAt(LocalDateTime.now());
            transactionRepo.save(tx);
        }

        @Override
        public int getBalance(Long userId) {
            return accountRepo.findById(userId)
                .map(UserPointAccount::getPointBalance)
                .orElse(0);
        }

        @Override
        public boolean isTransactionIdempotent(String refType, Long refId, String txType) {
            return transactionRepo.existsByReferenceTypeAndReferenceIdAndTransactionType(refType, refId, txType);
        }
    }
    ```

---

### Task 3: Backend Predictions Module Entities & Repositories
Define JPA entities and repositories for predictions, results, and Outbox tasks.

**Files:**
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/entity/RacePrediction.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/entity/PredictionSettlementJob.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/repository/RacePredictionRepository.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/repository/PredictionSettlementJobRepository.java`

- [ ] **Step 1: Create `RacePrediction` Entity**
    ```java
    package com.example.horseracingtournamentsystem.prediction.entity;

    import com.example.horseracingtournamentsystem.race.entity.Race;
    import com.example.horseracingtournamentsystem.user.entity.User;
    import jakarta.persistence.*;
    import java.time.LocalDateTime;
    import lombok.Getter;
    import lombok.Setter;
    import lombok.NoArgsConstructor;

    @Entity
    @Table(name = "race_predictions")
    @Getter @Setter @NoArgsConstructor
    public class RacePrediction {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "race_id", nullable = false)
        private Race race;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "spectator_id", nullable = false)
        private User spectator;

        @Column(name = "prediction_type", nullable = false)
        private String predictionType;

        @Column(name = "predicted_winner_id", nullable = false)
        private Long predictedWinnerId;

        @Column(name = "predicted_second_id")
        private Long predictedSecondId;

        @Column(name = "predicted_third_id")
        private Long predictedThirdId;

        @Column(name = "entry_cost_points", nullable = false)
        private Integer entryCostPoints;

        @Column(name = "reward_points", nullable = false)
        private Integer rewardPoints = 0;

        @Column(name = "status", nullable = false)
        private String status = "PENDING"; // PENDING / LOCKED / CORRECT / INCORRECT / CANCELLED / REFUNDED

        @Column(name = "locked_at")
        private LocalDateTime lockedAt;

        @Column(name = "evaluated_at")
        private LocalDateTime evaluatedAt;

        @Column(name = "created_at", nullable = false)
        private LocalDateTime createdAt = LocalDateTime.now();

        @Column(name = "updated_at")
        private LocalDateTime updatedAt;
    }
    ```
- [ ] **Step 2: Create `PredictionSettlementJob` Entity**
    ```java
    package com.example.horseracingtournamentsystem.prediction.entity;

    import com.example.horseracingtournamentsystem.race.entity.Race;
    import jakarta.persistence.*;
    import java.time.LocalDateTime;
    import lombok.Getter;
    import lombok.Setter;
    import lombok.NoArgsConstructor;

    @Entity
    @Table(name = "prediction_settlement_jobs")
    @Getter @Setter @NoArgsConstructor
    public class PredictionSettlementJob {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @OneToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "race_id", nullable = false)
        private Race race;

        @Column(name = "status", nullable = false)
        private String status = "PENDING";

        @Column(name = "processed_count", nullable = false)
        private Integer processedCount = 0;

        @Column(name = "rewarded_count", nullable = false)
        private Integer rewardedCount = 0;

        @Column(name = "failed_count", nullable = false)
        private Integer failedCount = 0;

        @Column(name = "retry_count", nullable = false)
        private Integer retryCount = 0;

        @Column(name = "error_message")
        private String errorMessage;

        @Column(name = "started_at")
        private LocalDateTime startedAt;

        @Column(name = "completed_at")
        private LocalDateTime completedAt;

        @Column(name = "created_at", nullable = false)
        private LocalDateTime createdAt = LocalDateTime.now();

        @Column(name = "updated_at")
        private LocalDateTime updatedAt;
    }
    ```
- [ ] **Step 3: Create JPA Repositories**
    ```java
    package com.example.horseracingtournamentsystem.prediction.repository;

    import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
    import org.springframework.data.jpa.repository.JpaRepository;
    import java.util.List;

    public interface RacePredictionRepository extends JpaRepository<RacePrediction, Long> {
        List<RacePrediction> findByRaceId(Long raceId);
        List<RacePrediction> findByRaceIdAndStatus(Long raceId, String status);
        List<RacePrediction> findBySpectatorId(Long spectatorId);
        boolean existsByRaceIdAndSpectatorIdAndPredictionType(Long raceId, Long spectatorId, String predictionType);
        long countByRaceId(Long raceId);
        long countByRaceIdAndStatus(Long raceId, String status);
        long countByStatus(String status);
        long countByStatusAndRaceId(String status, Long raceId);
    }
    ```
    ```java
    package com.example.horseracingtournamentsystem.prediction.repository;

    import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.data.jpa.repository.Modifying;
    import org.springframework.data.jpa.repository.Query;
    import org.springframework.data.repository.query.Param;
    import java.util.List;
    import java.util.Optional;

    public interface PredictionSettlementJobRepository extends JpaRepository<PredictionSettlementJob, Long> {
        List<PredictionSettlementJob> findByStatus(String status);
        Optional<PredictionSettlementJob> findByRaceId(Long raceId);
        long countByStatus(String status);

        @Modifying
        @Query("UPDATE PredictionSettlementJob j SET j.status = 'PROCESSING', j.startedAt = CURRENT_TIMESTAMP, j.retryCount = j.retryCount + 1 WHERE j.id = :id AND j.status = 'PENDING'")
        int claimJobAtomic(@Param("id") Long id);
    }
    ```

---

### Task 4: Backend Predictions Service Implementations
Implement transactional submission constraints, state transitions, and Outbox tasks.

**Files:**
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionService.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionServiceImpl.java`

- [ ] **Step 1: Create `PredictionService` Interface**
    ```java
    package com.example.horseracingtournamentsystem.prediction.service;

    import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
    import com.example.horseracingtournamentsystem.user.entity.User;
    import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitPredictionRequest;
    import java.util.List;

    public interface PredictionService {
        RacePrediction submitPrediction(User spectator, SubmitPredictionRequest request);
        RacePrediction updatePrediction(User spectator, Long predictionId, SubmitPredictionRequest request);
        void lockPredictionsForRace(Long raceId);
        void refundCancelledRace(Long raceId);
        void createSettlementJob(Long raceId);
        List<RacePrediction> getMyPredictions(User spectator);
    }
    ```
- [ ] **Step 2: Create Service Implementation**
    Implement submission rules (only when status is `SCHEDULED`, refund validations check index entries, lock rules override updates).
    ```java
    package com.example.horseracingtournamentsystem.prediction.service;

    import com.example.horseracingtournamentsystem.points.service.PointsService;
    import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
    import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
    import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitPredictionRequest;
    import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
    import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
    import com.example.horseracingtournamentsystem.race.entity.Race;
    import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
    import com.example.horseracingtournamentsystem.user.entity.User;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;
    import java.time.LocalDateTime;
    import java.util.List;

    @Service
    public class PredictionServiceImpl implements PredictionService {
        private final RacePredictionRepository predictionRepo;
        private final PredictionSettlementJobRepository jobRepo;
        private final RaceRepository raceRepo;
        private final PointsService pointsService;

        public PredictionServiceImpl(RacePredictionRepository predictionRepo,
                                     PredictionSettlementJobRepository jobRepo,
                                     RaceRepository raceRepo,
                                     PointsService pointsService) {
            this.predictionRepo = predictionRepo;
            this.jobRepo = jobRepo;
            this.raceRepo = raceRepo;
            this.pointsService = pointsService;
        }

        @Override
        @Transactional
        public RacePrediction submitPrediction(User spectator, SubmitPredictionRequest request) {
            Race race = raceRepo.findById(request.getRaceId())
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

            if (!"SCHEDULED".equals(race.getStatus())) {
                throw new IllegalStateException("Predictions can only be made when the race is SCHEDULED");
            }

            if (predictionRepo.existsByRaceIdAndSpectatorIdAndPredictionType(race.getId(), spectator.getId(), request.getPredictionType())) {
                throw new IllegalStateException("Duplicate predictions of the same type for this race are not allowed");
            }

            int cost = "WINNER".equals(request.getPredictionType()) ? 5 : 10;

            // Debit user balance inside the same transaction
            pointsService.adjustPoints(
                spectator, -cost, "PREDICTION_ENTRY", "RACE_PREDICTION", null, 
                "Deducted " + cost + " virtual points for race prediction entry"
            );

            RacePrediction prediction = new RacePrediction();
            prediction.setRace(race);
            prediction.setSpectator(spectator);
            prediction.setPredictionType(request.getPredictionType());
            prediction.setPredictedWinnerId(request.getPredictedWinnerId());
            prediction.setPredictedSecondId(request.getPredictedSecondId());
            prediction.setPredictedThirdId(request.getPredictedThirdId());
            prediction.setEntryCostPoints(cost);
            prediction.setRewardPoints(0);
            prediction.setStatus("PENDING");
            prediction.setCreatedAt(LocalDateTime.now());

            return predictionRepo.save(prediction);
        }

        @Override
        @Transactional
        public RacePrediction updatePrediction(User spectator, Long predictionId, SubmitPredictionRequest request) {
            RacePrediction prediction = predictionRepo.findById(predictionId)
                .orElseThrow(() -> new IllegalArgumentException("Prediction not found"));

            if (!prediction.getSpectator().getId().equals(spectator.getId())) {
                throw new IllegalArgumentException("Unauthorized to modify this prediction");
            }

            if (!"PENDING".equals(prediction.getStatus())) {
                throw new IllegalStateException("Only pending predictions can be updated");
            }

            Race race = prediction.getRace();
            if (!"SCHEDULED".equals(race.getStatus())) {
                throw new IllegalStateException("Predictions are locked since race is no longer in SCHEDULED state");
            }

            if (!prediction.getPredictionType().equals(request.getPredictionType())) {
                throw new IllegalArgumentException("Cannot change prediction type");
            }

            prediction.setPredictedWinnerId(request.getPredictedWinnerId());
            prediction.setPredictedSecondId(request.getPredictedSecondId());
            prediction.setPredictedThirdId(request.getPredictedThirdId());
            prediction.setUpdatedAt(LocalDateTime.now());

            return predictionRepo.save(prediction);
        }

        @Override
        @Transactional
        public void lockPredictionsForRace(Long raceId) {
            List<RacePrediction> pendingPredictions = predictionRepo.findByRaceIdAndStatus(raceId, "PENDING");
            for (RacePrediction p : pendingPredictions) {
                p.setStatus("LOCKED");
                p.setLockedAt(LocalDateTime.now());
                predictionRepo.save(p);
            }
        }

        @Override
        @Transactional
        public void refundCancelledRace(Long raceId) {
            List<RacePrediction> predictions = predictionRepo.findByRaceId(raceId);
            for (RacePrediction p : predictions) {
                if ("PENDING".equals(p.getStatus()) || "LOCKED".equals(p.getStatus())) {
                    p.setStatus("REFUNDED");
                    p.setUpdatedAt(LocalDateTime.now());
                    predictionRepo.save(p);

                    // Refund entry cost points using idempotency guards
                    pointsService.adjustPoints(
                        p.getSpectator(), p.getEntryCostPoints(), "RACE_CANCEL_REFUND", 
                        "RACE_PREDICTION", p.getId(), "Refunded entry cost points for cancelled race"
                    );
                }
            }
        }

        @Override
        @Transactional
        public void createSettlementJob(Long raceId) {
            Race race = raceRepo.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

            if (jobRepo.findByRaceId(raceId).isEmpty()) {
                PredictionSettlementJob job = new PredictionSettlementJob();
                job.setRace(race);
                job.setStatus("PENDING");
                job.setCreatedAt(LocalDateTime.now());
                jobRepo.save(job);
            }
        }

        @Override
        public List<RacePrediction> getMyPredictions(User spectator) {
            return predictionRepo.findBySpectatorId(spectator.getId());
        }
    }
    ```

---

### Task 5: Background Polling Scheduler
Create poller evaluating LOCKED predictions and posting reward entries.

**Files:**
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementScheduler.java`

- [ ] **Step 1: Create `PredictionSettlementScheduler`**
    ```java
    package com.example.horseracingtournamentsystem.prediction.scheduler;

    import com.example.horseracingtournamentsystem.points.service.PointsService;
    import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
    import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
    import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
    import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
    import com.example.horseracingtournamentsystem.result.entity.RaceResult;
    import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.scheduling.annotation.Scheduled;
    import org.springframework.stereotype.Component;
    import org.springframework.transaction.annotation.Transactional;
    import java.time.LocalDateTime;
    import java.util.List;
    import java.util.Map;
    import java.util.stream.Collectors;

    @Component
    public class PredictionSettlementScheduler {
        private static final Logger log = LoggerFactory.getLogger(PredictionSettlementScheduler.class);

        private final PredictionSettlementJobRepository jobRepo;
        private final RacePredictionRepository predictionRepo;
        private final RaceResultRepository resultRepo;
        private final PointsService pointsService;

        public PredictionSettlementScheduler(PredictionSettlementJobRepository jobRepo,
                                             RacePredictionRepository predictionRepo,
                                             RaceResultRepository resultRepo,
                                             PointsService pointsService) {
            this.jobRepo = jobRepo;
            this.predictionRepo = predictionRepo;
            this.resultRepo = resultRepo;
            this.pointsService = pointsService;
        }

        @Scheduled(fixedDelay = 5000)
        public void pollAndProcessJobs() {
            List<PredictionSettlementJob> pendingJobs = jobRepo.findByStatus("PENDING");
            for (PredictionSettlementJob job : pendingJobs) {
                int affectedRows = jobRepo.claimJobAtomic(job.getId());
                if (affectedRows == 1) {
                    processJob(job.getId());
                }
            }
        }

        @Transactional
        public void processJob(Long jobId) {
            PredictionSettlementJob job = jobRepo.findById(jobId).orElse(null);
            if (job == null) return;

            log.info("Processing prediction settlement job #{} for raceId={}", job.getId(), job.getRace().getId());
            try {
                List<RaceResult> results = resultRepo.findByRaceId(job.getRace().getId());
                Map<Long, Integer> participantPositions = results.stream()
                    .collect(Collectors.toMap(r -> r.getParticipant().getId(), RaceResult::getPosition));

                List<RacePrediction> predictions = predictionRepo.findByRaceId(job.getRace().getId());

                int processedCount = 0;
                int rewardedCount = 0;
                int failedCount = 0;

                List<Long> actualTop3 = results.stream()
                    .filter(r -> r.getPosition() != null && r.getPosition() <= 3)
                    .sorted((r1, r2) -> Integer.compare(r1.getPosition(), r2.getPosition()))
                    .map(r -> r.getParticipant().getId())
                    .collect(Collectors.toList());

                for (RacePrediction p : predictions) {
                    if ("PENDING".equals(p.getStatus()) || "LOCKED".equals(p.getStatus())) {
                        processedCount++;
                        try {
                            boolean isCorrect = false;
                            int reward = 0;

                            if ("WINNER".equals(p.getPredictionType())) {
                                Integer pos = participantPositions.get(p.getPredictedWinnerId());
                                if (pos != null && pos == 1) {
                                    isCorrect = true;
                                    reward = 10;
                                }
                            } else if ("TOP3".equals(p.getPredictionType())) {
                                if (actualTop3.size() >= 3) {
                                    Long actual1 = actualTop3.get(0);
                                    Long actual2 = actualTop3.get(1);
                                    Long actual3 = actualTop3.get(2);

                                    if (p.getPredictedWinnerId().equals(actual1) &&
                                        p.getPredictedSecondId().equals(actual2) &&
                                        p.getPredictedThirdId().equals(actual3)) {
                                        isCorrect = true;
                                        reward = 30; // Exact order
                                    } else {
                                        boolean hasWinner = actualTop3.contains(p.getPredictedWinnerId());
                                        boolean hasSecond = actualTop3.contains(p.getPredictedSecondId());
                                        boolean hasThird = actualTop3.contains(p.getPredictedThirdId());
                                        if (hasWinner && hasSecond && hasThird) {
                                            isCorrect = true;
                                            reward = 15; // Correct horses, wrong order
                                        }
                                    }
                                }
                            }

                            if (isCorrect) {
                                p.setStatus("CORRECT");
                                p.setRewardPoints(reward);
                                pointsService.adjustPoints(
                                    p.getSpectator(), reward, "PREDICTION_REWARD", 
                                    "RACE_PREDICTION", p.getId(), "Awarded reward points for correct prediction"
                                );
                                rewardedCount++;
                            } else {
                                p.setStatus("INCORRECT");
                                p.setRewardPoints(0);
                            }
                            p.setEvaluatedAt(LocalDateTime.now());
                            predictionRepo.save(p);
                        } catch (Exception ex) {
                            log.error("Failed to evaluate prediction #{}", p.getId(), ex);
                            failedCount++;
                        }
                    }
                }

                job.setProcessedCount(processedCount);
                job.setRewardedCount(rewardedCount);
                job.setFailedCount(failedCount);
                job.setStatus(failedCount > 0 ? "FAILED" : "COMPLETED");
                job.setCompletedAt(LocalDateTime.now());
                job.setErrorMessage(null);
                jobRepo.save(job);

            } catch (Exception ex) {
                log.error("Settlement Job #{} failed", jobId, ex);
                job.setStatus("FAILED");
                job.setErrorMessage(ex.getMessage());
                jobRepo.save(job);
            }
        }
    }
    ```

---

### Task 6: API Controllers & DTOs
Expose spectator APIs and refined Race-based Admin Predictions APIs.

**Files:**
*   Create DTO files in `prediction/dto/...`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java`
*   Create: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/AdminPredictionController.java`

- [ ] **Step 1: Create `AdminPredictionController`**
    Provide Race List summaries, detailed race summaries, and sub-prediction audit logs.
    ```java
    package com.example.horseracingtournamentsystem.prediction.controller;

    import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
    import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
    import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
    import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
    import com.example.horseracingtournamentsystem.race.entity.Race;
    import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
    import com.example.horseracingtournamentsystem.prediction.dto.response.AdminRaceSummaryResponse;
    import com.example.horseracingtournamentsystem.prediction.dto.response.AdminRaceDetailResponse;
    import com.example.horseracingtournamentsystem.prediction.dto.response.AdminAuditPredictionResponse;
    import org.springframework.http.ResponseEntity;
    import org.springframework.security.access.prepost.PreAuthorize;
    import org.springframework.web.bind.annotation.*;
    import java.time.LocalDateTime;
    import java.util.List;
    import java.util.stream.Collectors;

    @RestController
    @RequestMapping("/api/v1/admin/predictions")
    @PreAuthorize("hasRole('ADMIN')")
    public class AdminPredictionController {
        private final PredictionSettlementJobRepository jobRepo;
        private final RacePredictionRepository predictionRepo;
        private final RaceRepository raceRepo;

        public AdminPredictionController(PredictionSettlementJobRepository jobRepo, 
                                         RacePredictionRepository predictionRepo,
                                         RaceRepository raceRepo) {
            this.jobRepo = jobRepo;
            this.predictionRepo = predictionRepo;
            this.raceRepo = raceRepo;
        }

        @GetMapping("/races")
        public ResponseEntity<List<AdminRaceSummaryResponse>> getRaces() {
            List<Race> races = raceRepo.findAll();
            List<AdminRaceSummaryResponse> response = races.stream().map(r -> {
                AdminRaceSummaryResponse s = new AdminRaceSummaryResponse();
                s.setRaceId(r.getId());
                s.setRaceName(r.getName());
                s.setRaceAt(r.getRaceAt());
                s.setRaceStatus(r.getStatus());
                
                // Fetch stats
                long total = predictionRepo.countByRaceId(r.getId());
                s.setTotalPredictions(total);
                
                // Determine consolidated predictionStatus
                PredictionSettlementJob job = jobRepo.findByRaceId(r.getId()).orElse(null);
                String predStatus = "OPEN";
                if ("CANCELLED".equals(r.getStatus())) {
                    predStatus = "REFUNDED";
                } else if (job != null) {
                    predStatus = job.getStatus(); // COMPLETED, FAILED, PROCESSING, PENDING
                } else if (!"SCHEDULED".equals(r.getStatus())) {
                    predStatus = "LOCKED";
                }
                s.setPredictionStatus(predStatus);
                
                return s;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(response);
        }

        @GetMapping("/races/{raceId}")
        public ResponseEntity<AdminRaceDetailResponse> getRaceDetail(@PathVariable Long raceId) {
            Race r = raceRepo.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

            AdminRaceDetailResponse d = new AdminRaceDetailResponse();
            d.setRaceId(r.getId());
            d.setRaceName(r.getName());
            d.setRaceStatus(r.getStatus());

            PredictionSettlementJob job = jobRepo.findByRaceId(r.getId()).orElse(null);
            
            // Map predictions summary stats
            long total = predictionRepo.countByRaceId(r.getId());
            long winnerCount = predictionRepo.countByRaceIdAndStatus(r.getId(), "CORRECT"); // (simplified)
            // in real implementation, query detailed categories
            
            d.setTotalPredictions(total);
            
            if (job != null) {
                AdminRaceDetailResponse.SettlementJobInfo j = new AdminRaceDetailResponse.SettlementJobInfo();
                j.setId(job.getId());
                j.setStatus(job.getStatus());
                j.setProcessedCount(job.getProcessedCount());
                j.setRewardedCount(job.getRewardedCount());
                j.setErrorMessage(job.getErrorMessage());
                d.setSettlementJob(j);
            }
            return ResponseEntity.ok(d);
        }

        @PostMapping("/settlement-jobs/{jobId}/retry")
        public ResponseEntity<Void> retryJob(@PathVariable Long jobId) {
            PredictionSettlementJob job = jobRepo.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

            if ("FAILED".equals(job.getStatus())) {
                job.setStatus("PENDING");
                job.setErrorMessage(null);
                job.setUpdatedAt(LocalDateTime.now());
                jobRepo.save(job);
            }
            return ResponseEntity.ok().build();
        }
    }
    ```

---

### Task 7: Frontend Admin Workspace Integration
Build the refined drill-down user interface using the React router.

**Files:**
*   Modify: [AppRouter.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/routes/AppRouter.tsx)
*   Create: `frontend/src/pages/admin/AdminPredictionsWorkspace.tsx` (Race List Monitor)
*   Create: `frontend/src/pages/admin/AdminRacePredictionDetailPage.tsx` (Drill-Down Summary & Audit List)

- [ ] **Step 1: Integrate routes in AppRouter**
    ```typescript
    import { AdminPredictionsWorkspace } from "../pages/admin/AdminPredictionsWorkspace";
    import { AdminRacePredictionDetailPage } from "../pages/admin/AdminRacePredictionDetailPage";
    ```
    Add routes:
    ```typescript
    <Route path="admin/predictions" element={adminRoute(<AdminPredictionsWorkspace />)} />
    <Route path="admin/predictions/races/:raceId" element={adminRoute(<AdminRacePredictionDetailPage />)} />
    ```
- [ ] **Step 2: Create `AdminPredictionsWorkspace` Component**
    Render race list table with prediction status badges (`OPEN`, `LOCKED`, `SETTLEMENT_PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REFUNDED`).
- [ ] **Step 3: Create `AdminRacePredictionDetailPage` Component**
    Render headers, summary cards, pick distribution statistics, settlement retry actions (if job state is `FAILED`), and the detailed prediction audit list table.

---

## Verification Plan

### Automated Tests
1.  **Repository Unit Tests**: Verify `claimJobAtomic` updates `PENDING` -> `PROCESSING` atomically.
2.  **Points Service Tests**: Verify duplicate transaction inserts throw constraints preventing rewards double-entry.
3.  **Controller Integration Tests**: Bootstrap API mock requests, verify status mapping return values.

### Manual Verification
1.  Navigate to `/admin/predictions` in frontend. Check list of races and status badges.
2.  Click a race in `OPEN` status. Verify only active entries list and counts display. No correct/incorrect cards or settlement metrics.
3.  Admin confirm results of a race. Check `/admin/predictions` to see status shift to `SETTLEMENT_PENDING`, then `COMPLETED` once the scheduler processes.
4.  Open the race detail. Verify `Winner Correct`, `Exact Top 3`, `Top 3 Any Order`, and `Incorrect` breakdown cards load correctly.
