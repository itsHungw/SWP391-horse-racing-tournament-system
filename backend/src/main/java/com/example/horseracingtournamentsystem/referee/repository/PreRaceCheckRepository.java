package com.example.horseracingtournamentsystem.referee.repository;

import com.example.horseracingtournamentsystem.referee.entity.PreRaceCheck;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PreRaceCheckRepository extends JpaRepository<PreRaceCheck, Long> {

    Optional<PreRaceCheck> findByRace_IdAndParticipant_Id(Long raceId, Long participantId);
}
