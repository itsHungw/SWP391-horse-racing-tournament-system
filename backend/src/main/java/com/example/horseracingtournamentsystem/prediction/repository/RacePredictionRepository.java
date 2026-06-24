package com.example.horseracingtournamentsystem.prediction.repository;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;

@Repository
public interface RacePredictionRepository extends JpaRepository<RacePrediction, Long> {

    List<RacePrediction> findByStatusIn(Collection<PredictionStatus> statuses);

    List<RacePrediction> findByRace_Id(Long raceId);

    List<RacePrediction> findByRace_IdAndStatus(Long raceId, PredictionStatus status);

    List<RacePrediction> findBySpectatorId(Long spectatorId);

    boolean existsByRaceIdAndSpectatorIdAndPredictionType(Long raceId, Long spectatorId, String predictionType);

    long countByRaceId(Long raceId);

    long countByRaceIdAndStatus(Long raceId, PredictionStatus status);

    long countByStatus(PredictionStatus status);

    long countByStatusAndRaceId(PredictionStatus status, Long raceId);

    @org.springframework.data.jpa.repository.Query(value = 
        "SELECT rp.id, h.name FROM race_participants rp JOIN horses h ON rp.horse_id = h.id WHERE rp.race_id = :raceId", 
        nativeQuery = true)
    List<Object[]> findParticipantHorseNamesByRaceId(@org.springframework.data.repository.query.Param("raceId") Long raceId);

    @org.springframework.data.jpa.repository.Query(value = 
        "SELECT rp.id, h.name FROM race_participants rp JOIN horses h ON rp.horse_id = h.id WHERE rp.id IN :participantIds", 
        nativeQuery = true)
    List<Object[]> findParticipantHorseNamesByIds(@org.springframework.data.repository.query.Param("participantIds") java.util.Collection<Long> participantIds);

    @org.springframework.data.jpa.repository.Query(value = 
        "SELECT rp.id, rp.start_number, rp.lane_number, h.name AS horse_name, u.full_name AS jockey_name " +
        "FROM race_participants rp " +
        "JOIN horses h ON rp.horse_id = h.id " +
        "LEFT JOIN users u ON rp.jockey_id = u.id " +
        "WHERE rp.race_id = :raceId AND rp.status IN ('APPROVED', 'REGISTERED')", 
        nativeQuery = true)
    List<Object[]> findActiveParticipantsByRaceId(@org.springframework.data.repository.query.Param("raceId") Long raceId);

    @org.springframework.data.jpa.repository.Query("""
            SELECT COALESCE(SUM(p.wagerAmount), 0)
            FROM RacePrediction p
            WHERE p.race.id = :raceId
              AND p.predictionType = :type
              AND p.status IN (
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING,
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED
              )
            """)
    long sumWagersByRaceAndType(@org.springframework.data.repository.query.Param("raceId") Long raceId, @org.springframework.data.repository.query.Param("type") String type);

    @org.springframework.data.jpa.repository.Query("""
            SELECT COALESCE(SUM(p.wagerAmount), 0)
            FROM RacePrediction p
            WHERE p.race.id = :raceId
              AND p.predictedWinnerId = :participantId
              AND p.predictionType = :type
              AND p.status IN (
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING,
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED
              )
            """)
    long sumWagersByRaceAndTypeAndParticipant(@org.springframework.data.repository.query.Param("raceId") Long raceId, @org.springframework.data.repository.query.Param("type") String type, @org.springframework.data.repository.query.Param("participantId") Long participantId);

    @org.springframework.data.jpa.repository.Query("""
            SELECT COALESCE(SUM(p.wagerAmount), 0)
            FROM RacePrediction p
            WHERE p.spectator.id = :userId
              AND p.status IN (
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING,
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED
              )
            """)
    long sumOpenStakeBySpectator(@org.springframework.data.repository.query.Param("userId") Long userId);
}
