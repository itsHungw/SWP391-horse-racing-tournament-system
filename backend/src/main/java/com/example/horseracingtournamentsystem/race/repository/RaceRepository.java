package com.example.horseracingtournamentsystem.race.repository;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RaceRepository extends JpaRepository<Race, Long> {
    Optional<Race> findByIdAndDeletedAtIsNull(Long id);

    // EntityGraph: fetch-join các ToOne mà mapToResponse luôn chạm (tournament/referee/createdBy)
    // -> list N race còn 1 query thay vì 1 + 3N (diệt lazy N+1). referee nullable nên dùng LEFT JOIN ngầm.
    @EntityGraph(attributePaths = {"tournament", "referee", "createdBy"})
    List<Race> findAllByDeletedAtIsNull();

    @EntityGraph(attributePaths = {"tournament", "referee", "createdBy"})
    List<Race> findAllByDeletedAtIsNullOrderByRaceAtAsc();

    @EntityGraph(attributePaths = {"tournament", "referee", "createdBy"})
    List<Race> findAllByTournamentIdAndDeletedAtIsNull(Long tournamentId);

    @EntityGraph(attributePaths = {"tournament", "referee", "createdBy"})
    List<Race> findAllByTournamentIdAndDeletedAtIsNullOrderByRaceAtAsc(Long tournamentId);
    List<Race> findAllByReferee_EmailAndTournament_StatusInAndDeletedAtIsNullOrderByRaceAtAsc(
            String refereeEmail,
            List<TournamentStatus> tournamentStatuses
    );
    Optional<Race> findByIdAndReferee_EmailAndDeletedAtIsNull(Long id, String refereeEmail);
    boolean existsByCodeAndDeletedAtIsNull(String code);
    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, Long id);

    @Query("""
            SELECT r FROM Race r
            WHERE r.status = com.example.horseracingtournamentsystem.race.enums.RaceStatus.SCHEDULED
              AND r.deletedAt IS NULL
              AND r.raceAt > CURRENT_TIMESTAMP
            ORDER BY r.raceAt ASC
            """)
    List<Race> findOpenRacesForPrediction();

    @Query("""
            SELECT r.tournament.id, COUNT(r)
            FROM Race r
            WHERE r.deletedAt IS NULL AND r.tournament.id IN :tournamentIds
            GROUP BY r.tournament.id
            """)
    List<Object[]> countByTournamentIds(@Param("tournamentIds") List<Long> tournamentIds);

    @Query("""
            SELECT r FROM Race r
            WHERE r.deletedAt IS NULL
              AND r.tournament.id IN :tournamentIds
              AND r.raceAt >= :now
              AND r.status NOT IN (
                com.example.horseracingtournamentsystem.race.enums.RaceStatus.CANCELLED,
                com.example.horseracingtournamentsystem.race.enums.RaceStatus.FINISHED,
                com.example.horseracingtournamentsystem.race.enums.RaceStatus.RESULT_SUBMITTED,
                com.example.horseracingtournamentsystem.race.enums.RaceStatus.RESULT_CONFIRMED,
                com.example.horseracingtournamentsystem.race.enums.RaceStatus.PUBLISHED
              )
              AND r.raceAt = (
                SELECT MIN(nextRace.raceAt) FROM Race nextRace
                WHERE nextRace.deletedAt IS NULL
                  AND nextRace.tournament.id = r.tournament.id
                  AND nextRace.raceAt >= :now
                  AND nextRace.status NOT IN (
                    com.example.horseracingtournamentsystem.race.enums.RaceStatus.CANCELLED,
                    com.example.horseracingtournamentsystem.race.enums.RaceStatus.FINISHED,
                    com.example.horseracingtournamentsystem.race.enums.RaceStatus.RESULT_SUBMITTED,
                    com.example.horseracingtournamentsystem.race.enums.RaceStatus.RESULT_CONFIRMED,
                    com.example.horseracingtournamentsystem.race.enums.RaceStatus.PUBLISHED
                  )
              )
            """)
    List<Race> findNextByTournamentIds(
            @Param("tournamentIds") List<Long> tournamentIds,
            @Param("now") LocalDateTime now
    );

    long countByDeletedAtIsNull();

    @Query(value = "SELECT COUNT(DISTINCT CAST(race_at AS DATE)) FROM races WHERE deleted_at IS NULL", nativeQuery = true)
    long countDistinctRaceDays();

    List<Race> findAllByTournamentIdAndRefereeIdAndDeletedAtIsNull(Long tournamentId, Long refereeId);

    // BR-12: đếm race khác mà referee đã được gán quanh khung giờ này (±cửa sổ) để chặn trùng lịch.
    @Query("""
            SELECT COUNT(r) FROM Race r
            WHERE r.referee.id = :refereeId
              AND r.id <> :raceId
              AND r.deletedAt IS NULL
              AND r.status <> com.example.horseracingtournamentsystem.race.enums.RaceStatus.CANCELLED
              AND r.raceAt BETWEEN :from AND :to
            """)
    long countRefereeScheduleConflicts(
            @Param("refereeId") Long refereeId,
            @Param("raceId") Long raceId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
