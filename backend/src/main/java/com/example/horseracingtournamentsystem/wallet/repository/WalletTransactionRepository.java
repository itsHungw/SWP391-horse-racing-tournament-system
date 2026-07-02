package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndTransactionType(Long userId, WalletTransactionType transactionType);

    boolean existsByReferenceTypeAndReferenceIdAndTransactionType(
            String referenceType,
            Long referenceId,
            WalletTransactionType transactionType
    );
}
