package com.example.horseracingtournamentsystem.result.repository;

import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {

    List<RaceResult> findByRaceId(Long raceId);

    List<RaceResult> findByRaceIdAndStatus(Long raceId, String status);
}
