package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionHistory;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WithdrawalActionHistoryRepository extends JpaRepository<WithdrawalActionHistory, Long> {
    @EntityGraph(attributePaths = "actor")
    List<WithdrawalActionHistory> findByWithdrawalIdOrderByCreatedAtAscIdAsc(Long withdrawalId);

    @Query("""
            select h
            from WithdrawalActionHistory h
            where h.withdrawal.id in :withdrawalIds
            order by h.withdrawal.id, h.createdAt, h.id
            """)
    List<WithdrawalActionHistory> findForWithdrawals(
            @Param("withdrawalIds") java.util.Collection<Long> withdrawalIds);
}
