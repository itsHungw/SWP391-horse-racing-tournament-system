package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WithdrawalActionHistoryRepository extends JpaRepository<WithdrawalActionHistory, Long> {
    List<WithdrawalActionHistory> findByWithdrawalIdOrderByCreatedAtAscIdAsc(Long withdrawalId);
}
