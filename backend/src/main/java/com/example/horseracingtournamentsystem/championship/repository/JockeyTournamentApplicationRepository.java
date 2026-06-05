package com.example.horseracingtournamentsystem.championship.repository;

import com.example.horseracingtournamentsystem.championship.entity.JockeyTournamentApplication;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JockeyTournamentApplicationRepository extends JpaRepository<JockeyTournamentApplication, Long> {

    boolean existsByTournament_IdAndJockey_IdAndStatusIn(Long tournamentId, Long jockeyId, List<String> statuses);

    Optional<JockeyTournamentApplication> findByTournament_IdAndJockey_Id(Long tournamentId, Long jockeyId);

    List<JockeyTournamentApplication> findAllByJockey_IdOrderByCreatedAtDesc(Long jockeyId);

    List<JockeyTournamentApplication> findAllByTournament_IdOrderByCreatedAtDesc(Long tournamentId);

    List<JockeyTournamentApplication> findAllByTournament_IdAndStatusOrderByCreatedAtDesc(Long tournamentId, String status);

    List<JockeyTournamentApplication> findAllByTournament_IdAndStatusOrderByReviewedAtDesc(
            Long tournamentId,
            String status
    );

    Optional<JockeyTournamentApplication> findByIdAndTournament_Id(Long id, Long tournamentId);

    long countByTournament_IdAndStatus(Long tournamentId, String status);
}
