package com.example.horseracingtournamentsystem.race.repository;

import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceParticipantRepository extends JpaRepository<RaceParticipant, Long> {

    List<RaceParticipant> findAllByRace_IdOrderByCreatedAtAsc(Long raceId);

    boolean existsByRace_IdAndHorse_Id(Long raceId, Long horseId);
}
