package com.example.horseracingtournamentsystem.race.repository;

import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RaceParticipantRepository extends JpaRepository<RaceParticipant, Long> {

    /*
     * Sắp theo lane_number — số áo trên bảng đua, thứ tự nghiệp vụ mà khán giả, chủ ngựa
     * và trọng tài đều thấy.
     *
     * Trước đây hai method này sắp theo created_at và điều đó sai theo hai cách:
     * 1. Participant của một race thường được tạo trong cùng một transaction, nên mọi
     *    created_at bằng nhau. ORDER BY khi đó là no-op và Postgres trả về theo thứ tự
     *    heap, tức thứ tự tùy ý của planner (đo được: lane 8→1 với dữ liệu seed).
     * 2. Postgres UPDATE ghi dòng mới ở vị trí heap khác, nên mỗi lần trọng tài cập nhật
     *    check_status là runner table đổi thứ tự — lộn xộn dần theo thời gian.
     *
     * lane_number nullable (Integer) nên cần NULLS LAST, và cần tiebreak id để thứ tự
     * xác định tuyệt đối kể cả khi lane trùng hoặc chưa gán.
     */
    @Query("""
            select p from RaceParticipant p
            where p.race.id = :raceId
            order by p.laneNumber asc nulls last, p.id asc
            """)
    List<RaceParticipant> findAllByRaceOrderByLane(@Param("raceId") Long raceId);

    @Query("""
            select p from RaceParticipant p
            where p.race.id = :raceId
              and p.status <> :excludedStatus
            order by p.laneNumber asc nulls last, p.id asc
            """)
    List<RaceParticipant> findAllByRaceAndStatusNotOrderByLane(
            @Param("raceId") Long raceId,
            @Param("excludedStatus") ParticipantStatus excludedStatus);

    Optional<RaceParticipant> findByIdAndRace_Id(Long id, Long raceId);

    List<RaceParticipant> findAllByJockey_EmailAndRace_Tournament_StatusInOrderByRace_RaceAtAsc(
            String jockeyEmail,
            List<TournamentStatus> statuses
    );

    boolean existsByRace_IdAndHorse_Id(Long raceId, Long horseId);

    void deleteAllByRace_Tournament_IdAndHorse_Id(Long tournamentId, Long horseId);

    @Query("""
            SELECT participant.race.id, COUNT(participant)
            FROM RaceParticipant participant
            WHERE participant.race.id IN :raceIds
              AND participant.status NOT IN (
                com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN,
                com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.DISQUALIFIED
              )
            GROUP BY participant.race.id
            """)
    List<Object[]> countActiveByRaceIds(@Param("raceIds") List<Long> raceIds);
}
