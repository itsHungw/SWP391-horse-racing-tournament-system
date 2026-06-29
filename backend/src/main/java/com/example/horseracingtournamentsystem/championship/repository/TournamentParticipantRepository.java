package com.example.horseracingtournamentsystem.championship.repository;

import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.championship.enums.TournamentParticipantStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TournamentParticipantRepository extends JpaRepository<TournamentParticipant, Long> {

    List<TournamentParticipant> findAllByTournament_IdOrderByCreatedAtDesc(Long tournamentId);

    List<TournamentParticipant> findAllByJockey_EmailOrderByCreatedAtDesc(String jockeyEmail);

    boolean existsByTournament_IdAndHorse_Id(Long tournamentId, Long horseId);

    boolean existsByTournament_IdAndJockey_Id(Long tournamentId, Long jockeyId);

    boolean existsByTournament_IdAndJockey_IdAndStatus(
            Long tournamentId,
            Long jockeyId,
            TournamentParticipantStatus status
    );

    @Query("""
            SELECT participant.tournament.id, COUNT(participant)
            FROM TournamentParticipant participant
            WHERE participant.tournament.id IN :tournamentIds
              AND participant.status = com.example.horseracingtournamentsystem.championship.enums.TournamentParticipantStatus.ACTIVE
            GROUP BY participant.tournament.id
            """)
    List<Object[]> countActiveByTournamentIds(@Param("tournamentIds") List<Long> tournamentIds);
}
