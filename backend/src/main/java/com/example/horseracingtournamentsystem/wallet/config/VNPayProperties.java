package com.example.horseracingtournamentsystem.wallet.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Getter;
import lombok.Setter;

/** Cấu hình cổng VNPay (sandbox cho phạm vi đồ án). Secret để ở biến môi trường. */
@Component
@ConfigurationProperties(prefix = "vnpay")
@Getter
@Setter
public class VNPayProperties {
    private String tmnCode = "";
    private String hashSecret = "";
    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    /** URL backend nhận redirect trình duyệt sau thanh toán. */
    private String returnUrl = "http://localhost:8080/api/v1/wallet/vnpay/return";
    /** Trang FE để backend redirect tới sau khi xử lý return. */
    private String frontendReturnUrl = "http://localhost:5173/wallet";
    private long minAmount = 10000;
    private long maxAmount = 50000000;

    public boolean isConfigured() {
        return tmnCode != null && !tmnCode.isBlank() && hashSecret != null && !hashSecret.isBlank();
    }
}
