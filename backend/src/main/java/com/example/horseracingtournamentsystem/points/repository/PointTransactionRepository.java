package com.example.horseracingtournamentsystem.points.repository;

import com.example.horseracingtournamentsystem.points.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    
    boolean existsByReferenceTypeAndReferenceIdAndTransactionType(
        String referenceType, Long referenceId, String transactionType
    );
}
