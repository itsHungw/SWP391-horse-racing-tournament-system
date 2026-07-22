package com.example.horseracingtournamentsystem.wallet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.filestorage.ObjectStorage;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionHistory;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.repository.UserBankAccountRepository;
import com.example.horseracingtournamentsystem.wallet.repository.BankDirectoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalActionHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
import java.util.List;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@AutoConfigureMockMvc
class AdminWithdrawalOperationsIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired UserRoleRepository userRoleRepository;
    @Autowired UserBankAccountRepository bankAccountRepository;
    @Autowired BankDirectoryRepository bankDirectoryRepository;
    @Autowired WithdrawalRequestRepository withdrawalRepository;
    @Autowired WithdrawalActionHistoryRepository actionHistoryRepository;
    @Autowired WalletService walletService;
    @Autowired WithdrawalService withdrawalService;
    @MockitoBean ObjectStorage objectStorage;

    private User admin;
    private User secondAdmin;
    private User target;
    private UserBankAccount bankAccount;
    private UserBankAccount otherUsersBank;
    private String targetToken;
    private String adminToken;
    private String secondAdminToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        jdbcTemplate.update("""
                insert into bank_directory
                    (code, bin, display_name, qr_supported, active, directory_version)
                values ('VCB', '970436', 'Vietcombank', true, true, 1)
                """);
        admin = activeUser("Withdrawal Admin", "withdrawal-admin@example.com");
        secondAdmin = activeUser("Payout Admin", "payout-admin@example.com");
        target = activeUser("Withdrawal Target", "withdrawal-target@example.com");
        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
        userRoleRepository.save(UserRole.active(secondAdmin, adminRole, admin));
        userRoleRepository.save(UserRole.active(target, spectatorRole, admin));
        bankAccount = bankAccountRepository.save(UserBankAccount.create(
                target, "TEST", "Test Bank", "0123456789", "WITHDRAWAL TARGET", "Primary"));
        User otherUser = activeUser("Other User", "other-user@example.com");
        otherUsersBank = bankAccountRepository.save(UserBankAccount.create(
                otherUser, "OTHER", "Other Bank", "9988776655", "OTHER USER", "Primary"));
        targetToken = jwtService.generateToken(target.getEmail(), Set.of("SPECTATOR"));
        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
        secondAdminToken = jwtService.generateToken(secondAdmin.getEmail(), Set.of("ADMIN"));
        walletService.adjust(
                target,
                1_000_000L,
                WalletTransactionType.TOPUP,
                WalletTransaction.REF_TOPUP_ORDER,
                90_001L,
                "Withdrawal operations test funding");
    }

    @Test
    void withdrawalPersistsImmutableDestinationAndOrderedActions() {
        WithdrawalRequest withdrawal = withdrawalRepository.save(WithdrawalRequest.create(
                target, 250_000L, bankAccount,
                "WITHDRAWAL TARGET · 0123456789 · Test Bank (TEST)"));
        actionHistoryRepository.save(WithdrawalActionHistory.record(
                withdrawal,
                WithdrawalActionType.APPROVED,
                WithdrawalStatus.REQUESTED,
                WithdrawalStatus.APPROVED,
                admin,
                null,
                "Reviewed account",
                null,
                WithdrawalRiskLevel.LOW,
                "[]"));

        WithdrawalRequest stored = withdrawalRepository.findById(withdrawal.getId()).orElseThrow();
        List<WithdrawalActionHistory> history = actionHistoryRepository
                .findByWithdrawalIdOrderByCreatedAtAscIdAsc(stored.getId());

        assertEquals("TEST", stored.getBankCode());
        assertEquals("0123456789", stored.getAccountNumber());
        assertEquals("WITHDRAWAL TARGET", stored.getAccountHolder());
        assertEquals(WithdrawalActionType.APPROVED, history.getFirst().getAction());
    }

    @Test
    void userCreatesWithdrawalFromOwnedSavedAccount() throws Exception {
        mockMvc.perform(post("/api/v1/wallet/withdrawals")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":250000,\"bankAccountId\":" + bankAccount.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bankCode").value("TEST"))
                .andExpect(jsonPath("$.bankInfo").value(
                        "WITHDRAWAL TARGET \u00b7 0123456789 \u00b7 Test Bank (TEST)"))
                .andExpect(jsonPath("$.maskedAccountNumber").value("\u2022\u2022\u2022\u2022 6789"));

        WithdrawalRequest created = withdrawalRepository
                .findByUserIdOrderByRequestedAtDesc(target.getId()).getFirst();
        List<WithdrawalActionHistory> history = actionHistoryRepository
                .findByWithdrawalIdOrderByCreatedAtAscIdAsc(created.getId());
        assertEquals(List.of(WithdrawalActionType.CREATED),
                history.stream().map(WithdrawalActionHistory::getAction).toList());
    }

    @Test
    void listsTrustedBanksAndSnapshotsBinFromBankCode() throws Exception {
        mockMvc.perform(get("/api/v1/wallet/bank-accounts/directory")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("VCB"))
                .andExpect(jsonPath("$[0].bin").value("970436"));

        String accountJson = mockMvc.perform(post("/api/v1/wallet/bank-accounts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"bankCode":"VCB","accountNumber":"1122334455",
                                 "accountHolder":"MAI TRAN","label":"Payout"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bankName").value("Vietcombank"))
                .andExpect(jsonPath("$.bankBin").value("970436"))
                .andReturn().getResponse().getContentAsString();

        long accountId = tools.jackson.databind.json.JsonMapper.builder().build()
                .readTree(accountJson).get("id").asLong();
        mockMvc.perform(post("/api/v1/wallet/withdrawals")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":250000,\"bankAccountId\":" + accountId + "}"))
                .andExpect(status().isOk());

        assertEquals("970436", withdrawalRepository
                .findByUserIdOrderByRequestedAtDesc(target.getId()).getFirst().getBankBin());
    }

    @Test
    void rejectsUnknownBankCode() throws Exception {
        long accountCount = bankAccountRepository.countByUserId(target.getId());

        mockMvc.perform(post("/api/v1/wallet/bank-accounts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"bankCode":"UNKNOWN","accountNumber":"1122334455",
                                 "accountHolder":"MAI TRAN","label":"Payout"}
                                """))
                .andExpect(status().isBadRequest());

        assertEquals(accountCount, bankAccountRepository.countByUserId(target.getId()));
    }

    @Test
    void userCannotWithdrawToAnotherUsersSavedAccount() throws Exception {
        mockMvc.perform(post("/api/v1/wallet/withdrawals")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":250000,\"bankAccountId\":" + otherUsersBank.getId() + "}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminSearchesAndPagesMaskedWithdrawalRows() throws Exception {
        bankAccountRepository.save(UserBankAccount.create(
                otherUsersBank.getUser(), "TEST", "Test Bank", "0123456789", "OTHER USER", "Shared"));
        withdrawalRepository.save(WithdrawalRequest.create(
                target, 250_000L, bankAccount,
                "WITHDRAWAL TARGET · 0123456789 · Test Bank (TEST)"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/admin/withdrawals")
                        .param("query", "withdrawal-target@example.com")
                        .param("status", "REQUESTED")
                        .param("risk", "HIGH")
                        .param("sort", "amount,desc")
                        .param("page", "0")
                        .param("size", "20")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].maskedAccountNumber").value("\u2022\u2022\u2022\u2022 6789"))
                .andExpect(jsonPath("$.content[0].risk.level").value("HIGH"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void summaryReturnsGlobalOperationalMetrics() throws Exception {
        WithdrawalRequest requested = withdrawalRepository.save(WithdrawalRequest.create(
                target, 200_000L, bankAccount,
                "WITHDRAWAL TARGET · 0123456789 · Test Bank (TEST)"));
        WithdrawalRequest approved = withdrawalRepository.save(WithdrawalRequest.create(
                target, 300_000L, bankAccount,
                "WITHDRAWAL TARGET · 0123456789 · Test Bank (TEST)"));
        approved.approve(admin);
        withdrawalRepository.save(approved);

        User restricted = activeUser("Restricted User", "restricted-user@example.com");
        restricted.suspend();
        userRepository.save(restricted);
        UserBankAccount restrictedBank = bankAccountRepository.save(UserBankAccount.create(
                restricted, "SAFE", "Safe Bank", "555566667777", "RESTRICTED USER", "Primary"));
        withdrawalRepository.save(WithdrawalRequest.create(
                restricted, 250_000L, restrictedBank,
                "RESTRICTED USER · 555566667777 · Safe Bank (SAFE)"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/admin/withdrawals/summary")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.needsReview").value(2))
                .andExpect(jsonPath("$.readyToPay").value(1))
                .andExpect(jsonPath("$.pendingValue").value(750_000))
                .andExpect(jsonPath("$.highRisk").value(1));
    }

    @Test
    void riskSortPlacesHighestRiskFirst() throws Exception {
        User lowRiskUser = activeUser("Low Risk User", "low-risk@example.com");
        UserBankAccount lowRiskBank = bankAccountRepository.save(UserBankAccount.create(
                lowRiskUser, "LOW", "Low Risk Bank", "111122223333", "LOW RISK USER", "Primary"));
        withdrawalRepository.save(WithdrawalRequest.create(
                lowRiskUser, 100_000L, lowRiskBank,
                "LOW RISK USER · 111122223333 · Low Risk Bank (LOW)"));

        User highRiskUser = activeUser("High Risk User", "high-risk@example.com");
        highRiskUser.suspend();
        userRepository.save(highRiskUser);
        UserBankAccount highRiskBank = bankAccountRepository.save(UserBankAccount.create(
                highRiskUser, "HIGH", "High Risk Bank", "999900001111", "HIGH RISK USER", "Primary"));
        withdrawalRepository.save(WithdrawalRequest.create(
                highRiskUser, 100_000L, highRiskBank,
                "HIGH RISK USER · 999900001111 · High Risk Bank (HIGH)"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/admin/withdrawals")
                        .param("sort", "risk_desc")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].risk.level").value("HIGH"))
                .andExpect(jsonPath("$.content[1].risk.level").value("LOW"));
    }

    @Test
    void reviewComposesUserDestinationRiskHistoryAndRecentActivity() throws Exception {
        WithdrawalRequest withdrawal = withdrawalService.createRequest(
                target, 125_000L, bankAccount.getId());

        mockMvc.perform(get("/api/v1/admin/withdrawals/{id}", withdrawal.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(withdrawal.getId()))
                .andExpect(jsonPath("$.user.email").value(target.getEmail()))
                .andExpect(jsonPath("$.wallet.balance").value(875_000))
                .andExpect(jsonPath("$.destination.accountNumber").value("0123456789"))
                .andExpect(jsonPath("$.risk.level").value("LOW"))
                .andExpect(jsonPath("$.aggregates.requestCount").value(1))
                .andExpect(jsonPath("$.recentWithdrawals[0].id").value(withdrawal.getId()))
                .andExpect(jsonPath("$.actions[0].action").value("CREATED"));
    }

    @Test
    void highRiskApprovalRequiresAcknowledgementAndInternalNote() throws Exception {
        bankAccountRepository.save(UserBankAccount.create(
                otherUsersBank.getUser(), "TEST", "Test Bank", "0123456789", "OTHER USER", "Shared"));
        WithdrawalRequest withdrawal = withdrawalService.createRequest(
                target, 100_000L, bankAccount.getId());

        mockMvc.perform(post("/api/v1/admin/withdrawals/{id}/approve", withdrawal.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"riskAcknowledged\":false,\"internalNote\":\"\"}"))
                .andExpect(status().isBadRequest());

        assertEquals(WithdrawalStatus.REQUESTED,
                withdrawalRepository.findById(withdrawal.getId()).orElseThrow().getStatus());
        assertEquals(List.of(WithdrawalActionType.CREATED), actions(withdrawal));
    }

    @Test
    void exposesPaymentInstructionOnlyAfterApproval() throws Exception {
        UserBankAccount trustedAccount = bankAccountRepository.save(UserBankAccount.create(
                target,
                bankDirectoryRepository.findByCodeIgnoreCaseAndActiveTrue("VCB").orElseThrow(),
                "1122334455",
                "WITHDRAWAL TARGET",
                "VietQR"));
        WithdrawalRequest withdrawal = withdrawalService.createRequest(
                target, 250_000L, trustedAccount.getId());

        mockMvc.perform(get("/api/v1/admin/withdrawals/{id}", withdrawal.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentInstruction").doesNotExist());

        mockMvc.perform(post("/api/v1/admin/withdrawals/{id}/approve", withdrawal.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"riskAcknowledged\":true,\"internalNote\":\"Reviewed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentInstruction.available").value(true))
                .andExpect(jsonPath("$.paymentInstruction.payload").isNotEmpty())
                .andExpect(jsonPath("$.paymentInstruction.transferContent")
                        .value(org.hamcrest.Matchers.matchesPattern("WD\\d{6,}")));
    }

    @Test
    void markPaidRequiresTransferReferenceAndPreservesApprover() throws Exception {
        WithdrawalRequest withdrawal = withdrawalService.createRequest(
                target, 100_000L, bankAccount.getId());

        mockMvc.perform(post("/api/v1/admin/withdrawals/{id}/approve", withdrawal.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"riskAcknowledged\":true,\"internalNote\":\"Reviewed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        MockMultipartFile receipt = new MockMultipartFile(
                "receipt", "receipt.png", MediaType.IMAGE_PNG_VALUE, syntheticPng());
        mockMvc.perform(multipart("/api/v1/admin/withdrawals/{id}/mark-paid", withdrawal.getId())
                        .file(receipt)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + secondAdminToken)
                        .param("transferReference", "")
                        .param("internalNote", "Transferred")
                        .param("idempotencyKey", UUID.randomUUID().toString()))
                .andExpect(status().isBadRequest());

        mockMvc.perform(multipart("/api/v1/admin/withdrawals/{id}/mark-paid", withdrawal.getId())
                        .file(receipt)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + secondAdminToken)
                        .param("transferReference", "BANK-20260721-001")
                        .param("internalNote", "Transferred")
                        .param("idempotencyKey", UUID.randomUUID().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        List<WithdrawalActionHistory> history = actionHistoryRepository
                .findByWithdrawalIdOrderByCreatedAtAscIdAsc(withdrawal.getId());
        assertEquals(List.of(
                        WithdrawalActionType.CREATED,
                        WithdrawalActionType.APPROVED,
                        WithdrawalActionType.MARKED_PAID),
                history.stream().map(WithdrawalActionHistory::getAction).toList());
        assertEquals(admin.getId(), history.get(1).getActor().getId());
        assertEquals(secondAdmin.getId(), history.get(2).getActor().getId());
        assertEquals("BANK-20260721-001", history.get(2).getTransferReference());
    }

    @Test
    void rejectionSeparatesPublicReasonAndInternalNoteAndConflictsOnceTerminal() throws Exception {
        WithdrawalRequest withdrawal = withdrawalService.createRequest(
                target, 100_000L, bankAccount.getId());

        mockMvc.perform(post("/api/v1/admin/withdrawals/{id}/reject", withdrawal.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"publicReason\":\"Destination could not be verified\","
                                + "\"internalNote\":\"Name mismatch in manual review\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        mockMvc.perform(post("/api/v1/admin/withdrawals/{id}/reject", withdrawal.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + secondAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"publicReason\":\"Duplicate action\",\"internalNote\":\"No\"}"))
                .andExpect(status().isConflict());

        List<WithdrawalActionHistory> history = actionHistoryRepository
                .findByWithdrawalIdOrderByCreatedAtAscIdAsc(withdrawal.getId());
        assertEquals(List.of(WithdrawalActionType.CREATED, WithdrawalActionType.REJECTED),
                history.stream().map(WithdrawalActionHistory::getAction).toList());
        assertEquals("Destination could not be verified", history.get(1).getPublicReason());
        assertEquals("Name mismatch in manual review", history.get(1).getInternalNote());
        assertEquals(1_000_000L, walletService.getBalance(target.getId()));
    }

    @Test
    void userCancellationAppendsHistoryAndRefundsOnlyOnce() throws Exception {
        WithdrawalRequest withdrawal = withdrawalService.createRequest(
                target, 100_000L, bankAccount.getId());

        mockMvc.perform(post("/api/v1/wallet/withdrawals/{id}/cancel", withdrawal.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        mockMvc.perform(post("/api/v1/wallet/withdrawals/{id}/cancel", withdrawal.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken))
                .andExpect(status().isConflict());

        assertEquals(List.of(WithdrawalActionType.CREATED, WithdrawalActionType.CANCELLED),
                actions(withdrawal));
        assertEquals(1_000_000L, walletService.getBalance(target.getId()));
    }

    @Test
    void exportPreviewAndDownloadUseCurrentFiltersAndNoStoreHeaders() throws Exception {
        WithdrawalRequest withdrawal = withdrawalService.createRequest(
                target, 100_000L, bankAccount.getId());
        withdrawalService.approve(withdrawal.getId(), admin.getEmail(), true, "Reviewed");

        mockMvc.perform(get("/api/v1/admin/withdrawals/export/preview")
                        .param("status", "APPROVED")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operationsRows").value(1))
                .andExpect(jsonPath("$.paymentQueueRows").value(1))
                .andExpect(jsonPath("$.paidReconciliationRows").value(0))
                .andExpect(jsonPath("$.containsSensitiveData").value(true));

        mockMvc.perform(get("/api/v1/admin/withdrawals/export")
                        .param("status", "APPROVED")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.matchesPattern(
                                "attachment; filename=\\\"withdrawals-.*\\.xlsx\\\"")));
    }

    private List<WithdrawalActionType> actions(WithdrawalRequest withdrawal) {
        return actionHistoryRepository.findByWithdrawalIdOrderByCreatedAtAscIdAsc(withdrawal.getId())
                .stream()
                .map(WithdrawalActionHistory::getAction)
                .toList();
    }

    private User activeUser(String name, String email) {
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        userRepository.save(user);
        return user;
    }

    private byte[] syntheticPng() {
        return Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z6l8AAAAASUVORK5CYII=");
    }
}
