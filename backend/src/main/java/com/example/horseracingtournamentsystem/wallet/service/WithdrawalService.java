package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionHistory;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalRiskAssessmentResponse;
import com.example.horseracingtournamentsystem.wallet.repository.UserBankAccountRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalActionHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

/**
 * Rút tiền theo mô hình "yêu cầu rút → Admin duyệt → chi". Tạo yêu cầu HOLD tiền ngay
 * (chống rút 2 lần); REJECTED hoàn lại; PAID tất toán. Gate bởi cờ {@code wallet.withdrawal.enabled}.
 */
@Service
@RequiredArgsConstructor
public class WithdrawalService {

    private final WithdrawalRequestRepository repository;
    private final UserBankAccountRepository bankAccountRepository;
    private final WithdrawalActionHistoryRepository actionHistoryRepository;
    private final WalletService walletService;
    private final UserRepository userRepository;
    private final WithdrawalRiskAssessmentService riskService;
    private final ObjectMapper objectMapper;
    private final com.example.horseracingtournamentsystem.notification.service.NotificationService notificationService;

    @Value("${wallet.withdrawal.enabled:true}")
    private boolean withdrawalEnabled;

    @Value("${wallet.withdrawal.min-amount:50000}")
    private long minAmount;

    @Transactional
    public WithdrawalRequest createRequest(User user, long amount, Long bankAccountId) {
        if (!withdrawalEnabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Withdrawals are currently disabled");
        }
        if (amount < minAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum withdrawal is " + minAmount + " VND");
        }
        UserBankAccount bankAccount = bankAccountRepository.findByIdAndUserId(bankAccountId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Bank account is not available"));
        if (walletService.getBalance(user.getId()) < amount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance");
        }

        String bankInfo = bankAccount.getAccountHolder()
                + " · " + bankAccount.getAccountNumber()
                + " · " + bankAccount.getBankName()
                + " (" + bankAccount.getBankCode() + ")";
        WithdrawalRequest request = repository.save(
                WithdrawalRequest.create(user, amount, bankAccount, bankInfo));
        actionHistoryRepository.save(WithdrawalActionHistory.record(
                request,
                WithdrawalActionType.CREATED,
                null,
                WithdrawalStatus.REQUESTED,
                user,
                null,
                null,
                null,
                WithdrawalRiskLevel.LOW,
                "[]"));
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
    public WithdrawalRequest approve(
            Long id,
            String reviewerEmail,
            boolean riskAcknowledged,
            String internalNote
    ) {
        WithdrawalRequest request = getForUpdate(id);
        User actor = reviewer(reviewerEmail);
        WithdrawalRiskAssessmentResponse risk = riskService.assess(request);
        if (risk.level() == WithdrawalRiskLevel.HIGH
                && (!riskAcknowledged || internalNote == null || internalNote.isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "High-risk approvals require acknowledgement and an internal note");
        }
        WithdrawalStatus oldStatus = request.getStatus();
        request.approve(actor);
        recordAction(
                request, WithdrawalActionType.APPROVED, oldStatus, actor,
                null, internalNote, null, risk);
        
        notificationService.notify(
                request.getUser(),
                "WITHDRAWAL_APPROVED",
                "Withdrawal approved",
                "Your withdrawal request #" + request.getId() + " was approved.",
                "WITHDRAWAL",
                request.getId()
        );
        
        return request;
    }

    public WithdrawalRequest approve(Long id, String reviewerEmail) {
        return approve(id, reviewerEmail, true, "Approved through legacy service call");
    }

    @Transactional
    public WithdrawalRequest reject(
            Long id,
            String reviewerEmail,
            String publicReason,
            String internalNote
    ) {
        WithdrawalRequest request = getForUpdate(id);
        User actor = reviewer(reviewerEmail);
        WithdrawalRiskAssessmentResponse risk = riskService.assess(request);
        WithdrawalStatus oldStatus = request.getStatus();
        request.reject(actor, publicReason);
        recordAction(
                request, WithdrawalActionType.REJECTED, oldStatus, actor,
                publicReason, internalNote, null, risk);
        // Hoàn tiền đã HOLD về ví.
        walletService.adjust(
                request.getUser(), request.getAmount(), WalletTransactionType.WITHDRAWAL_REFUND,
                WalletTransaction.REF_WITHDRAWAL, request.getId(),
                "Withdrawal refund for rejected request #" + request.getId()
        );
        
        notificationService.notify(
                request.getUser(),
                "WITHDRAWAL_REJECTED",
                "Withdrawal rejected",
                "Your withdrawal request #" + request.getId() + " was rejected: " + publicReason,
                "WITHDRAWAL",
                request.getId()
        );
        
        return request;
    }

    public WithdrawalRequest reject(Long id, String reviewerEmail, String note) {
        return reject(id, reviewerEmail, note, null);
    }

    @Transactional
    public WithdrawalRequest markPaid(
            Long id,
            String reviewerEmail,
            String transferReference,
            String internalNote,
            String receiptFilename,
            String receiptChecksum,
            String idempotencyKey
    ) {
        WithdrawalRequest request = getForUpdate(id);
        if (idempotencyKey.equals(request.getPaymentIdempotencyKey())) {
            return request;
        }
        if (request.getPaymentIdempotencyKey() != null
                || request.getStatus() != WithdrawalStatus.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Withdrawal payment state changed");
        }
        User actor = reviewer(reviewerEmail);
        WithdrawalRiskAssessmentResponse risk = riskService.assess(request);
        WithdrawalStatus oldStatus = request.getStatus();
        request.markPaid(
                transferReference,
                receiptFilename,
                receiptChecksum,
                idempotencyKey);
        recordAction(
                request, WithdrawalActionType.MARKED_PAID, oldStatus, actor,
                null, internalNote, transferReference, risk);
        
        notificationService.notify(
                request.getUser(),
                "WITHDRAWAL_PAID",
                "Withdrawal processed",
                "Your withdrawal request #" + request.getId() + " has been processed.",
                "WITHDRAWAL",
                request.getId()
        );
        
        return request;
    }

    @Transactional
    public WithdrawalRequest cancel(Long id, String userEmail) {
        WithdrawalRequest request = getForUpdate(id);
        if (!request.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only cancel your own request");
        }
        WithdrawalRiskAssessmentResponse risk = riskService.assess(request);
        WithdrawalStatus oldStatus = request.getStatus();
        request.cancelByUser();
        recordAction(
                request, WithdrawalActionType.CANCELLED, oldStatus, request.getUser(),
                null, null, null, risk);
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

    private WithdrawalRequest getForUpdate(Long id) {
        return repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Withdrawal request not found"));
    }

    private void recordAction(
            WithdrawalRequest request,
            WithdrawalActionType action,
            WithdrawalStatus oldStatus,
            User actor,
            String publicReason,
            String internalNote,
            String transferReference,
            WithdrawalRiskAssessmentResponse risk
    ) {
        actionHistoryRepository.save(WithdrawalActionHistory.record(
                request,
                action,
                oldStatus,
                request.getStatus(),
                actor,
                publicReason,
                internalNote,
                transferReference,
                risk.level(),
                objectMapper.writeValueAsString(risk)));
    }

    private User reviewer(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Reviewer not found"));
    }
}
