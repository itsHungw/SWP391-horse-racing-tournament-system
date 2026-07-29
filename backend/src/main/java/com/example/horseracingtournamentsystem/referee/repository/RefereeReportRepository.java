package com.example.horseracingtournamentsystem.referee.repository;

import com.example.horseracingtournamentsystem.referee.entity.RefereeReport;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefereeReportRepository extends JpaRepository<RefereeReport, Long> {

    Optional<RefereeReport> findByRace_IdAndReferee_Email(Long raceId, String refereeEmail);

    /** Một race thực tế chỉ có một trọng tài, nhưng dùng findFirst để tránh NonUniqueResult nếu có nhiều. */
    Optional<RefereeReport> findFirstByRace_IdOrderByIdDesc(Long raceId);
}
