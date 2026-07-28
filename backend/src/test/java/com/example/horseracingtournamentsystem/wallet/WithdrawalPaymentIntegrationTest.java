package com.example.horseracingtournamentsystem.wallet;

import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.filestorage.ObjectStorage;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.repository.BankDirectoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.UserBankAccountRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletTransactionRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalActionHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalPaymentService;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.springframework.web.server.ResponseStatusException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class WithdrawalPaymentIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired UserRoleRepository userRoleRepository;
    @Autowired BankDirectoryRepository bankDirectoryRepository;
    @Autowired UserBankAccountRepository bankAccountRepository;
    @Autowired WithdrawalRequestRepository withdrawalRepository;
    @Autowired WithdrawalActionHistoryRepository actionHistoryRepository;
    @Autowired WalletTransactionRepository walletTransactionRepository;
    @Autowired WalletService walletService;
    @Autowired WithdrawalService withdrawalService;
    @Autowired WithdrawalPaymentService paymentService;

    @MockitoBean ObjectStorage objectStorage;

    private User admin;
    private User target;
    private UserBankAccount bankAccount;
    private String adminToken;
    private String targetToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        jdbcTemplate.update("""
                insert into bank_directory
                    (code, bin, display_name, qr_supported, active, directory_version)
                values ('VCB', '970436', 'Vietcombank', true, true, 1)
                """);

        admin = activeUser("Payout Admin", "payout-admin@example.com");
        target = activeUser("Withdrawal Target", "withdrawal-target@example.com");
        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
        userRoleRepository.save(UserRole.active(target, spectatorRole, admin));
        bankAccount = bankAccountRepository.save(UserBankAccount.create(
                target,
                bankDirectoryRepository.findByCodeIgnoreCaseAndActiveTrue("VCB").orElseThrow(),
                "0123456789",
                "WITHDRAWAL TARGET",
                "Primary"));
        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
        targetToken = jwtService.generateToken(target.getEmail(), Set.of("SPECTATOR"));
        walletService.adjust(
                target,
                1_000_000L,
                WalletTransactionType.TOPUP,
                WalletTransaction.REF_TOPUP_ORDER,
                91_001L,
                "Withdrawal payment test funding");
    }

    @Test
    void approvedWithdrawalIsPaidOnceWithPrivateReceipt() throws Exception {
        WithdrawalRequest approved = approvedWithdrawal(250_000L);
        String key = UUID.randomUUID().toString();

        String response = mockMvc.perform(paymentRequest(approved, key, "FT-20260723-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.paymentEvidence.transferReference")
                        .value("FT-20260723-001"))
                .andExpect(jsonPath("$.paymentEvidence.receiptUrl")
                        .value(startsWith("/api/v1/files/private/")))
                .andReturn().getResponse().getContentAsString();

        mockMvc.perform(paymentRequest(approved, key, "FT-20260723-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        assertEquals(1, actionHistoryRepository
                .findByWithdrawalIdOrderByCreatedAtAscIdAsc(approved.getId()).stream()
                .filter(action -> action.getAction() == WithdrawalActionType.MARKED_PAID)
                .count());
        verify(objectStorage, times(1)).upload(anyString(), any(), anyLong(), anyString());

        String receiptUrl = com.jayway.jsonpath.JsonPath.read(response, "$.paymentEvidence.receiptUrl");
        mockMvc.perform(get(receiptUrl)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void paymentRequiresReceiptAndTransferReference() throws Exception {
        WithdrawalRequest approved = approvedWithdrawal(100_000L);

        mockMvc.perform(multipart("/api/v1/admin/withdrawals/{id}/mark-paid", approved.getId())
                        .file(receipt())
                        .param("transferReference", " ")
                        .param("idempotencyKey", UUID.randomUUID().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        mockMvc.perform(multipart("/api/v1/admin/withdrawals/{id}/mark-paid", approved.getId())
                        .param("transferReference", "FT-001")
                        .param("idempotencyKey", UUID.randomUUID().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void differentPaymentAttemptAfterPaidConflictsAndDeletesItsOrphan() throws Exception {
        WithdrawalRequest approved = approvedWithdrawal(100_000L);

        mockMvc.perform(paymentRequest(approved, UUID.randomUUID().toString(), "FT-001"))
                .andExpect(status().isOk());
        mockMvc.perform(paymentRequest(approved, UUID.randomUUID().toString(), "FT-002"))
                .andExpect(status().isConflict());

        verify(objectStorage, times(2)).upload(anyString(), any(), anyLong(), anyString());
        verify(objectStorage, times(1)).delete(anyString());
    }

    @Test
    void concurrentRetryCreatesOnePaymentAudit() throws Exception {
        WithdrawalRequest approved = approvedWithdrawal(100_000L);
        String key = UUID.randomUUID().toString();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> {
                confirmWhenReleased(approved.getId(), key, ready, start);
                return null;
            });
            var second = executor.submit(() -> {
                confirmWhenReleased(approved.getId(), key, ready, start);
                return null;
            });
            ready.await(5, TimeUnit.SECONDS);
            start.countDown();
            first.get(15, TimeUnit.SECONDS);
            second.get(15, TimeUnit.SECONDS);
        }

        assertEquals(WithdrawalStatus.PAID,
                withdrawalRepository.findById(approved.getId()).orElseThrow().getStatus());
        assertEquals(1, actionHistoryRepository
                .findByWithdrawalIdOrderByCreatedAtAscIdAsc(approved.getId()).stream()
                .filter(action -> action.getAction() == WithdrawalActionType.MARKED_PAID)
                .count());
    }

    @Test
    void rejectingApprovedWithdrawalRefundsExactlyOnce() throws Exception {
        WithdrawalRequest approved = approvedWithdrawal(100_000L);

        mockMvc.perform(post("/api/v1/admin/withdrawals/{id}/reject", approved.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"publicReason\":\"Destination is invalid\","
                                + "\"internalNote\":\"No transfer was made\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/admin/withdrawals/{id}/reject", approved.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"publicReason\":\"Destination is invalid\","
                                + "\"internalNote\":\"Bank rejected the destination\","
                                + "\"noTransferConfirmed\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
        mockMvc.perform(post("/api/v1/admin/withdrawals/{id}/reject", approved.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"publicReason\":\"Retry\",\"internalNote\":\"Retry\"}"))
                .andExpect(status().isConflict());

        assertEquals(1_000_000L, walletService.getBalance(target.getId()));
        assertEquals(1, walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(target.getId()).stream()
                .filter(item -> item.getTransactionType() == WalletTransactionType.WITHDRAWAL_REFUND)
                .count());
    }

    @Test
    void duplicateTransferReferenceCannotPayAnotherWithdrawal() throws Exception {
        WithdrawalRequest first = approvedWithdrawal(100_000L);
        WithdrawalRequest second = approvedWithdrawal(100_000L);

        mockMvc.perform(paymentRequest(first, UUID.randomUUID().toString(), "FT-DUPLICATE"))
                .andExpect(status().isOk());
        mockMvc.perform(paymentRequest(
                        second,
                        UUID.randomUUID().toString(),
                        "FT-DUPLICATE",
                        receiptWithSuffix((byte) 1)))
                .andExpect(status().isConflict());

        assertEquals(WithdrawalStatus.APPROVED,
                withdrawalRepository.findById(second.getId()).orElseThrow().getStatus());
    }

    @Test
    void duplicateReceiptCannotPayAnotherWithdrawal() throws Exception {
        WithdrawalRequest first = approvedWithdrawal(100_000L);
        WithdrawalRequest second = approvedWithdrawal(100_000L);

        mockMvc.perform(paymentRequest(first, UUID.randomUUID().toString(), "FT-FIRST"))
                .andExpect(status().isOk());
        mockMvc.perform(paymentRequest(second, UUID.randomUUID().toString(), "FT-SECOND"))
                .andExpect(status().isConflict());

        assertEquals(WithdrawalStatus.APPROVED,
                withdrawalRepository.findById(second.getId()).orElseThrow().getStatus());
    }

    @Test
    void concurrentPaymentsCannotReuseEvidenceAcrossWithdrawals() throws Exception {
        WithdrawalRequest first = approvedWithdrawal(100_000L);
        WithdrawalRequest second = approvedWithdrawal(100_000L);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try (var executor = Executors.newFixedThreadPool(2)) {
            var firstResult = executor.submit(() -> confirmSharedEvidence(first.getId(), ready, start));
            var secondResult = executor.submit(() -> confirmSharedEvidence(second.getId(), ready, start));
            ready.await(5, TimeUnit.SECONDS);
            start.countDown();

            assertEquals(Set.of(200, 409), Set.of(
                    firstResult.get(15, TimeUnit.SECONDS),
                    secondResult.get(15, TimeUnit.SECONDS)));
        }
    }

    private int confirmSharedEvidence(Long withdrawalId, CountDownLatch ready, CountDownLatch start)
            throws Exception {
        ready.countDown();
        start.await(5, TimeUnit.SECONDS);
        try {
            paymentService.confirm(
                    withdrawalId,
                    admin.getEmail(),
                    "ft-race",
                    "Receipt checked",
                    false,
                    UUID.randomUUID().toString(),
                    receipt());
            return 200;
        } catch (ResponseStatusException exception) {
            return exception.getStatusCode().value();
        }
    }

    private void confirmWhenReleased(
            Long withdrawalId,
            String key,
            CountDownLatch ready,
            CountDownLatch start
    ) throws Exception {
        ready.countDown();
        start.await(5, TimeUnit.SECONDS);
        paymentService.confirm(
                withdrawalId,
                admin.getEmail(),
                "FT-CONCURRENT",
                "Receipt checked",
                false,
                key,
                receipt());
    }

    private org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder paymentRequest(
            WithdrawalRequest withdrawal,
            String key,
            String reference
    ) {
        return paymentRequest(withdrawal, key, reference, receipt());
    }

    private org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder paymentRequest(
            WithdrawalRequest withdrawal,
            String key,
            String reference,
            MockMultipartFile receipt
    ) {
        return multipart("/api/v1/admin/withdrawals/{id}/mark-paid", withdrawal.getId())
                .file(receipt)
                .param("transferReference", reference)
                .param("internalNote", "Receipt checked")
                .param("mismatchAcknowledged", "false")
                .param("idempotencyKey", key)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken);
    }

    private WithdrawalRequest approvedWithdrawal(long amount) {
        WithdrawalRequest withdrawal = withdrawalService.createRequest(target, amount, bankAccount.getId());
        withdrawalService.approve(withdrawal.getId(), admin.getEmail(), true, "Reviewed");
        return withdrawalRepository.findById(withdrawal.getId()).orElseThrow();
    }

    private MockMultipartFile receipt() {
        return new MockMultipartFile(
                "receipt", "receipt.png", MediaType.IMAGE_PNG_VALUE, syntheticPng());
    }

    private MockMultipartFile receiptWithSuffix(byte suffix) {
        byte[] original = syntheticPng();
        byte[] distinct = java.util.Arrays.copyOf(original, original.length + 1);
        distinct[distinct.length - 1] = suffix;
        return new MockMultipartFile(
                "receipt", "receipt-distinct.png", MediaType.IMAGE_PNG_VALUE, distinct);
    }

    private byte[] syntheticPng() {
        return Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z6l8AAAAASUVORK5CYII=");
    }

    private User activeUser(String name, String email) {
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        userRepository.save(user);
        return user;
    }
}
