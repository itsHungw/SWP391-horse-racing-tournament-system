package com.example.horseracingtournamentsystem.prediction.repository;

import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PredictionSettlementJobRepository extends JpaRepository<PredictionSettlementJob, Long> {

    List<PredictionSettlementJob> findByStatus(PredictionSettlementJobStatus status);

    Optional<PredictionSettlementJob> findByRace_Id(Long raceId);

    long countByStatus(PredictionSettlementJobStatus status);

    @Modifying
    @Query("""
            UPDATE PredictionSettlementJob j
            SET j.status = com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus.PROCESSING,
                j.startedAt = CURRENT_TIMESTAMP,
                j.retryCount = j.retryCount + 1
            WHERE j.id = :id
              AND j.status = com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus.PENDING
            """)
    int claimJobAtomic(@Param("id") Long id);
}
