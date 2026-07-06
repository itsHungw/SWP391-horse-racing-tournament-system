package com.example.horseracingtournamentsystem.race.repository;

import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RaceParticipantRepository extends JpaRepository<RaceParticipant, Long> {

    List<RaceParticipant> findAllByRace_IdOrderByCreatedAtAsc(Long raceId);

    List<RaceParticipant> findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(Long raceId, ParticipantStatus status);

    Optional<RaceParticipant> findByIdAndRace_Id(Long id, Long raceId);

    List<RaceParticipant> findAllByJockey_EmailAndRace_Tournament_StatusInOrderByRace_RaceAtAsc(
            String jockeyEmail,
            List<TournamentStatus> statuses
    );

    boolean existsByRace_IdAndHorse_Id(Long raceId, Long horseId);

    void deleteAllByRace_Tournament_IdAndHorse_Id(Long tournamentId, Long horseId);

    @Query("""
            SELECT participant.race.id, COUNT(participant)
            FROM RaceParticipant participant
            WHERE participant.race.id IN :raceIds
              AND participant.status NOT IN (
                com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN,
                com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.DISQUALIFIED
              )
            GROUP BY participant.race.id
            """)
    List<Object[]> countActiveByRaceIds(@Param("raceIds") List<Long> raceIds);
}
