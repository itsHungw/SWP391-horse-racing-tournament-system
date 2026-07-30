package com.example.horseracingtournamentsystem.wallet.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Đơn nạp tiền qua VNPay. {@code vnpayTxnRef} là khóa đối soát (unique) gửi sang cổng
 * và nhận lại ở IPN/return. Ghi-có ví chỉ xảy ra khi đơn chuyển SUCCESS (idempotent).
 */
@Entity
@Table(name = "topup_orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TopUpOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount", nullable = false)
    private long amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TopUpStatus status;

    @Column(name = "vnpay_txn_ref", nullable = false, unique = true, length = 100)
    private String vnpayTxnRef;

    @Column(name = "vnpay_response_code", length = 10)
    private String vnpayResponseCode;

    @Column(name = "vnpay_transaction_no", length = 50)
    private String vnpayTransactionNo;

    @Column(name = "vnpay_bank_code", length = 20)
    private String vnpayBankCode;

    @Column(name = "vnpay_bank_tran_no", length = 50)
    private String vnpayBankTranNo;

    @Column(name = "vnpay_card_type", length = 20)
    private String vnpayCardType;

    /** Thời điểm VNPay ghi nhận thanh toán (giờ VN), khác {@link #paidAt} là lúc hệ thống ghi-có. */
    @Column(name = "vnpay_pay_date")
    private LocalDateTime vnpayPayDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public static TopUpOrder initiate(User user, long amount, String vnpayTxnRef) {
        TopUpOrder order = new TopUpOrder();
        order.user = user;
        order.amount = amount;
        order.vnpayTxnRef = vnpayTxnRef;
        order.status = TopUpStatus.PENDING;
        order.createdAt = LocalDateTime.now();
        return order;
    }

    public boolean isTerminal() {
        return status == TopUpStatus.SUCCESS || status == TopUpStatus.FAILED || status == TopUpStatus.EXPIRED;
    }

    public void markSuccess(String responseCode, VNPayPaymentDetails details) {
        this.status = TopUpStatus.SUCCESS;
        this.vnpayResponseCode = responseCode;
        this.vnpayTransactionNo = details.transactionNo();
        this.vnpayBankCode = details.bankCode();
        this.vnpayBankTranNo = details.bankTranNo();
        this.vnpayCardType = details.cardType();
        this.vnpayPayDate = details.payDate();
        this.paidAt = LocalDateTime.now();
    }

    public void markFailed(String responseCode) {
        this.status = TopUpStatus.FAILED;
        this.vnpayResponseCode = responseCode;
    }
}
