package com.example.horseracingtournamentsystem.point.repository;

import com.example.horseracingtournamentsystem.point.entity.PointTransaction;
import com.example.horseracingtournamentsystem.point.entity.PointTransactionType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndTransactionType(Long userId, PointTransactionType transactionType);

    boolean existsByReferenceTypeAndReferenceIdAndTransactionType(
            String referenceType,
            Long referenceId,
            PointTransactionType transactionType
    );
}
