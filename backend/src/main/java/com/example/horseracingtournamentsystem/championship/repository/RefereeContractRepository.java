package com.example.horseracingtournamentsystem.championship.repository;

import com.example.horseracingtournamentsystem.championship.entity.RefereeContract;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefereeContractRepository extends JpaRepository<RefereeContract, Long> {

    /** BR-07: chỉ gán cho race những referee có hợp đồng ACTIVE với giải. */
    boolean existsByTournament_IdAndReferee_IdAndStatus(Long tournamentId, Long refereeId, String status);

    /** Chặn mời trùng (đã có lời mời/hợp đồng còn hiệu lực). */
    boolean existsByTournament_IdAndReferee_IdAndStatusIn(Long tournamentId, Long refereeId, List<String> statuses);

    Optional<RefereeContract> findByTournament_IdAndReferee_Id(Long tournamentId, Long refereeId);

    Optional<RefereeContract> findByIdAndReferee_Email(Long id, String refereeEmail);

    List<RefereeContract> findAllByReferee_EmailOrderByCreatedAtDesc(String refereeEmail);

    List<RefereeContract> findAllByTournament_IdOrderByCreatedAtDesc(Long tournamentId);
}
