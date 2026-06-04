package com.example.horseracingtournamentsystem.race.repository;

import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceParticipantRepository extends JpaRepository<RaceParticipant, Long> {

    List<RaceParticipant> findAllByRace_IdOrderByCreatedAtAsc(Long raceId);

    List<RaceParticipant> findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(Long raceId, String status);

    Optional<RaceParticipant> findByIdAndRace_Id(Long id, Long raceId);

    List<RaceParticipant> findAllByJockey_EmailAndRace_Tournament_StatusInOrderByRace_RaceAtAsc(
            String jockeyEmail,
            List<String> tournamentStatuses
    );

    boolean existsByRace_IdAndHorse_Id(Long raceId, Long horseId);
}
