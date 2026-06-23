package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {
    List<WithdrawalRequest> findByUserIdOrderByRequestedAtDesc(Long userId);

    List<WithdrawalRequest> findByStatusOrderByRequestedAtAsc(WithdrawalStatus status);

    List<WithdrawalRequest> findAllByOrderByRequestedAtDesc();
}
