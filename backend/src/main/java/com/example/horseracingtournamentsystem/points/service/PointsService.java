package com.example.horseracingtournamentsystem.points.service;

import com.example.horseracingtournamentsystem.points.entity.UserPointAccount;
import com.example.horseracingtournamentsystem.points.entity.PointTransaction;
import com.example.horseracingtournamentsystem.points.repository.UserPointAccountRepository;
import com.example.horseracingtournamentsystem.points.repository.PointTransactionRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class PointsService {

    private final UserPointAccountRepository accountRepo;
    private final PointTransactionRepository transactionRepo;

    public PointsService(UserPointAccountRepository accountRepo, PointTransactionRepository transactionRepo) {
        this.accountRepo = accountRepo;
        this.transactionRepo = transactionRepo;
    }

    @Transactional
    public void initializeAccount(User user, int initialPoints) {
        if (!accountRepo.existsById(user.getId())) {
            UserPointAccount account = UserPointAccount.create(user, initialPoints);
            accountRepo.save(account);
        }
    }

    @Transactional
    public void adjustPoints(User user, int amount, String txType, String refType, Long refId, String desc) {
        // Idempotency check: if reference type, ID, and transaction type matches, do not apply points adjust again
        if (refType != null && refId != null && transactionRepo.existsByReferenceTypeAndReferenceIdAndTransactionType(refType, refId, txType)) {
            return;
        }

        UserPointAccount account = accountRepo.findById(user.getId())
            .orElseGet(() -> {
                UserPointAccount newAcc = UserPointAccount.create(user, 0);
                return accountRepo.save(newAcc);
            });

        int newBalance = account.getPointBalance() + amount;
        if (newBalance < 0) {
            throw new IllegalArgumentException("Insufficient virtual points balance (has: " + account.getPointBalance() + ", attempted: " + amount + ")");
        }

        account.setPointBalance(newBalance);
        account.setUpdatedAt(LocalDateTime.now());
        accountRepo.save(account);

        PointTransaction tx = PointTransaction.create(user, amount, txType, refType, refId, desc);
        transactionRepo.save(tx);
    }

    public int getBalance(Long userId) {
        return accountRepo.findById(userId)
            .map(UserPointAccount::getPointBalance)
            .orElse(0);
    }

    public boolean isTransactionIdempotent(String refType, Long refId, String txType) {
        return transactionRepo.existsByReferenceTypeAndReferenceIdAndTransactionType(refType, refId, txType);
    }
}
