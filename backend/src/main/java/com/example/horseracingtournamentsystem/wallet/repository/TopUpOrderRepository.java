package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopUpOrderRepository extends JpaRepository<TopUpOrder, Long>, JpaSpecificationExecutor<TopUpOrder> {
    Optional<TopUpOrder> findByVnpayTxnRef(String vnpayTxnRef);
    Optional<TopUpOrder> findByVnpayTxnRefAndUserId(String vnpayTxnRef, Long userId);

    @Override
    @EntityGraph(attributePaths = "user")
    Page<TopUpOrder> findAll(Specification<TopUpOrder> specification, Pageable pageable);

    @Query("""
            select t.id from TopUpOrder t
            where lower(t.vnpayTxnRef) like lower(concat('%', :query, '%'))
               or lower(coalesce(t.vnpayTransactionNo, '')) like lower(concat('%', :query, '%'))
            """)
    List<Long> findIdsByReconciliationQuery(@Param("query") String query);

    @Query("""
            select coalesce(sum(t.amount), 0) from TopUpOrder t
            where t.status = com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus.SUCCESS
              and t.paidAt >= :from and t.paidAt < :to
            """)
    long sumSuccessfulPaidBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            select count(o) from TopUpOrder o
            where o.createdAt >= :from and o.createdAt < :to
              and o.status = com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus.SUCCESS
              and not exists (
                select tx.id from WalletTransaction tx
                where tx.referenceType = 'TOPUP_ORDER'
                  and tx.referenceId = o.id
                  and tx.transactionType = com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType.TOPUP
              )
            """)
    long countMissingWalletCredits(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            select count(o) from TopUpOrder o
            where o.createdAt >= :from and o.createdAt < :to
              and o.status = com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus.SUCCESS
              and exists (
                select tx.id from WalletTransaction tx
                where tx.referenceType = 'TOPUP_ORDER'
                  and tx.referenceId = o.id
                  and tx.transactionType = com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType.TOPUP
                  and tx.amount <> o.amount
              )
            """)
    long countAmountMismatches(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            select count(o) from TopUpOrder o
            where o.createdAt >= :from and o.createdAt < :to
              and o.status <> com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus.SUCCESS
              and exists (
                select tx.id from WalletTransaction tx
                where tx.referenceType = 'TOPUP_ORDER'
                  and tx.referenceId = o.id
                  and tx.transactionType = com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType.TOPUP
              )
            """)
    long countUnexpectedWalletCredits(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            select count(o) from TopUpOrder o
            where o.createdAt >= :from and o.createdAt < :to
              and o.createdAt < :staleBefore
              and o.status in (
                com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus.INITIATED,
                com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus.PENDING
              )
            """)
    long countStalePending(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("staleBefore") LocalDateTime staleBefore);
}
