package com.example.horseracingtournamentsystem.referee.repository;

import com.example.horseracingtournamentsystem.referee.entity.RefereeReport;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefereeReportRepository extends JpaRepository<RefereeReport, Long> {

    Optional<RefereeReport> findByRace_IdAndReferee_Email(Long raceId, String refereeEmail);
}
