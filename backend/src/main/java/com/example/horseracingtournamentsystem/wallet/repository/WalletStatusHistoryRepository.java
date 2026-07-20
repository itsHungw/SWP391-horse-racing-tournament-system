package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.WalletStatusHistory;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletStatusHistoryRepository extends JpaRepository<WalletStatusHistory, Long> {

    @EntityGraph(attributePaths = "changedBy")
    List<WalletStatusHistory> findByUserIdOrderByChangedAtDescIdDesc(Long userId);
}
