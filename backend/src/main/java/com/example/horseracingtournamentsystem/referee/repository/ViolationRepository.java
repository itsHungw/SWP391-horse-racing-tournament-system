package com.example.horseracingtournamentsystem.referee.repository;

import com.example.horseracingtournamentsystem.referee.entity.Violation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ViolationRepository extends JpaRepository<Violation, Long> {

    List<Violation> findAllByRace_IdOrderByOccurredAtAsc(Long raceId);
}
