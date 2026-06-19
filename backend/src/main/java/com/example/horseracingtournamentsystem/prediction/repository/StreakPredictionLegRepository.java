package com.example.horseracingtournamentsystem.prediction.repository;

import com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StreakPredictionLegRepository extends JpaRepository<StreakPredictionLeg, Long> {
    List<StreakPredictionLeg> findByRace_Id(Long raceId);
}
