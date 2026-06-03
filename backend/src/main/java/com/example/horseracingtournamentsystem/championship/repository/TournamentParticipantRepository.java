package com.example.horseracingtournamentsystem.championship.repository;

import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TournamentParticipantRepository extends JpaRepository<TournamentParticipant, Long> {

    List<TournamentParticipant> findAllByTournament_IdOrderByCreatedAtDesc(Long tournamentId);

    boolean existsByTournament_IdAndHorse_Id(Long tournamentId, Long horseId);

    boolean existsByTournament_IdAndJockey_Id(Long tournamentId, Long jockeyId);
}
