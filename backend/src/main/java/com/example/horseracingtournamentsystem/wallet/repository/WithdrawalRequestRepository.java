package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.Collection;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WithdrawalRequestRepository
        extends JpaRepository<WithdrawalRequest, Long>, JpaSpecificationExecutor<WithdrawalRequest> {
    List<WithdrawalRequest> findByUserIdOrderByRequestedAtDesc(Long userId);

    List<WithdrawalRequest> findTop5ByUserIdOrderByRequestedAtDesc(Long userId);

    List<WithdrawalRequest> findByStatusOrderByRequestedAtAsc(WithdrawalStatus status);

    List<WithdrawalRequest> findAllByOrderByRequestedAtDesc();

    Optional<WithdrawalRequest> findByPaymentIdempotencyKey(String paymentIdempotencyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WithdrawalRequest w join fetch w.user where w.id = :id")
    Optional<WithdrawalRequest> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select count(w)
            from WithdrawalRequest w
            where w.user.id = :userId
              and w.requestedAt >= :since
            """)
    long countRequestedByUserSince(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since);

    @Query("""
            select w.amount
            from WithdrawalRequest w
            where w.user.id = :userId
              and w.status in (
                com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus.PAID,
                com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus.REJECTED,
                com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus.CANCELLED
              )
              and w.requestedAt >= :since
            order by w.amount asc
            """)
    List<Long> findTerminalAmountsSince(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since);

    @Query("""
            select case when count(w) > 0 then true else false end
            from WithdrawalRequest w
            where w.user.id = :userId
              and w.status in (
                com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus.REJECTED,
                com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus.CANCELLED
              )
              and w.requestedAt >= :since
            """)
    boolean existsRecentRejectedOrCancelled(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since);

    long countByStatus(WithdrawalStatus status);

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, WithdrawalStatus status);

    long countByUserIdAndStatusIn(Long userId, Collection<WithdrawalStatus> statuses);

    List<WithdrawalRequest> findByStatusInOrderByRequestedAtDesc(Collection<WithdrawalStatus> statuses);

    @Query("""
            select coalesce(sum(w.amount), 0)
            from WithdrawalRequest w
            where w.status in (
                com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus.REQUESTED,
                com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus.APPROVED
            )
            """)
    long sumPendingAmount();

    @org.springframework.data.jpa.repository.Query(
            "select coalesce(sum(w.amount), 0) from WithdrawalRequest w "
                    + "where w.user.id = :userId and w.status in :statuses")
    long sumAmountByUserAndStatusIn(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("statuses") java.util.Collection<WithdrawalStatus> statuses);

    @Query("select coalesce(sum(w.amount), 0) from WithdrawalRequest w where w.user.id = :userId")
    long sumAmountByUser(@Param("userId") Long userId);
}
