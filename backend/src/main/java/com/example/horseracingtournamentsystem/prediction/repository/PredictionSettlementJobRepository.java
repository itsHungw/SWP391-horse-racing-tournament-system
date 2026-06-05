package com.example.horseracingtournamentsystem.prediction.repository;

import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PredictionSettlementJobRepository extends JpaRepository<PredictionSettlementJob, Long> {

    List<PredictionSettlementJob> findByStatus(String status);

    Optional<PredictionSettlementJob> findByRaceId(Long raceId);

    long countByStatus(String status);

    @Modifying
    @Query("UPDATE PredictionSettlementJob j SET j.status = 'PROCESSING', j.startedAt = CURRENT_TIMESTAMP, j.retryCount = j.retryCount + 1 WHERE j.id = :id AND j.status = 'PENDING'")
    int claimJobAtomic(@Param("id") Long id);
}
