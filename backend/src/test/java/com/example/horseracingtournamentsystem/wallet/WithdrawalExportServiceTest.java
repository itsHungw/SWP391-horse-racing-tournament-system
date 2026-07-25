package com.example.horseracingtournamentsystem.wallet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalExportFilter;
import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.repository.UserBankAccountRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalExportAuditRepository;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalExportService;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
import java.io.ByteArrayInputStream;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest(properties = {
        "wallet.withdrawal.export.max-rows=1",
        "wallet.withdrawal.export.max-scan-rows=50000",
        "app.frontend-base-url=https://admin.example.test"
})
class WithdrawalExportServiceTest {

    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired UserRepository userRepository;
    @Autowired UserBankAccountRepository bankAccountRepository;
    @Autowired WithdrawalExportAuditRepository auditRepository;
    @Autowired WalletService walletService;
    @Autowired WithdrawalService withdrawalService;
    @Autowired WithdrawalExportService service;

    private User admin;
    private User target;
    private UserBankAccount bankAccount;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "maxRows", 50_000);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "maxScanRows", 50_000);
        admin = activeUser("Export Admin", "export-admin@example.com");
        target = activeUser("Export Target", "export-target@example.com");
        bankAccount = bankAccountRepository.save(UserBankAccount.create(
                target, "TEST", "Test Bank", "0123456789", "EXPORT TARGET", "Primary"));
        walletService.adjust(
                target,
                1_000_000L,
                WalletTransactionType.TOPUP,
                WalletTransaction.REF_TOPUP_ORDER,
                99_001L,
                "Export test funding");
    }

    @Test
    void workbookSeparatesPaymentPaidAndMaskedOperationsWithoutEmbeddingReceipts() throws Exception {
        WithdrawalRequest approved = withdrawalService.createRequest(
                target, 250_000L, bankAccount.getId());
        withdrawalService.approve(approved.getId(), admin.getEmail(), true, "Reviewed");
        WithdrawalRequest paid = withdrawalService.createRequest(
                target, 150_000L, bankAccount.getId());
        withdrawalService.approve(paid.getId(), admin.getEmail(), true, "Reviewed");
        withdrawalService.markPaid(
                paid.getId(),
                admin.getEmail(),
                "FT-PAID-001",
                "Receipt verified",
                "receipt.png",
                "a".repeat(64),
                java.util.UUID.randomUUID().toString());

        byte[] bytes = service.export(WithdrawalExportFilter.empty(), admin);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            assertEquals(3, workbook.getNumberOfSheets());
            assertEquals("Payment Queue", workbook.getSheetAt(0).getSheetName());
            assertEquals("Paid Reconciliation", workbook.getSheetAt(1).getSheetName());
            assertEquals("Operations", workbook.getSheetAt(2).getSheetName());

            Sheet paymentQueue = workbook.getSheet("Payment Queue");
            Sheet paidReconciliation = workbook.getSheet("Paid Reconciliation");
            Sheet operations = workbook.getSheet("Operations");
            assertNotNull(paymentQueue);
            assertNotNull(paidReconciliation);
            assertNotNull(operations);
            assertEquals(3, paymentQueue.getLastRowNum());
            assertEquals(3, paidReconciliation.getLastRowNum());
            assertEquals(CellType.STRING, paymentQueue.getRow(3).getCell(6).getCellType());
            assertEquals("0123456789", paymentQueue.getRow(3).getCell(6).getStringCellValue());
            assertEquals("WD%06d".formatted(approved.getId()),
                    paymentQueue.getRow(3).getCell(8).getStringCellValue());
            assertEquals(
                    "https://admin.example.test/admin/withdrawals?review=" + approved.getId(),
                    paymentQueue.getRow(3).getCell(10).getHyperlink().getAddress());
            assertEquals("0123456789", paidReconciliation.getRow(3).getCell(6).getStringCellValue());
            assertEquals("FT-PAID-001", paidReconciliation.getRow(3).getCell(8).getStringCellValue());
            assertEquals(
                    "https://admin.example.test/admin/withdrawals?review=" + paid.getId(),
                    paidReconciliation.getRow(3).getCell(10).getHyperlink().getAddress());
            assertEquals(CellType.NUMERIC, operations.getRow(3).getCell(4).getCellType());
            assertTrue(operations.getRow(3).getCell(7).getStringCellValue().contains("6789"));
            assertEquals(3, operations.getPaneInformation().getHorizontalSplitPosition());
            assertTrue(((org.apache.poi.xssf.usermodel.XSSFSheet) operations)
                    .getCTWorksheet().isSetAutoFilter());
            assertEquals(0, workbook.getAllPictures().size());
        }

        assertEquals(1, auditRepository.count());
        var audit = auditRepository.findAll().getFirst();
        assertEquals(1, audit.getPaymentQueueRows());
        assertEquals(1, audit.getReconciliationRows());
        String filters = audit.getNormalizedFilters();
        assertTrue(!filters.contains("0123456789"));
    }

    @Test
    void userControlledFormulaTextIsEscaped() throws Exception {
        User formulaUser = activeUser("=HYPERLINK(\"bad\")", "formula@example.com");
        UserBankAccount formulaBank = bankAccountRepository.save(UserBankAccount.create(
                formulaUser, "SAFE", "Safe Bank", "111122223333", "FORMULA USER", "Primary"));
        walletService.adjust(
                formulaUser,
                200_000L,
                WalletTransactionType.TOPUP,
                WalletTransaction.REF_TOPUP_ORDER,
                99_002L,
                "Formula export funding");
        withdrawalService.createRequest(formulaUser, 100_000L, formulaBank.getId());

        byte[] bytes = service.export(WithdrawalExportFilter.empty(), admin);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            var cell = workbook.getSheet("Operations").getRow(3).getCell(2);
            assertEquals(CellType.STRING, cell.getCellType());
            assertTrue(cell.getStringCellValue().startsWith("'="));
        }
    }

    @Test
    void exportRejectsMoreThanConfiguredMaximumRows() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "maxRows", 1);
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.export(WithdrawalExportFilter.empty(), admin));

        assertEquals(400, exception.getStatusCode().value());
        assertEquals(0, auditRepository.count());
    }

    @Test
    void previewRejectsMoreThanConfiguredMaximumRows() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "maxRows", 1);
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.preview(WithdrawalExportFilter.empty()));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void previewLimitCountsOnlyRowsMatchingTheRiskFilter() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "maxRows", 1);
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());

        var preview = service.preview(new WithdrawalExportFilter(
                null, null, WithdrawalRiskLevel.MEDIUM, null, null, "newest"));

        assertEquals(0, preview.operationsRows());
    }

    @Test
    void riskFilteredPreviewRejectsAFilterThatExceedsTheScanLimit() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "maxScanRows", 1);
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.preview(new WithdrawalExportFilter(
                        null, null, WithdrawalRiskLevel.MEDIUM, null, null, "newest")));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void exportScansUseAStableDatabaseSnapshot() throws Exception {
        assertEquals(Isolation.REPEATABLE_READ, WithdrawalExportService.class
                .getMethod("preview", WithdrawalExportFilter.class)
                .getAnnotation(Transactional.class).isolation());
        assertEquals(Isolation.REPEATABLE_READ, WithdrawalExportService.class
                .getMethod("export", WithdrawalExportFilter.class, User.class)
                .getAnnotation(Transactional.class).isolation());
    }

    private User activeUser(String name, String email) {
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        userRepository.save(user);
        return user;
    }
}
