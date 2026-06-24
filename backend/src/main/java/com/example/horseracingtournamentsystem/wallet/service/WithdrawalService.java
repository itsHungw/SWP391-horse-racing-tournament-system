package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Rút tiền theo mô hình "yêu cầu rút → Admin duyệt → chi". Tạo yêu cầu HOLD tiền ngay
 * (chống rút 2 lần); REJECTED hoàn lại; PAID tất toán. Gate bởi cờ {@code wallet.withdrawal.enabled}.
 */
@Service
@RequiredArgsConstructor
public class WithdrawalService {

    private final WithdrawalRequestRepository repository;
    private final WalletService walletService;
    private final UserRepository userRepository;

    @Value("${wallet.withdrawal.enabled:true}")
    private boolean withdrawalEnabled;

    @Value("${wallet.withdrawal.min-amount:50000}")
    private long minAmount;

    @Transactional
    public WithdrawalRequest createRequest(User user, long amount, String bankInfo) {
        if (!withdrawalEnabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Withdrawals are currently disabled");
        }
        if (amount < minAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum withdrawal is " + minAmount + " VND");
        }
        if (bankInfo == null || bankInfo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank information is required");
        }
        if (walletService.getBalance(user.getId()) < amount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance");
        }

        WithdrawalRequest request = repository.save(WithdrawalRequest.create(user, amount, bankInfo.trim()));
        // HOLD: trừ tiền ngay (adjust kiểm tra số dư dưới khóa, chống double-spend).
        walletService.adjust(
                user, -amount, WalletTransactionType.WITHDRAWAL_HOLD,
                WalletTransaction.REF_WITHDRAWAL, request.getId(),
                "Withdrawal hold for request #" + request.getId()
        );
        return request;
    }

    @Transactional(readOnly = true)
    public List<WithdrawalRequest> listMine(Long userId) {
        return repository.findByUserIdOrderByRequestedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<WithdrawalRequest> listForAdmin(WithdrawalStatus status) {
        return status == null
                ? repository.findAllByOrderByRequestedAtDesc()
                : repository.findByStatusOrderByRequestedAtAsc(status);
    }

    @Transactional
    public WithdrawalRequest approve(Long id, String reviewerEmail) {
        WithdrawalRequest request = get(id);
        request.approve(reviewer(reviewerEmail));
        return request;
    }

    @Transactional
    public WithdrawalRequest reject(Long id, String reviewerEmail, String note) {
        WithdrawalRequest request = get(id);
        request.reject(reviewer(reviewerEmail), note);
        // Hoàn tiền đã HOLD về ví.
        walletService.adjust(
                request.getUser(), request.getAmount(), WalletTransactionType.WITHDRAWAL_REFUND,
                WalletTransaction.REF_WITHDRAWAL, request.getId(),
                "Withdrawal refund for rejected request #" + request.getId()
        );
        return request;
    }

    @Transactional
    public WithdrawalRequest markPaid(Long id, String reviewerEmail) {
        WithdrawalRequest request = get(id);
        request.markPaid(reviewer(reviewerEmail));
        return request;
    }

    @Transactional
    public WithdrawalRequest cancel(Long id, String userEmail) {
        WithdrawalRequest request = get(id);
        if (!request.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only cancel your own request");
        }
        request.cancelByUser();
        walletService.adjust(
                request.getUser(), request.getAmount(), WalletTransactionType.WITHDRAWAL_REFUND,
                WalletTransaction.REF_WITHDRAWAL, request.getId(),
                "Withdrawal cancelled — refund for request #" + request.getId()
        );
        return request;
    }

    private WithdrawalRequest get(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Withdrawal request not found"));
    }

    private User reviewer(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Reviewer not found"));
    }
}
