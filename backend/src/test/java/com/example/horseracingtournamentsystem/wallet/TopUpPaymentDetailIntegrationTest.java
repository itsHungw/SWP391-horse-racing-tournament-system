package com.example.horseracingtournamentsystem.wallet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import com.example.horseracingtournamentsystem.wallet.config.VNPayProperties;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletTransactionRepository;
import com.example.horseracingtournamentsystem.wallet.service.TopUpService;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

/**
 * Nạp tiền VNPay: dữ liệu thanh toán trả về được lưu lại, và chủ ví xem lại được qua endpoint
 * chi tiết bút toán. Test tự ký callback bằng đúng thuật toán VNPay dùng, thay vì gọi vào
 * private method của service — nếu cách ký đổi mà quên đổi verify thì test này phải đỏ.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TopUpPaymentDetailIntegrationTest {

    private static final String SECRET = "test-secret-for-vnpay-signature";
    private static final Pattern TXN_REF = Pattern.compile("vnp_TxnRef=(\\d+)");

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired UserRoleRepository userRoleRepository;
    @Autowired WalletService walletService;
    @Autowired TopUpService topUpService;
    @Autowired TopUpOrderRepository topUpOrderRepository;
    @Autowired WalletTransactionRepository walletTransactionRepository;
    @Autowired VNPayProperties vnPayProperties;

    private User payer;
    private User stranger;
    private String payerToken;
    private String strangerToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        Role spectator = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        payer = activeUser("Top Up Payer", "topup-payer@example.com");
        stranger = activeUser("Other Spectator", "topup-stranger@example.com");
        userRoleRepository.save(UserRole.active(payer, spectator, payer));
        userRoleRepository.save(UserRole.active(stranger, spectator, stranger));
        payerToken = jwtService.generateToken(payer.getEmail(), Set.of("SPECTATOR"));
        strangerToken = jwtService.generateToken(stranger.getEmail(), Set.of("SPECTATOR"));
        vnPayProperties.setTmnCode("TESTCODE");
        vnPayProperties.setHashSecret(SECRET);
    }

    @Test
    void successfulCallbackStoresPaymentDetailsAndExposesThemToTheOwner() throws Exception {
        String txnRef = startTopUp(500_000L);

        confirm(txnRef, 500_000L, details -> {
            details.put("vnp_TransactionNo", "14567890");
            details.put("vnp_BankCode", "NCB");
            details.put("vnp_BankTranNo", "VNP14567890");
            details.put("vnp_CardType", "ATM");
            details.put("vnp_PayDate", "20260731143025");
        });

        TopUpOrder order = topUpOrderRepository.findByVnpayTxnRef(txnRef).orElseThrow();
        assertEquals("NCB", order.getVnpayBankCode());
        assertEquals("VNP14567890", order.getVnpayBankTranNo());
        assertEquals("ATM", order.getVnpayCardType());
        assertNotNull(order.getVnpayPayDate());
        assertEquals(2026, order.getVnpayPayDate().getYear());
        assertEquals(30, order.getVnpayPayDate().getMinute());

        mockMvc.perform(get("/api/v1/wallet/me/transactions/{id}", creditIdFor(order))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + payerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("TOPUP"))
                .andExpect(jsonPath("$.topUp.transactionNo").value("14567890"))
                .andExpect(jsonPath("$.topUp.bankCode").value("NCB"))
                .andExpect(jsonPath("$.topUp.bankTranNo").value("VNP14567890"))
                .andExpect(jsonPath("$.topUp.cardType").value("ATM"))
                .andExpect(jsonPath("$.topUp.txnRef").value(txnRef));
    }

    /** Một field chỉ để hiển thị không được phép làm hỏng việc ghi-có ví. */
    @Test
    void malformedPayDateIsDroppedWithoutFailingTheCredit() throws Exception {
        String txnRef = startTopUp(200_000L);

        confirm(txnRef, 200_000L, details -> {
            details.put("vnp_TransactionNo", "99887766");
            details.put("vnp_PayDate", "not-a-timestamp");
        });

        TopUpOrder order = topUpOrderRepository.findByVnpayTxnRef(txnRef).orElseThrow();
        assertNull(order.getVnpayPayDate());
        assertEquals("99887766", order.getVnpayTransactionNo());
        assertEquals(200_000L, walletService.getBalance(payer.getId()));
    }

    @Test
    void anotherUsersTransactionIsNotFound() throws Exception {
        String txnRef = startTopUp(100_000L);
        confirm(txnRef, 100_000L, details -> details.put("vnp_TransactionNo", "12121212"));
        TopUpOrder order = topUpOrderRepository.findByVnpayTxnRef(txnRef).orElseThrow();

        // 404 chứ không phải 403: 403 vẫn xác nhận bút toán đó tồn tại.
        mockMvc.perform(get("/api/v1/wallet/me/transactions/{id}", creditIdFor(order))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + strangerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminAdjustmentHidesTheInternalReasonFromTheOwner() throws Exception {
        walletService.adjust(payer, 75_000L, WalletTransactionType.ADMIN_ADJUSTMENT,
                WalletTransaction.REF_ADMIN_BALANCE_CREDIT, 4242L,
                "Admin Jane credited: VNPay callback failed, ticket #913");

        WalletTransaction credit = walletTransactionRepository
                .findByReferenceTypeAndReferenceIdAndTransactionType(
                        WalletTransaction.REF_ADMIN_BALANCE_CREDIT, 4242L,
                        WalletTransactionType.ADMIN_ADJUSTMENT)
                .orElseThrow();

        mockMvc.perform(get("/api/v1/wallet/me/transactions/{id}", credit.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + payerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Admin transferred money"))
                .andExpect(jsonPath("$.topUp").doesNotExist());
    }

    private String startTopUp(long amount) {
        String url = topUpService.createTopUp(payer, amount, "127.0.0.1");
        Matcher matcher = TXN_REF.matcher(url);
        if (!matcher.find()) {
            throw new IllegalStateException("Payment URL carried no vnp_TxnRef: " + url);
        }
        return matcher.group(1);
    }

    private Long creditIdFor(TopUpOrder order) {
        return walletTransactionRepository
                .findByReferenceTypeAndReferenceIdAndTransactionType(
                        WalletTransaction.REF_TOPUP_ORDER, order.getId(), WalletTransactionType.TOPUP)
                .orElseThrow()
                .getId();
    }

    /** Gửi IPN đã ký hợp lệ, giống hệt cách cổng gọi vào. */
    private void confirm(String txnRef, long amount, java.util.function.Consumer<Map<String, String>> extras)
            throws Exception {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Amount", String.valueOf(amount * 100));
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TmnCode", "TESTCODE");
        extras.accept(params);

        MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        params.forEach(query::add);
        query.add("vnp_SecureHash", sign(params));

        mockMvc.perform(get("/api/v1/wallet/vnpay/ipn").params(query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("00"));
    }

    /** HMAC-SHA512 trên chuỗi tham số đã sort và URL-encode — thuật toán chuẩn của VNPay. */
    private String sign(Map<String, String> params) {
        List<String> names = new ArrayList<>(params.keySet());
        Collections.sort(names);
        StringBuilder data = new StringBuilder();
        for (int i = 0; i < names.size(); i++) {
            String value = params.get(names.get(i));
            if (value == null || value.isEmpty()) {
                continue;
            }
            if (data.length() > 0) {
                data.append('&');
            }
            data.append(names.get(i)).append('=')
                    .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(2 * bytes.length);
            for (byte b : bytes) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to sign test callback", e);
        }
    }

    private User activeUser(String name, String email) {
        // Trả về instance của lần persist đầu: save() lần hai là merge, trả về một instance khác
        // mà userRoles là PersistentSet chưa khởi tạo — chạm vào ngoài session sẽ nổ lazy-init.
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        userRepository.save(user);
        return user;
    }
}
