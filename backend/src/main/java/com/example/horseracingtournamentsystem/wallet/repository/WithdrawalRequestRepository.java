package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {
    List<WithdrawalRequest> findByUserIdOrderByRequestedAtDesc(Long userId);

    List<WithdrawalRequest> findByStatusOrderByRequestedAtAsc(WithdrawalStatus status);

    List<WithdrawalRequest> findAllByOrderByRequestedAtDesc();

    @org.springframework.data.jpa.repository.Query(
            "select coalesce(sum(w.amount), 0) from WithdrawalRequest w "
                    + "where w.user.id = :userId and w.status in :statuses")
    long sumAmountByUserAndStatusIn(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("statuses") java.util.Collection<WithdrawalStatus> statuses);
}
