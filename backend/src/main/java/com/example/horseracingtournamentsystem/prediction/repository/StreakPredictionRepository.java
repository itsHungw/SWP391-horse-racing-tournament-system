package com.example.horseracingtournamentsystem.prediction.repository;

import com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StreakPredictionRepository extends JpaRepository<StreakPrediction, Long> {
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
