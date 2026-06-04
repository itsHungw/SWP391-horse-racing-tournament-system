package com.example.horseracingtournamentsystem.referee.repository;

import com.example.horseracingtournamentsystem.referee.entity.RaceResult;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {

    List<RaceResult> findAllByRace_IdOrderByPositionAscCreatedAtAsc(Long raceId);

    Optional<RaceResult> findByRace_IdAndParticipant_Id(Long raceId, Long participantId);
}
