package com.example.horseracingtournamentsystem.point.service;

import com.example.horseracingtournamentsystem.point.entity.PointTransaction;
import com.example.horseracingtournamentsystem.point.entity.PointTransactionType;
import com.example.horseracingtournamentsystem.point.entity.UserPointAccount;
import com.example.horseracingtournamentsystem.point.repository.PointTransactionRepository;
import com.example.horseracingtournamentsystem.point.repository.UserPointAccountRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PointAccountService {

    private final UserPointAccountRepository userPointAccountRepository;
    private final PointTransactionRepository pointTransactionRepository;

    @Transactional
    public UserPointAccount getOrCreateAccount(User user) {
        return userPointAccountRepository.findById(user.getId())
                .orElseGet(() -> userPointAccountRepository.save(UserPointAccount.create(user)));
    }

    @Transactional
    public void initializeAccount(User user, int initialPoints) {
        if (userPointAccountRepository.existsById(user.getId())) {
            return;
        }

        UserPointAccount account = UserPointAccount.create(user);
        if (initialPoints > 0) {
            account.addPoints(initialPoints);
        }
        userPointAccountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public int getExistingBalanceOrZero(User user) {
        return userPointAccountRepository.findById(user.getId())
                .map(UserPointAccount::getPointBalance)
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public int getBalance(Long userId) {
        return userPointAccountRepository.findById(userId)
                .map(UserPointAccount::getPointBalance)
                .orElse(0);
    }

    @Transactional
    public int credit(
            User user,
            int amount,
            PointTransactionType transactionType,
            String referenceType,
            Long referenceId,
            String description
    ) {
        return adjustPoints(user, amount, transactionType, referenceType, referenceId, description);
    }

    @Transactional
    public int adjustPoints(
            User user,
            int amount,
            PointTransactionType transactionType,
            String referenceType,
            Long referenceId,
            String description
    ) {
        if (isTransactionIdempotent(referenceType, referenceId, transactionType)) {
            return getBalance(user.getId());
        }

        UserPointAccount account = getOrCreateAccount(user);
        account.adjustPoints(amount);
        userPointAccountRepository.save(account);
        pointTransactionRepository.save(PointTransaction.create(
                user,
                amount,
                transactionType,
                referenceType,
                referenceId,
                description
        ));
        return account.getPointBalance();
    }

    @Transactional(readOnly = true)
    public boolean isTransactionIdempotent(
            String referenceType,
            Long referenceId,
            PointTransactionType transactionType
    ) {
        return referenceType != null
                && referenceId != null
                && pointTransactionRepository.existsByReferenceTypeAndReferenceIdAndTransactionType(
                        referenceType,
                        referenceId,
                        transactionType
                );
    }
}
