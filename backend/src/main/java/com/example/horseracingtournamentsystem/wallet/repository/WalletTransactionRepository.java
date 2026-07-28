package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long>, JpaSpecificationExecutor<WalletTransaction> {

    @Override
    @EntityGraph(attributePaths = "user")
    Page<WalletTransaction> findAll(Specification<WalletTransaction> specification, Pageable pageable);

    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndTransactionType(Long userId, WalletTransactionType transactionType);

    boolean existsByReferenceTypeAndReferenceIdAndTransactionType(
            String referenceType,
            Long referenceId,
            WalletTransactionType transactionType
    );

    Optional<WalletTransaction> findByReferenceTypeAndReferenceIdAndTransactionType(
            String referenceType, Long referenceId, WalletTransactionType transactionType);

    List<WalletTransaction> findAllByReferenceTypeAndReferenceIdInAndTransactionType(
            String referenceType, Collection<Long> referenceIds, WalletTransactionType transactionType);

    @EntityGraph(attributePaths = "user")
    @Query("""
            select t from WalletTransaction t
            where t.transactionType = com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType.TOPUP
              and t.referenceType = 'TOPUP_ORDER'
              and t.createdAt >= :from and t.createdAt < :to
              and not exists (select o.id from TopUpOrder o where o.id = t.referenceId)
            """)
    Page<WalletTransaction> findOrphanTopUpCredits(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    @Query("""
            select count(t) from WalletTransaction t
            where t.transactionType = com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType.TOPUP
              and t.referenceType = 'TOPUP_ORDER'
              and t.createdAt >= :from and t.createdAt < :to
              and not exists (select o.id from TopUpOrder o where o.id = t.referenceId)
            """)
    long countOrphanTopUpCredits(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
