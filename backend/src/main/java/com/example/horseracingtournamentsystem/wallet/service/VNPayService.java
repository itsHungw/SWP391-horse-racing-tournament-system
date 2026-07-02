package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.wallet.config.VNPayProperties;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Ký/verify giao dịch VNPay theo thuật toán chuẩn (HMAC-SHA512 trên chuỗi tham số đã sort).
 * Không tin client: ghi-có ví chỉ khi {@link #verifySignature} đúng (xem TopUpService).
 */
@Service
@RequiredArgsConstructor
public class VNPayService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final VNPayProperties props;

    /** Tạo URL thanh toán đã ký. {@code amount} là VND (đồng), sẽ ×100 theo yêu cầu VNPay. */
    public String buildPaymentUrl(String txnRef, long amount, String orderInfo, String ipAddr) {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", props.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amount * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", props.getReturnUrl());
        params.put("vnp_IpAddr", ipAddr == null ? "127.0.0.1" : ipAddr);
        ZonedDateTime now = ZonedDateTime.now(VN_ZONE);
        params.put("vnp_CreateDate", now.format(FMT));
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(FMT));

        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII)).append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                    query.append('&');
                }
            }
        }
        String secureHash = hmacSHA512(props.getHashSecret(), hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);
        return props.getPayUrl() + "?" + query;
    }

    /** Verify chữ ký của tập tham số trả về từ VNPay (return/IPN). */
    public boolean verifySignature(Map<String, String> allParams) {
        Map<String, String> fields = new HashMap<>(allParams);
        String received = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        if (received == null || received.isBlank()) {
            return false;
        }
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }
        String computed = hmacSHA512(props.getHashSecret(), hashData.toString());
        return computed.equalsIgnoreCase(received);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(2 * bytes.length);
            for (byte b : bytes) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit((b & 0xF), 16));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to compute VNPay HMAC-SHA512", e);
        }
    }
}
