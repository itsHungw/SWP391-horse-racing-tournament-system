package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.config.VNPayProperties;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.dto.TopUpReceiptResponse;
import com.example.horseracingtournamentsystem.wallet.dto.TopUpReceiptResponse.ReceiptStatus;
import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletTransactionRepository;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Nạp tiền qua VNPay. Tạo đơn + URL ký, và xử lý kết quả (return/IPN) idempotent:
 * verify chữ ký → so khớp số tiền → chặn đơn đã terminal → ghi-có ví (idempotent theo order id).
 */
@Service
@RequiredArgsConstructor
public class TopUpService {

    private static final DateTimeFormatter REF_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final TopUpOrderRepository orderRepository;
    private final VNPayService vnPayService;
    private final VNPayProperties props;
    private final WalletService walletService;
    private final WalletTransactionRepository transactionRepository;
    private final com.example.horseracingtournamentsystem.notification.service.NotificationService notificationService;

    public enum TopUpResult {
        SUCCESS, ALREADY_CONFIRMED, FAILED, INVALID_SIGNATURE, ORDER_NOT_FOUND, INVALID_AMOUNT
    }

    @Transactional
    public String createTopUp(User user, long amount, String ipAddr) {
        if (!props.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "VNPay is not configured");
        }
        if (amount < props.getMinAmount() || amount > props.getMaxAmount()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Top-up amount must be between " + props.getMinAmount() + " and " + props.getMaxAmount() + " VND");
        }
        walletService.requireActiveForUserAction(user);
        String txnRef = generateTxnRef();
        TopUpOrder order = orderRepository.save(TopUpOrder.initiate(user, amount, txnRef));
        return vnPayService.buildPaymentUrl(txnRef, amount, "Wallet top-up #" + order.getId(), ipAddr);
    }

    @Transactional
    public TopUpResult processResult(Map<String, String> params) {
        if (!vnPayService.verifySignature(params)) {
            return TopUpResult.INVALID_SIGNATURE;
        }
        TopUpOrder order = orderRepository.findByVnpayTxnRef(params.get("vnp_TxnRef")).orElse(null);
        if (order == null) {
            return TopUpResult.ORDER_NOT_FOUND;
        }

        long vnpAmount;
        try {
            vnpAmount = Long.parseLong(params.getOrDefault("vnp_Amount", "0")) / 100;
        } catch (NumberFormatException e) {
            return TopUpResult.INVALID_AMOUNT;
        }
        if (vnpAmount != order.getAmount()) {
            if (!order.isTerminal()) {
                order.markFailed("AMOUNT_MISMATCH");
                orderRepository.save(order);
            }
            return TopUpResult.INVALID_AMOUNT;
        }

        if (order.isTerminal()) {
            return order.getStatus() == TopUpStatus.SUCCESS ? TopUpResult.ALREADY_CONFIRMED : TopUpResult.FAILED;
        }

        String code = params.get("vnp_ResponseCode");
        String txnStatus = params.get("vnp_TransactionStatus");
        if (!"00".equals(code) || !"00".equals(txnStatus)) {
            order.markFailed(code);
            orderRepository.save(order);
            return TopUpResult.FAILED;
        }

        order.markSuccess(code, params.get("vnp_TransactionNo"));
        orderRepository.save(order);
        walletService.adjust(
                order.getUser(), order.getAmount(), WalletTransactionType.TOPUP,
                WalletTransaction.REF_TOPUP_ORDER, order.getId(),
                "VNPay top-up #" + order.getId()
        );

        notificationService.notify(
                order.getUser(),
                "TOPUP_SUCCESS",
                "Top-up successful",
                "Your wallet has been topped up with " + order.getAmount() + " VND.",
                "TOPUP_ORDER",
                order.getId()
        );

        return TopUpResult.SUCCESS;
    }

    @Transactional(readOnly = true)
    public TopUpReceiptResponse receipt(User user, String txnRef) {
        TopUpOrder order = orderRepository.findByVnpayTxnRefAndUserId(txnRef, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Top-up receipt not found"));
        WalletTransaction transaction = transactionRepository
                .findByReferenceTypeAndReferenceIdAndTransactionType(
                        WalletTransaction.REF_TOPUP_ORDER, order.getId(), WalletTransactionType.TOPUP)
                .orElse(null);
        ReceiptStatus status = switch (order.getStatus()) {
            case SUCCESS -> ReceiptStatus.SUCCESS;
            case FAILED, EXPIRED -> ReceiptStatus.FAILED;
            case INITIATED, PENDING -> ReceiptStatus.PENDING;
        };
        return new TopUpReceiptResponse(order.getVnpayTxnRef(), status, order.getAmount(),
                transaction == null ? null : transaction.getBalanceAfter(),
                transaction == null ? null : transaction.getId(),
                order.getPaidAt() != null ? order.getPaidAt() : order.getCreatedAt(),
                status == ReceiptStatus.FAILED ? safeFailureReason(order.getVnpayResponseCode()) : null);
    }

    private String safeFailureReason(String code) {
        if (code == null || code.isBlank()) return "The payment was not completed.";
        return switch (code) {
            case "24" -> "The payment was cancelled.";
            case "51" -> "The payment account had insufficient funds.";
            case "AMOUNT_MISMATCH" -> "The payment amount could not be verified.";
            default -> "The payment was declined or could not be completed.";
        };
    }

    private String generateTxnRef() {
        return ZonedDateTime.now(VN_ZONE).format(REF_FMT) + String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
    }
}
