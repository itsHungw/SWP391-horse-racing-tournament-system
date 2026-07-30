package com.example.horseracingtournamentsystem.wallet.entity;

import java.time.LocalDateTime;

/**
 * Dữ liệu thanh toán VNPay trả về kèm khi đơn nạp thành công. Gom thành một record thay vì
 * truyền rời vào {@link TopUpOrder#markSuccess}: ba giá trị {@code bankCode}, {@code bankTranNo},
 * {@code cardType} đều là String nên truyền rời rất dễ hoán vị nhầm mà compiler không bắt được.
 *
 * <p>Mọi field đều có thể null — VNPay không đảm bảo trả đủ, và giá trị parse hỏng sẽ thành null.
 */
public record VNPayPaymentDetails(
        String transactionNo,
        String bankCode,
        String bankTranNo,
        String cardType,
        LocalDateTime payDate
) {
}
