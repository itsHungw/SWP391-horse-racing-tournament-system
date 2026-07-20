package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.entity.Wallet;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletTransactionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Sổ cái ví tiền thật (VND). Mọi thao tác tiền đi qua {@link #adjust} với hợp đồng:
 * <ol>
 *   <li>Idempotent theo {@code (referenceType, referenceId, type)} — fast-path + UNIQUE index DB.</li>
 *   <li>Pessimistic write-lock trên row ví chống lost-update.</li>
 *   <li>Guard không-âm + chặn ví LOCKED.</li>
 *   <li>Ghi {@code balance_after} vào bút toán; ví + ledger trong cùng một transaction.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Transactional
    public Wallet getOrCreateAccount(User user) {
        return walletRepository.findById(user.getId())
                .orElseGet(() -> walletRepository.save(Wallet.create(user)));
    }

    @Transactional
    public void initializeAccount(User user, long initialBalance) {
        if (walletRepository.existsById(user.getId())) {
            return;
        }
        Wallet wallet = Wallet.create(user);
        if (initialBalance > 0) {
            wallet.add(initialBalance);
        }
        walletRepository.save(wallet);
    }

    @Transactional(readOnly = true)
    public long getExistingBalanceOrZero(User user) {
        return walletRepository.findById(user.getId())
                .map(Wallet::getBalance)
                .orElse(0L);
    }

    @Transactional(readOnly = true)
    public long getBalance(Long userId) {
        return walletRepository.findById(userId)
                .map(Wallet::getBalance)
                .orElse(0L);
    }

    @Transactional(readOnly = true)
    public List<WalletTransaction> getTransactions(Long userId) {
        return walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public long credit(
            User user,
            long amount,
            WalletTransactionType transactionType,
            String referenceType,
            Long referenceId,
            String description
    ) {
        return adjust(user, amount, transactionType, referenceType, referenceId, description);
    }

    /**
     * Cộng/trừ tiền ví một cách idempotent và an toàn đồng thời. Trả về số dư sau bút toán.
     */
    @Transactional
    public long adjust(
            User user,
            long amount,
            WalletTransactionType transactionType,
            String referenceType,
            Long referenceId,
            String description
    ) {
        // 1. Fast-path idempotency — tránh lock thừa khi job/IPN chạy lại.
        if (isTransactionIdempotent(referenceType, referenceId, transactionType)) {
            return getBalance(user.getId());
        }

        // 2. Đảm bảo row ví tồn tại (race tạo mới chặn bởi PK user_id), rồi 3. khóa FOR UPDATE.
        getOrCreateAccount(user);
        Wallet wallet = walletRepository.lockByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Wallet missing after create for user " + user.getId()));

        // 4. Chặn ví bị khóa.
        // Enforcement must never swallow money already owed by the platform.
        if (wallet.isLocked() && !isAllowedLockedWalletCredit(amount, transactionType)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Wallet is locked");
        }

        // 5. Mutate (guard âm trong entity).
        wallet.adjust(amount);
        long balanceAfter = wallet.getBalance();
        walletRepository.save(wallet);

        // 6. Append ledger; UNIQUE index là lưới đỡ tuyệt đối cho idempotency dưới race.
        walletTransactionRepository.save(WalletTransaction.create(
                user,
                amount,
                transactionType,
                referenceType,
                referenceId,
                description,
                balanceAfter
        ));
        return balanceAfter;
    }

    @Transactional(readOnly = true)
    public boolean isTransactionIdempotent(
            String referenceType,
            Long referenceId,
            WalletTransactionType transactionType
    ) {
        return referenceType != null
                && referenceId != null
                && walletTransactionRepository.existsByReferenceTypeAndReferenceIdAndTransactionType(
                        referenceType,
                        referenceId,
                        transactionType
                );
    }

    private boolean isAllowedLockedWalletCredit(long amount, WalletTransactionType transactionType) {
        return amount > 0 && (transactionType == WalletTransactionType.BET_PAYOUT
                || transactionType == WalletTransactionType.BET_REFUND
                || transactionType == WalletTransactionType.WITHDRAWAL_REFUND);
    }
}
