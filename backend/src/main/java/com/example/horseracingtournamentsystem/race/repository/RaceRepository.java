package com.example.horseracingtournamentsystem.race.repository;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RaceRepository extends JpaRepository<Race, Long> {
    Optional<Race> findByIdAndDeletedAtIsNull(Long id);
    List<Race> findAllByDeletedAtIsNull();
    List<Race> findAllByDeletedAtIsNullOrderByRaceAtAsc();
    List<Race> findAllByTournamentIdAndDeletedAtIsNull(Long tournamentId);
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

    @Query(
            value = """
                    SELECT r FROM Race r
                    JOIN FETCH r.tournament t
                    WHERE r.deletedAt IS NULL
                      AND ((:scope = 'UPCOMING' AND r.status IN (
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.SCHEDULED,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.CHECKING,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.READY,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.ONGOING))
                        OR (:scope = 'RESULTS' AND r.status IN (
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.FINISHED,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.RESULT_SUBMITTED,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.RESULT_CONFIRMED,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.PUBLISHED)))
                      AND (:fromDate IS NULL OR r.raceAt >= :fromDate)
                      AND (:toDate IS NULL OR r.raceAt <= :toDate)
                      AND (:tournamentId IS NULL OR t.id = :tournamentId)
                      AND (:search = '' OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(r.code) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(t.location) LIKE LOWER(CONCAT('%', :search, '%')))
                      AND (:horse = '' OR EXISTS (
                           SELECT participant.id FROM RaceParticipant participant
                           WHERE participant.race = r
                             AND LOWER(participant.horse.name) LIKE LOWER(CONCAT('%', :horse, '%'))
                      ))
                      AND (:jockey = '' OR EXISTS (
                           SELECT participant.id FROM RaceParticipant participant
                           WHERE participant.race = r
                             AND participant.jockey IS NOT NULL
                             AND LOWER(participant.jockey.fullName) LIKE LOWER(CONCAT('%', :jockey, '%'))
                      ))
                    ORDER BY
                      CASE WHEN :sortBy = 'NEXT_RACE' THEN r.raceAt END ASC,
                      CASE WHEN :sortBy = 'LATEST_RESULT' THEN r.raceAt END DESC,
                      r.id ASC
                    """,
            countQuery = """
                    SELECT COUNT(r) FROM Race r
                    WHERE r.deletedAt IS NULL
                      AND ((:scope = 'UPCOMING' AND r.status IN (
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.SCHEDULED,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.CHECKING,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.READY,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.ONGOING))
                        OR (:scope = 'RESULTS' AND r.status IN (
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.FINISHED,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.RESULT_SUBMITTED,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.RESULT_CONFIRMED,
                            com.example.horseracingtournamentsystem.race.enums.RaceStatus.PUBLISHED)))
                      AND (:fromDate IS NULL OR r.raceAt >= :fromDate)
                      AND (:toDate IS NULL OR r.raceAt <= :toDate)
                      AND (:tournamentId IS NULL OR r.tournament.id = :tournamentId)
                      AND (:search = '' OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(r.code) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(r.tournament.name) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(r.tournament.location) LIKE LOWER(CONCAT('%', :search, '%')))
                      AND (:horse = '' OR EXISTS (
                           SELECT participant.id FROM RaceParticipant participant
                           WHERE participant.race = r
                             AND LOWER(participant.horse.name) LIKE LOWER(CONCAT('%', :horse, '%'))
                      ))
                      AND (:jockey = '' OR EXISTS (
                           SELECT participant.id FROM RaceParticipant participant
                           WHERE participant.race = r
                             AND participant.jockey IS NOT NULL
                             AND LOWER(participant.jockey.fullName) LIKE LOWER(CONCAT('%', :jockey, '%'))
                      ))
                    """
    )
    Page<Race> searchPublic(
            String scope,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long tournamentId,
            String search,
            String horse,
            String jockey,
            String sortBy,
            Pageable pageable
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
