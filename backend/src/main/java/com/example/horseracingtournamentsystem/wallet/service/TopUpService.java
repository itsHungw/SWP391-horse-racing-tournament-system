package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.config.VNPayProperties;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
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
        return TopUpResult.SUCCESS;
    }

    private String generateTxnRef() {
        return ZonedDateTime.now(VN_ZONE).format(REF_FMT) + String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
    }
}
