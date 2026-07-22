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
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest(properties = "wallet.withdrawal.export.max-rows=1")
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
    void workbookContainsMaskedOperationsAndFullReconciliationSheets() throws Exception {
        WithdrawalRequest withdrawal = withdrawalService.createRequest(
                target, 250_000L, bankAccount.getId());
        withdrawalService.approve(withdrawal.getId(), admin.getEmail(), true, "Reviewed");

        byte[] bytes = service.export(WithdrawalExportFilter.empty(), admin);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet operations = workbook.getSheet("Operations");
            Sheet reconciliation = workbook.getSheet("Bank Reconciliation");
            assertNotNull(operations);
            assertNotNull(reconciliation);
            assertEquals(CellType.NUMERIC, operations.getRow(3).getCell(4).getCellType());
            assertEquals("\u2022\u2022\u2022\u2022 6789", operations.getRow(3).getCell(7).getStringCellValue());
            assertEquals("0123456789", reconciliation.getRow(3).getCell(7).getStringCellValue());
            assertEquals(3, operations.getPaneInformation().getHorizontalSplitPosition());
            assertTrue(((org.apache.poi.xssf.usermodel.XSSFSheet) operations)
                    .getCTWorksheet().isSetAutoFilter());
        }

        assertEquals(1, auditRepository.count());
        String filters = auditRepository.findAll().getFirst().getNormalizedFilters();
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
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());
        withdrawalService.createRequest(target, 100_000L, bankAccount.getId());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.export(WithdrawalExportFilter.empty(), admin));

        assertEquals(400, exception.getStatusCode().value());
        assertEquals(0, auditRepository.count());
    }

    private User activeUser(String name, String email) {
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        userRepository.save(user);
        return user;
    }
}
