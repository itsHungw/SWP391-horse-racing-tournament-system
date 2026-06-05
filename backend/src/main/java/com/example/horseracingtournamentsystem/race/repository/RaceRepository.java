package com.example.horseracingtournamentsystem.race.repository;

import com.example.horseracingtournamentsystem.race.entity.Race;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface RaceRepository extends JpaRepository<Race, Long> {
    Optional<Race> findByIdAndDeletedAtIsNull(Long id);
    List<Race> findAllByDeletedAtIsNull();
    List<Race> findAllByTournamentIdAndDeletedAtIsNull(Long tournamentId);
    boolean existsByCodeAndDeletedAtIsNull(String code);
    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, Long id);

    @Query("SELECT r FROM Race r WHERE r.status = 'SCHEDULED' AND r.deletedAt IS NULL AND r.raceAt > CURRENT_TIMESTAMP")
    List<Race> findOpenRacesForPrediction();
}
