package com.example.horseracingtournamentsystem.prediction.repository;

import com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StreakPredictionLegRepository extends JpaRepository<StreakPredictionLeg, Long> {
    List<StreakPredictionLeg> findByRace_Id(Long raceId);

    @org.springframework.data.jpa.repository.Query("""
            SELECT l
            FROM StreakPredictionLeg l JOIN FETCH l.streakPrediction s
            WHERE l.race.id = :raceId
              AND s.status NOT IN (
                com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.REFUNDED
              )
            """)
    List<StreakPredictionLeg> findActiveLegsByRaceId(@org.springframework.data.repository.query.Param("raceId") Long raceId);
}
