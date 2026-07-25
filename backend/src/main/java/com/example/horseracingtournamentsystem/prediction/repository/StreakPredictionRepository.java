package com.example.horseracingtournamentsystem.prediction.repository;

import com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction;
import com.example.horseracingtournamentsystem.finance.dto.FinanceTotalsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface StreakPredictionRepository extends JpaRepository<StreakPrediction, Long> {
    @org.springframework.data.jpa.repository.Query("""
            select coalesce(sum(s.wagerAmount), 0) as wagers,
                   coalesce(sum(case when s.status = com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.WON then s.rewardPoints else 0 end), 0) as payouts,
                   coalesce(sum(case when s.status = com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.REFUNDED then s.wagerAmount else 0 end), 0) as refunds
            from StreakPrediction s
            where s.evaluatedAt >= :from and s.evaluatedAt < :to
              and s.status in (
                com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.WON,
                com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.LOST,
                com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.REFUNDED
              )
            """)
    FinanceTotalsProjection aggregateFinanceTotalsBetween(
            @org.springframework.data.repository.query.Param("from") LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") LocalDateTime to);
    List<StreakPrediction> findBySpectator_Id(Long spectatorId);
    List<StreakPrediction> findByStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus status);

    @org.springframework.data.jpa.repository.Query("""
            SELECT COALESCE(SUM(s.wagerAmount), 0)
            FROM StreakPrediction s
            WHERE s.spectator.id = :userId
              AND s.status IN (
                com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.PENDING,
                com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.IN_PROGRESS
              )
            """)
    long sumOpenStakeBySpectator(@org.springframework.data.repository.query.Param("userId") Long userId);
}
