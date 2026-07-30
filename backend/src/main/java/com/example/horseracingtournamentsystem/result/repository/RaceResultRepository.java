package com.example.horseracingtournamentsystem.result.repository;

import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {

    List<RaceResult> findByStatusIn(Collection<ResultRecordStatus> statuses);

    List<RaceResult> findByRace_Id(Long raceId);

    List<RaceResult> findByRace_IdAndStatus(Long raceId, ResultRecordStatus status);

    List<RaceResult> findAllByRace_IdOrderByPositionAscCreatedAtAsc(Long raceId);

    Optional<RaceResult> findByRace_IdAndParticipant_Id(Long raceId, Long participantId);

    @Query("""
            SELECT r.race.id AS raceId,
                   horse.name AS horseName,
                   jockey.fullName AS jockeyName,
                   r.finishTimeSeconds AS finishTimeSeconds
            FROM RaceResult r
            JOIN r.participant participant
            JOIN participant.horse horse
            LEFT JOIN participant.jockey jockey
            WHERE r.race.id IN :raceIds
              AND r.position = 1
              AND r.status IN :statuses
            """)
    List<PublicWinnerProjection> findPublicWinners(
            @Param("raceIds") Collection<Long> raceIds,
            @Param("statuses") Collection<ResultRecordStatus> statuses
    );

    List<RaceResult> findAllByRace_IdAndStatusInOrderByPositionAscCreatedAtAsc(
            Long raceId,
            Collection<ResultRecordStatus> statuses
    );

    @Query("""
            SELECT COUNT(r) FROM RaceResult r
            WHERE r.participant.horse.id = :horseId
              AND r.position = 1
              AND r.status IN (
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.CONFIRMED,
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.PUBLISHED
              )
            """)
    long countWinsByHorseId(@Param("horseId") Long horseId);

    @Query("""
            SELECT COUNT(r) FROM RaceResult r
            WHERE r.participant.horse.id = :horseId
              AND r.status IN (
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.CONFIRMED,
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.PUBLISHED
              )
            """)
    long countTotalRacesByHorseId(@Param("horseId") Long horseId);

    @Query("""
            SELECT r.position, COUNT(r) FROM RaceResult r
            WHERE r.participant.horse.id = :horseId
              AND r.status IN (
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.CONFIRMED,
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.PUBLISHED
              )
            GROUP BY r.position
            """)
    List<Object[]> countPositionsByHorseId(@Param("horseId") Long horseId);

    @Query("""
            SELECT AVG(r.finishTimeSeconds) FROM RaceResult r
            WHERE r.participant.horse.id = :horseId
              AND r.status IN (
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.CONFIRMED,
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.PUBLISHED
              )
              AND r.finishTimeSeconds IS NOT NULL
            """)
    Double getAverageFinishTimeByHorseId(@Param("horseId") Long horseId);

    // ── Batch variants: one query for ALL horses, replacing the per-horse fan-out in odds pricing ──
    @Query("""
            SELECT r.participant.horse.id, COUNT(r) FROM RaceResult r
            WHERE r.participant.horse.id IN :horseIds
              AND r.status IN (
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.CONFIRMED,
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.PUBLISHED
              )
            GROUP BY r.participant.horse.id
            """)
    List<Object[]> countTotalRacesByHorseIds(@Param("horseIds") Collection<Long> horseIds);

    @Query("""
            SELECT r.participant.horse.id, r.position, COUNT(r) FROM RaceResult r
            WHERE r.participant.horse.id IN :horseIds
              AND r.status IN (
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.CONFIRMED,
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.PUBLISHED
              )
            GROUP BY r.participant.horse.id, r.position
            """)
    List<Object[]> countPositionsByHorseIds(@Param("horseIds") Collection<Long> horseIds);

    @Query("""
            SELECT r.participant.horse.id, AVG(r.finishTimeSeconds) FROM RaceResult r
            WHERE r.participant.horse.id IN :horseIds
              AND r.status IN (
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.CONFIRMED,
                com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus.PUBLISHED
              )
              AND r.finishTimeSeconds IS NOT NULL
            GROUP BY r.participant.horse.id
            """)
    List<Object[]> getAverageFinishTimeByHorseIds(@Param("horseIds") Collection<Long> horseIds);

    interface PublicWinnerProjection {
        Long getRaceId();
        String getHorseName();
        String getJockeyName();
        BigDecimal getFinishTimeSeconds();
    }
}
