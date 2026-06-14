package com.example.horseracingtournamentsystem.result.repository;

import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {

    List<RaceResult> findByStatusIn(Collection<String> statuses);

    List<RaceResult> findByRace_Id(Long raceId);

    List<RaceResult> findByRace_IdAndStatus(Long raceId, String status);

    List<RaceResult> findAllByRace_IdOrderByPositionAscCreatedAtAsc(Long raceId);

    Optional<RaceResult> findByRace_IdAndParticipant_Id(Long raceId, Long participantId);

    List<RaceResult> findAllByRace_IdInAndPositionAndStatusIn(
            Collection<Long> raceIds,
            Integer position,
            Collection<String> statuses
    );

    List<RaceResult> findAllByRace_IdAndStatusInOrderByPositionAscCreatedAtAsc(
            Long raceId,
            Collection<String> statuses
    );
}
