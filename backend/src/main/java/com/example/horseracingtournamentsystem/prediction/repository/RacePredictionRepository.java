package com.example.horseracingtournamentsystem.prediction.repository;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RacePredictionRepository extends JpaRepository<RacePrediction, Long> {

    List<RacePrediction> findByRaceId(Long raceId);

    List<RacePrediction> findByRaceIdAndStatus(Long raceId, String status);

    List<RacePrediction> findBySpectatorId(Long spectatorId);

    boolean existsByRaceIdAndSpectatorIdAndPredictionType(Long raceId, Long spectatorId, String predictionType);

    long countByRaceId(Long raceId);

    long countByRaceIdAndStatus(Long raceId, String status);

    long countByStatus(String status);

    long countByStatusAndRaceId(String status, Long raceId);

    @org.springframework.data.jpa.repository.Query(value = 
        "SELECT rp.id, h.name FROM race_participants rp JOIN horses h ON rp.horse_id = h.id WHERE rp.race_id = :raceId", 
        nativeQuery = true)
    List<Object[]> findParticipantHorseNamesByRaceId(@org.springframework.data.repository.query.Param("raceId") Long raceId);

    @org.springframework.data.jpa.repository.Query(value = 
        "SELECT rp.id, rp.start_number, rp.lane_number, h.name AS horse_name, u.full_name AS jockey_name " +
        "FROM race_participants rp " +
        "JOIN horses h ON rp.horse_id = h.id " +
        "LEFT JOIN users u ON rp.jockey_id = u.id " +
        "WHERE rp.race_id = :raceId AND rp.status IN ('APPROVED', 'REGISTERED')", 
        nativeQuery = true)
    List<Object[]> findActiveParticipantsByRaceId(@org.springframework.data.repository.query.Param("raceId") Long raceId);
}
