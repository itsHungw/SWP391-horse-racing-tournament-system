package com.example.horseracingtournamentsystem.tournamentregistration.repository;

import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TournamentRegistrationRepository extends JpaRepository<TournamentRegistration, Long> {

    List<TournamentRegistration> findAllByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);

    List<TournamentRegistration> findAllByStatusOrderByCreatedAtDesc(String status);

    List<TournamentRegistration> findAllByOrderByCreatedAtDesc();

    Optional<TournamentRegistration> findByIdAndOwnerEmail(Long id, String ownerEmail);

        boolean existsByTournament_IdAndHorse_IdAndStatusIn(Long tournamentId, Long horseId, List<String> statuses);

        Optional<TournamentRegistration> findByTournament_IdAndHorse_IdAndStatusIn(Long tournamentId, Long horseId,
            List<String> statuses);

    long countByTournament_IdAndStatus(Long tournamentId, String status);
}
