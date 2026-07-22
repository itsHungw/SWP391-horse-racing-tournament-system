# Admin Withdrawal Direct Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin review, approve, pay by VietQR, OCR a private receipt, and confirm a withdrawal without closing the review modal.

**Architecture:** Extend the existing Spring `Controller -> Service -> Repository` flow and the current React withdrawal modal. Reuse `WithdrawalService`, pessimistic locking, action history, and `FileStorageService`; add only a trusted bank directory, a focused VietQR service, a small payment orchestration service, and focused payment UI/OCR modules.

**Tech Stack:** Java 21, Spring Boot 4.0.6, Spring Data JPA, Flyway/PostgreSQL, existing private S3-compatible storage, React 19, TypeScript 5.8, Axios, Vitest, Testing Library, `qrcode.react`, and `tesseract.js`.

---

## Scope and over-engineering guardrails

- Do not introduce Hexagonal Architecture, CQRS, a workflow engine, or a frontend state-machine library.
- Do not add a one-to-one payment-evidence entity. Store the single successful receipt reference directly on `withdrawal_requests` and reuse `stored_files` metadata.
- Do not add an external QR or OCR API.
- Do not write bank-specific OCR parsers in the first version. Start with one generic, tested extractor.
- Do not replace the existing withdrawal risk, audit, export, notification, or locking services.
- Add interfaces only where the project already has one (`ObjectStorage`); otherwise use focused concrete services.
- Keep existing Excel export as reconciliation support. Do not add batch transfer execution.

## File map

### Backend files to create

- `backend/src/main/resources/db/migration/V31__bank_directory_and_withdrawal_bin.sql` — trusted bank BIN directory and immutable BIN snapshots.
- `backend/src/main/resources/db/migration/V32__withdrawal_payment_receipts.sql` — payment reference, private receipt link, checksum, and idempotency columns.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/BankDirectory.java` — active bank code/BIN/name record.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/BankDirectoryRepository.java` — active lookup and ordered directory list.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/BankDirectoryResponse.java` — trusted bank selector response.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalPaymentInstructionResponse.java` — QR/manual payment contract.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalPaymentEvidenceResponse.java` — paid reference and admin-only receipt URL.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/config/WithdrawalPaymentProperties.java` — transfer template, receipt size/types, and orphan expiry.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/VietQrService.java` — EMVCo/VietQR payload creation.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalReceiptService.java` — signature validation, hash, private storage, and deletion.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalPaymentService.java` — one-use-case payment orchestration and idempotency.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalReceiptCleanupService.java` — safety-net orphan cleanup.
- `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/VietQrServiceTest.java` — payload structure/CRC/fallback tests.
- `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalPaymentIntegrationTest.java` — multipart, receipt, authorization, idempotency, concurrency, and refund tests.

### Backend files to modify

- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/config/WithdrawalOperationsConfiguration.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/BankAccountController.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/AdminWithdrawalController.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/CreateBankAccountRequest.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/BankAccountResponse.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/AdminWithdrawalReviewResponse.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalResponse.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/UserBankAccount.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalRequest.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalRequestRepository.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/BankAccountService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/AdminWithdrawalReviewService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/StoredFileMetadataRepository.java`
- `backend/src/main/resources/application.yml`
- `backend/src/test/resources/application.yml`
- `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java`

### Frontend files to create

- `frontend/src/pages/admin/withdrawals/payment/receiptOcrConfig.ts` — validated named OCR thresholds.
- `frontend/src/pages/admin/withdrawals/payment/receiptFieldExtractor.ts` — pure generic receipt text parser.
- `frontend/src/pages/admin/withdrawals/payment/receiptOcr.ts` — lazily created Tesseract worker wrapper.
- `frontend/src/pages/admin/withdrawals/payment/VietQrCard.tsx` — render, copy, and download QR.
- `frontend/src/pages/admin/withdrawals/payment/ReceiptUploader.tsx` — private image selection and local preview.
- `frontend/src/pages/admin/withdrawals/payment/ReceiptOcrResult.tsx` — candidates, match status, and mismatch acknowledgement.
- `frontend/src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.tsx` — payment-step composition.
- `frontend/src/pages/admin/withdrawals/payment/useWithdrawalPayment.ts` — OCR/upload/confirm state and stable idempotency key.
- `frontend/src/pages/admin/withdrawals/payment/receiptFieldExtractor.test.ts` — synthetic parsing tests.
- `frontend/src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx` — QR, OCR, fallback, and submit behavior.
- `frontend/src/pages/admin/withdrawals/WithdrawalDecisionPanel.tsx` — extracted existing approve/reject panel.

### Frontend files to modify

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/src/types/wallet.ts`
- `frontend/src/api/walletApi.ts`
- `frontend/src/api/adminWalletApi.ts`
- `frontend/src/pages/wallet/banks.ts`
- `frontend/src/pages/wallet/SavedAccounts.tsx`
- `frontend/src/pages/wallet/WithdrawSheet.tsx`
- `frontend/src/pages/wallet/WalletPage.test.tsx`
- `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.tsx`
- `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx`
- `frontend/src/pages/admin/withdrawals/WithdrawalOperationsTable.tsx`
- `frontend/src/pages/admin/AdminWithdrawalsPage.tsx`
- `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx`

---

### Task 1: Make the bank directory trusted and snapshot the bank BIN

**Files:**
- Create: `backend/src/main/resources/db/migration/V31__bank_directory_and_withdrawal_bin.sql`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/BankDirectory.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/BankDirectoryRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/BankDirectoryResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/BankAccountController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/CreateBankAccountRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/BankAccountResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/UserBankAccount.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/BankAccountService.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java`

- [ ] **Step 1: Write failing trusted-directory tests**

Add integration tests that prove the server owns bank metadata and the withdrawal snapshots the BIN:

```java
@Test
void listsTrustedBanksAndSnapshotsBinFromBankCode() throws Exception {
    mockMvc.perform(get("/api/v1/wallet/bank-accounts/directory")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].code").isNotEmpty())
            .andExpect(jsonPath("$[0].bin").isNotEmpty());

    String accountJson = mockMvc.perform(post("/api/v1/wallet/bank-accounts")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"bankCode":"VCB","accountNumber":"0123456789",
                             "accountHolder":"MAI TRAN","label":"Primary"}
                            """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.bankName").value("Vietcombank"))
            .andExpect(jsonPath("$.bankBin").value("970436"))
            .andReturn().getResponse().getContentAsString();

    long accountId = objectMapper.readTree(accountJson).get("id").asLong();
    mockMvc.perform(post("/api/v1/wallet/withdrawals")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"amount\":250000,\"bankAccountId\":" + accountId + "}"))
            .andExpect(status().isOk());

    assertEquals("970436", withdrawalRepository.findAll().getFirst().getBankBin());
}
```

Add a second test sending `bankCode: "UNKNOWN"` and expect `400` without saving an account.

- [ ] **Step 2: Run the tests and verify the new contract is absent**

Run:

```powershell
cd backend
.\mvnw.cmd "-Dtest=AdminWithdrawalOperationsIntegrationTest#listsTrustedBanksAndSnapshotsBinFromBankCode,AdminWithdrawalOperationsIntegrationTest#rejectsUnknownBankCode" test
```

Expected: FAIL because the directory endpoint, `bankBin`, and trusted lookup do not exist.

- [ ] **Step 3: Add V31 with the complete supported bank dataset**

Create the table, seed the same codes currently used by the frontend, and backfill existing records:

```sql
CREATE TABLE bank_directory (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    bin VARCHAR(12) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    qr_supported BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    directory_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bank_directory (code, bin, display_name) VALUES
('VCB','970436','Vietcombank'), ('TCB','970407','Techcombank'),
('BIDV','970418','BIDV'), ('CTG','970415','VietinBank'),
('AGR','970405','Agribank'), ('ACB','970416','ACB'),
('MB','970422','MB Bank'), ('VPB','970432','VPBank'),
('STB','970403','Sacombank'), ('TPB','970423','TPBank'),
('HDB','970437','HDBank'), ('VIB','970441','VIB'),
('SHB','970443','SHB'), ('OCB','970448','OCB'),
('MSB','970426','MSB'), ('SEAB','970440','SeABank'),
('EIB','970431','Eximbank'), ('NAB','970428','Nam A Bank'),
('LPB','970449','LPBank'), ('SCB','970429','SCB'),
('BAB','970409','Bac A Bank'), ('ABB','970425','ABBANK'),
('PVCB','970412','PVcomBank'), ('VAB','970427','VietABank'),
('BVB','970438','BaoViet Bank'), ('NCB','970419','NCB'),
('KLB','970452','KienlongBank'), ('VBB','970433','VietBank'),
('SGICB','970400','SaigonBank'), ('GPB','970408','GPBank'),
('DOB','970406','DongA Bank'), ('OCEANBANK','970414','OceanBank'),
('VRB','970421','VRB'), ('WVN','970457','Woori'),
('SVB','970424','Shinhan Bank'), ('HLB','970442','Hong Leong'),
('SCVN','970410','Standard Chartered'), ('PBVN','970439','Public Bank'),
('IVB','970434','Indovina'), ('UOB','970458','UOB'),
('CIMB','422589','CIMB'), ('VCCB','970454','BVBank'),
('CAKE','546034','CAKE'), ('TIMO','963388','Timo');

ALTER TABLE bank_accounts ADD COLUMN bank_directory_id BIGINT NULL;
ALTER TABLE bank_accounts ADD COLUMN bank_bin VARCHAR(12) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN bank_bin VARCHAR(12) NULL;

ALTER TABLE bank_accounts
    ADD CONSTRAINT fk_bank_account_directory
    FOREIGN KEY (bank_directory_id) REFERENCES bank_directory(id);

UPDATE bank_accounts account
SET bank_directory_id = directory.id,
    bank_bin = directory.bin,
    bank_name = directory.display_name
FROM bank_directory directory
WHERE UPPER(account.bank_code) = directory.code;

UPDATE withdrawal_requests withdrawal
SET bank_bin = directory.bin
FROM bank_directory directory
WHERE UPPER(withdrawal.bank_code) = directory.code;
```

- [ ] **Step 4: Add the minimal entity/repository/response**

Use one entity and repository; do not add a separate directory service:

```java
@Entity
@Table(name = "bank_directory")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BankDirectory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 20) private String code;
    @Column(nullable = false, unique = true, length = 12) private String bin;
    @Column(name = "display_name", nullable = false, length = 100) private String displayName;
    @Column(name = "qr_supported", nullable = false) private boolean qrSupported;
    @Column(nullable = false) private boolean active;
    @Column(name = "directory_version", nullable = false) private int directoryVersion;
}
```

```java
public interface BankDirectoryRepository extends JpaRepository<BankDirectory, Long> {
    Optional<BankDirectory> findByCodeIgnoreCaseAndActiveTrue(String code);
    List<BankDirectory> findByActiveTrueOrderByDisplayNameAsc();
}
```

```java
public record BankDirectoryResponse(String code, String bin, String name, boolean qrSupported) {
    public static BankDirectoryResponse from(BankDirectory bank) {
        return new BankDirectoryResponse(
                bank.getCode(), bank.getBin(), bank.getDisplayName(), bank.isQrSupported());
    }
}
```

- [ ] **Step 5: Resolve bank metadata server-side and snapshot it**

Change `CreateBankAccountRequest` to accept only user-entered data plus the selected code:

```java
public record CreateBankAccountRequest(
        @NotBlank @Size(max = 20) String bankCode,
        @NotBlank @Size(max = 40) String accountNumber,
        @NotBlank @Size(max = 150) String accountHolder,
        @Size(max = 80) String label
) {}
```

Inject `BankDirectoryRepository` into `BankAccountService`, load by active code, and pass the trusted entity into `UserBankAccount.create`. Add `bankDirectory` and `bankBin` fields to `UserBankAccount`. Add `bankBin` to `BankAccountResponse`.

Add `bankBin` to `WithdrawalRequest` and snapshot it in the structured `create` method:

```java
request.bankBin = bankAccount.getBankBin();
```

Expose the directory through the existing controller:

```java
@GetMapping("/directory")
public List<BankDirectoryResponse> directory() {
    return bankAccountService.listActiveBanks().stream()
            .map(BankDirectoryResponse::from)
            .toList();
}
```

Add `@Valid` to the existing bank-account `@RequestBody` so the record constraints run.

- [ ] **Step 6: Run focused and existing withdrawal tests**

Run:

```powershell
cd backend
.\mvnw.cmd "-Dtest=AdminWithdrawalOperationsIntegrationTest" test
```

Expected: PASS with zero failures/errors.

- [ ] **Step 7: Commit trusted bank metadata**

```powershell
git add backend/src/main/resources/db/migration/V31__bank_directory_and_withdrawal_bin.sql backend/src/main/java/com/example/horseracingtournamentsystem/wallet backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java
git commit -m "feat: add trusted payout bank directory"
```

### Task 2: Generate VietQR instructions after approval

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/config/WithdrawalPaymentProperties.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalPaymentInstructionResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/VietQrService.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/VietQrServiceTest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/config/WithdrawalOperationsConfiguration.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/AdminWithdrawalReviewResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/AdminWithdrawalReviewService.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application.yml`

- [ ] **Step 1: Write failing payload and review-contract tests**

Create service tests that inspect nested TLV fields instead of copying the implementation:

```java
@Test
void buildsTrustedVietQrPayloadFromApprovedSnapshot() {
    WithdrawalRequest request = mock(WithdrawalRequest.class);
    when(request.getId()).thenReturn(123L);
    when(request.getAmount()).thenReturn(250_000L);
    when(request.getBankBin()).thenReturn("970436");
    when(request.getBankCode()).thenReturn("VCB");
    when(request.getBankName()).thenReturn("Vietcombank");
    when(request.getAccountNumber()).thenReturn("0123456789");
    when(request.getAccountHolder()).thenReturn("MAI TRAN");

    WithdrawalPaymentInstructionResponse result = service.instructionFor(request);

    assertTrue(result.available());
    assertEquals("WD000123", result.transferContent());
    assertEquals("970436", tlv(tlv(result.payload(), "38"), "01", "00"));
    assertEquals("0123456789", tlv(tlv(result.payload(), "38"), "01", "01"));
    assertEquals("250000", tlv(result.payload(), "54"));
    assertEquals("704", tlv(result.payload(), "53"));
    assertTrue(validCrc(result.payload()));
}

@Test
void returnsManualFallbackWithoutTrustedBin() {
    WithdrawalRequest request = mock(WithdrawalRequest.class);
    when(request.getId()).thenReturn(124L);
    when(request.getAmount()).thenReturn(250_000L);
    when(request.getBankBin()).thenReturn(null);
    when(request.getAccountNumber()).thenReturn("0123456789");
    WithdrawalPaymentInstructionResponse result = service.instructionFor(request);
    assertFalse(result.available());
    assertEquals("BANK_BIN_UNAVAILABLE", result.unavailableReason());
    assertNull(result.payload());
}
```

Use a tiny test-only TLV reader and independent CRC assertion:

```java
private String tlv(String payload, String... path) {
    String current = payload;
    for (String wanted : path) {
        int offset = 0;
        String found = null;
        while (offset + 4 <= current.length()) {
            String id = current.substring(offset, offset + 2);
            int length = Integer.parseInt(current.substring(offset + 2, offset + 4));
            String value = current.substring(offset + 4, offset + 4 + length);
            if (id.equals(wanted)) { found = value; break; }
            offset += 4 + length;
        }
        if (found == null) throw new AssertionError("Missing TLV field " + wanted);
        current = found;
    }
    return current;
}

private boolean validCrc(String payload) {
    String input = payload.substring(0, payload.length() - 4);
    return payload.endsWith(referenceCrc16(input));
}

private String referenceCrc16(String input) {
    int crc = 0xFFFF;
    for (byte item : input.getBytes(StandardCharsets.UTF_8)) {
        crc ^= (item & 0xFF) << 8;
        for (int bit = 0; bit < 8; bit++) {
            crc = (crc & 0x8000) == 0 ? crc << 1 : (crc << 1) ^ 0x1021;
            crc &= 0xFFFF;
        }
    }
    return "%04X".formatted(crc);
}
```

Add an integration assertion that `POST /{id}/approve` returns `$.paymentInstruction.payload`, while a requested review returns `paymentInstruction: null`.

- [ ] **Step 2: Run tests and verify failure**

```powershell
cd backend
.\mvnw.cmd "-Dtest=VietQrServiceTest,AdminWithdrawalOperationsIntegrationTest" test
```

Expected: test compilation fails because payment instruction types/service are absent.

- [ ] **Step 3: Add validated payment configuration**

```java
@Validated
@ConfigurationProperties(prefix = "wallet.withdrawal.payment")
public record WithdrawalPaymentProperties(
        @NotBlank String transferContentTemplate,
        @Min(1) long receiptMaxBytes,
        @NotEmpty Set<String> allowedReceiptTypes,
        @NotNull Duration orphanReceiptExpiry
) {}
```

Enable it beside risk properties and add defaults:

```yaml
wallet:
  withdrawal:
    payment:
      transfer-content-template: ${WALLET_WITHDRAWAL_TRANSFER_TEMPLATE:WD{withdrawalId}}
      receipt-max-bytes: ${WALLET_WITHDRAWAL_RECEIPT_MAX_BYTES:5242880}
      allowed-receipt-types: image/jpeg,image/png,image/webp
      orphan-receipt-expiry: ${WALLET_WITHDRAWAL_ORPHAN_RECEIPT_EXPIRY:24h}
      orphan-cleanup-cron: "${WALLET_WITHDRAWAL_ORPHAN_CLEANUP_CRON:0 30 3 * * *}"
```

- [ ] **Step 4: Implement the focused VietQR builder**

Keep EMV field assembly and CRC inside one service:

```java
@Service
@RequiredArgsConstructor
public class VietQrService {
    private static final String NAPAS_GUID = "A000000727";
    private static final String ACCOUNT_TRANSFER_SERVICE = "QRIBFTTA";
    private final WithdrawalPaymentProperties properties;

    public WithdrawalPaymentInstructionResponse instructionFor(WithdrawalRequest request) {
        String content = properties.transferContentTemplate()
                .replace("{withdrawalId}", "%06d".formatted(request.getId()));
        if (request.getBankBin() == null || request.getAccountNumber() == null) {
            return WithdrawalPaymentInstructionResponse.manual(
                    "BANK_BIN_UNAVAILABLE", content, request);
        }
        String beneficiary = field("00", request.getBankBin())
                + field("01", request.getAccountNumber());
        String merchantAccount = field("00", NAPAS_GUID)
                + field("01", beneficiary)
                + field("02", ACCOUNT_TRANSFER_SERVICE);
        String withoutCrc = field("00", "01")
                + field("01", "12")
                + field("38", merchantAccount)
                + field("53", "704")
                + field("54", Long.toString(request.getAmount()))
                + field("58", "VN")
                + field("62", field("08", content))
                + "6304";
        return WithdrawalPaymentInstructionResponse.qr(
                withoutCrc + crc16(withoutCrc), content, request);
    }

    private String field(String id, String value) {
        int length = value.getBytes(StandardCharsets.UTF_8).length;
        if (length > 99) throw new IllegalArgumentException("VietQR field is too long: " + id);
        return id + "%02d".formatted(length) + value;
    }

    private String crc16(String value) {
        int crc = 0xFFFF;
        for (byte item : value.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (item & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return "%04X".formatted(crc);
    }
}
```

`WithdrawalPaymentInstructionResponse` contains `available`, `unavailableReason`, `payload`, `transferContent`, bank display fields, account holder/number, and amount. Factory methods must take a `WithdrawalRequest`; callers cannot supply replacement destination values.

- [ ] **Step 5: Return payment instructions only for approved requests**

Add nullable `WithdrawalPaymentInstructionResponse paymentInstruction` to `AdminWithdrawalReviewResponse`. In `AdminWithdrawalReviewService`:

```java
WithdrawalPaymentInstructionResponse instruction = withdrawal.getStatus() == WithdrawalStatus.APPROVED
        ? vietQrService.instructionFor(withdrawal)
        : null;
```

Pass it into the response after `actions`. Do not return a QR payload for `REQUESTED`, `REJECTED`, `CANCELLED`, or `PAID`.

- [ ] **Step 6: Run focused tests**

```powershell
cd backend
.\mvnw.cmd "-Dtest=VietQrServiceTest,AdminWithdrawalOperationsIntegrationTest" test
```

Expected: PASS; approved response contains a valid payload and legacy data falls back to manual transfer.

- [ ] **Step 7: Commit VietQR instructions**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet backend/src/main/resources/application.yml backend/src/test
git commit -m "feat: generate trusted VietQR payment instructions"
```

### Task 3: Require a private receipt and make payment idempotent

**Files:**
- Create: `backend/src/main/resources/db/migration/V32__withdrawal_payment_receipts.sql`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalPaymentEvidenceResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalReceiptService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalPaymentService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalReceiptCleanupService.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalPaymentIntegrationTest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/AdminWithdrawalController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/AdminWithdrawalReviewResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalRequestRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/AdminWithdrawalReviewService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/StoredFileMetadataRepository.java`

- [ ] **Step 1: Write failing payment evidence tests**

Cover required receipt/reference, idempotency, private access, and approved rejection refund:

```java
@Test
void approvedWithdrawalIsPaidOnceWithPrivateReceipt() throws Exception {
    MockMultipartFile receipt = new MockMultipartFile(
            "receipt", "receipt.png", "image/png", syntheticPng());

    mockMvc.perform(multipart("/api/v1/admin/withdrawals/{id}/mark-paid", approved.getId())
                    .file(receipt)
                    .param("transferReference", "FT-20260723-001")
                    .param("internalNote", "Receipt checked")
                    .param("mismatchAcknowledged", "false")
                    .param("idempotencyKey", "2d56cc01-31a0-4fea-a4c3-92986fd1ebf8")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PAID"))
            .andExpect(jsonPath("$.paymentEvidence.transferReference")
                    .value("FT-20260723-001"))
            .andExpect(jsonPath("$.paymentEvidence.receiptUrl")
                    .value(startsWith("/api/v1/files/private/")));

    mockMvc.perform(multipart("/api/v1/admin/withdrawals/{id}/mark-paid", approved.getId())
                    .file(receipt)
                    .param("transferReference", "FT-20260723-001")
                    .param("idempotencyKey", "2d56cc01-31a0-4fea-a4c3-92986fd1ebf8")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PAID"));

    assertEquals(1, actionHistoryRepository
            .findByWithdrawalIdOrderByCreatedAtAscIdAsc(approved.getId()).stream()
            .filter(action -> action.getAction() == WithdrawalActionType.MARKED_PAID)
            .count());
}

private byte[] syntheticPng() {
    return Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z6l8AAAAASUVORK5CYII=");
}
```

Add tests for missing receipt/reference (`400`), user access to receipt (`403`), two different idempotency keys (`409`), concurrent confirmation (one audit), and rejecting `APPROVED` refunds once.

- [ ] **Step 2: Run the tests and verify the old JSON endpoint fails**

```powershell
cd backend
.\mvnw.cmd "-Dtest=WithdrawalPaymentIntegrationTest" test
```

Expected: FAIL because mark-paid accepts JSON and stores no receipt/idempotency data.

- [ ] **Step 3: Add lean receipt columns in V32**

```sql
ALTER TABLE withdrawal_requests ADD COLUMN transfer_reference VARCHAR(120) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN payment_receipt_filename VARCHAR(120) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN payment_receipt_checksum VARCHAR(64) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN payment_idempotency_key VARCHAR(36) NULL;

ALTER TABLE withdrawal_requests
    ADD CONSTRAINT uk_withdrawal_payment_idempotency UNIQUE (payment_idempotency_key);
ALTER TABLE withdrawal_requests
    ADD CONSTRAINT fk_withdrawal_payment_receipt
    FOREIGN KEY (payment_receipt_filename) REFERENCES stored_files(filename);
```

Keep all columns nullable so legacy paid withdrawals remain readable.

- [ ] **Step 4: Add receipt validation/storage by reusing FileStorageService**

Add `WITHDRAWAL_RECEIPT` as a private image category in the existing policy map. Add a deletion method that deletes object storage first and metadata second using an exact filename lookup:

```java
@Transactional
public void deleteStoredFile(String filename) {
    StoredFileMetadata metadata = findMetadata(filename);
    objectStorage.delete(metadata.getObjectKey());
    storedFileMetadataRepository.delete(metadata);
}
```

Only payment failure handling and the orphan query may call this method for withdrawal receipts; never delete a filename already linked to a paid withdrawal.

`WithdrawalReceiptService` validates actual signatures and computes SHA-256 before storage:

```java
@Service
@RequiredArgsConstructor
public class WithdrawalReceiptService {
    private final FileStorageService fileStorageService;
    private final WithdrawalPaymentProperties properties;

    public StoredReceipt store(MultipartFile file, String adminEmail) {
        byte[] bytes;
        try { bytes = file.getBytes(); }
        catch (IOException exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt cannot be read"); }
        String detected = detect(bytes);
        String declared = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!properties.allowedReceiptTypes().contains(detected)
                || !detected.equals(declared)
                || bytes.length > properties.receiptMaxBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt must be a supported image under the configured limit");
        }
        FileStorageService.StoredFile stored = fileStorageService.storeFile(
                file, "WITHDRAWAL_RECEIPT", adminEmail);
        return new StoredReceipt(stored.filename(), sha256(bytes));
    }

    public void delete(String filename) {
        fileStorageService.deleteStoredFile(filename);
    }

    private String detect(byte[] bytes) {
        if (isPng(bytes)) return "image/png";
        if (isJpeg(bytes)) return "image/jpeg";
        if (isWebp(bytes)) return "image/webp";
        return "application/octet-stream";
    }

    private boolean isPng(byte[] value) {
        byte[] signature = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        return value.length >= signature.length
                && IntStream.range(0, signature.length).allMatch(i -> value[i] == signature[i]);
    }

    private boolean isJpeg(byte[] value) {
        return value.length >= 3
                && value[0] == (byte) 0xFF
                && value[1] == (byte) 0xD8
                && value[2] == (byte) 0xFF;
    }

    private boolean isWebp(byte[] value) {
        return value.length >= 12
                && new String(value, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(value, 8, 4, StandardCharsets.US_ASCII).equals("WEBP");
    }

    public record StoredReceipt(String filename, String checksum) {}
}
```

Implement `isPng`, `isJpeg`, and `isWebp` using their standard byte signatures. Format the SHA-256 hash with `HexFormat.of().formatHex(...)`.

- [ ] **Step 5: Store evidence in the locked withdrawal transaction**

Add fields/getters to `WithdrawalRequest` and replace `markPaid()` with:

```java
public void markPaid(
        String transferReference,
        String receiptFilename,
        String receiptChecksum,
        String idempotencyKey
) {
    ensureStatus(WithdrawalStatus.APPROVED);
    this.status = WithdrawalStatus.PAID;
    this.transferReference = transferReference;
    this.paymentReceiptFilename = receiptFilename;
    this.paymentReceiptChecksum = receiptChecksum;
    this.paymentIdempotencyKey = idempotencyKey;
    this.paidAt = LocalDateTime.now();
}
```

Update the transactional `WithdrawalService.markPaid` method:

```java
WithdrawalRequest request = getForUpdate(id);
if (idempotencyKey.equals(request.getPaymentIdempotencyKey())) return request;
if (request.getPaymentIdempotencyKey() != null || request.getStatus() != WithdrawalStatus.APPROVED) {
    throw new ResponseStatusException(HttpStatus.CONFLICT, "Withdrawal payment state changed");
}
request.markPaid(transferReference, receiptFilename, receiptChecksum, idempotencyKey);
recordAction(request, WithdrawalActionType.MARKED_PAID, oldStatus, actor,
        null, internalNote, transferReference, risk);
```

Keep notification inside this transaction. Add `findByPaymentIdempotencyKey` to the repository for the fast retry path.

- [ ] **Step 6: Add the small orchestration service and multipart controller**

`WithdrawalPaymentService.confirm` performs fast idempotency lookup, stores the receipt, calls the transactional lifecycle service, deletes the new file on failure, and returns the authoritative review:

```java
public AdminWithdrawalReviewResponse confirm(
        Long id, String adminEmail, String transferReference, String internalNote,
        boolean mismatchAcknowledged, String idempotencyKey, MultipartFile receipt
) {
    try {
        UUID.fromString(idempotencyKey);
    } catch (IllegalArgumentException exception) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid idempotency key");
    }
    WithdrawalRequest existing = withdrawalRepository.findByPaymentIdempotencyKey(idempotencyKey).orElse(null);
    if (existing != null) {
        if (!existing.getId().equals(id)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Idempotency key belongs to another withdrawal");
        return reviewService.get(id);
    }
    validateReferenceAndMismatch(transferReference, internalNote, mismatchAcknowledged);
    WithdrawalReceiptService.StoredReceipt stored = receiptService.store(receipt, adminEmail);
    WithdrawalRequest result;
    try {
        result = withdrawalService.markPaid(
                id, adminEmail, transferReference.trim(), internalNote,
                stored.filename(), stored.checksum(), idempotencyKey);
    } catch (RuntimeException exception) {
        receiptService.delete(stored.filename());
        throw exception;
    }
    if (!stored.filename().equals(result.getPaymentReceiptFilename())) {
        receiptService.delete(stored.filename());
    }
    return reviewService.get(id);
}
```

Keep `reviewService.get(id)` outside the cleanup catch. A read-response failure after a committed payment must never delete the receipt that the paid withdrawal now references.

Implement the validation helper explicitly:

```java
private void validateReferenceAndMismatch(
        String transferReference,
        String internalNote,
        boolean mismatchAcknowledged
) {
    if (transferReference == null || transferReference.isBlank()
            || transferReference.trim().length() > 120) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transfer reference is required");
    }
    if (mismatchAcknowledged && (internalNote == null || internalNote.isBlank())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Receipt mismatches require an internal note");
    }
}
```

Replace the controller's JSON `mark-paid` body with multipart request params and `MultipartFile`:

```java
@PostMapping(value = "/{id}/mark-paid", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<AdminWithdrawalReviewResponse> markPaid(
        @PathVariable Long id,
        @RequestParam String transferReference,
        @RequestParam(defaultValue = "") String internalNote,
        @RequestParam(defaultValue = "false") boolean mismatchAcknowledged,
        @RequestParam String idempotencyKey,
        @RequestPart("receipt") MultipartFile receipt,
        Authentication authentication
) {
    return ResponseEntity.ok(paymentService.confirm(
            id, authentication.getName(), transferReference, internalNote,
            mismatchAcknowledged, idempotencyKey, receipt));
}
```

Remove `MarkWithdrawalPaidRequest` only after all callers compile.

- [ ] **Step 7: Return admin evidence and safe user fields**

Add nullable payment evidence to admin review:

```java
public record WithdrawalPaymentEvidenceResponse(
        String transferReference,
        String receiptUrl,
        String checksum,
        LocalDateTime paidAt
) {}
```

Build it only when receipt filename exists. Add `transferReference` to `WithdrawalResponse`; do not add receipt URL/checksum to the user response.

- [ ] **Step 8: Add the orphan safety-net cleanup**

Add one repository query for old `WITHDRAWAL_RECEIPT` metadata whose filename is absent from `withdrawal_requests.paymentReceiptFilename`:

```java
@Query("""
        select file from StoredFileMetadata file
        where file.category = 'WITHDRAWAL_RECEIPT'
          and file.createdAt < :before
          and not exists (
              select withdrawal.id from WithdrawalRequest withdrawal
              where withdrawal.paymentReceiptFilename = file.filename
          )
        """)
List<StoredFileMetadata> findOrphanWithdrawalReceipts(@Param("before") LocalDateTime before);
```

Run one daily scheduled method and reuse the exact deletion path:

```java
@Service
@RequiredArgsConstructor
public class WithdrawalReceiptCleanupService {
    private final StoredFileMetadataRepository metadataRepository;
    private final FileStorageService fileStorageService;
    private final WithdrawalPaymentProperties properties;

    @Scheduled(cron = "${wallet.withdrawal.payment.orphan-cleanup-cron:0 30 3 * * *}")
    public void deleteOrphans() {
        LocalDateTime before = LocalDateTime.now().minus(properties.orphanReceiptExpiry());
        metadataRepository.findOrphanWithdrawalReceipts(before)
                .forEach(file -> fileStorageService.deleteStoredFile(file.getFilename()));
    }
}
```

Do not add a second scheduler framework or staging table.

- [ ] **Step 9: Run payment, storage, and wallet tests**

```powershell
cd backend
.\mvnw.cmd "-Dtest=WithdrawalPaymentIntegrationTest,AdminWithdrawalOperationsIntegrationTest,FileStorageSecurityIntegrationTest,WalletEnforcementIntegrationTest" test
```

Expected: PASS with no duplicate audit rows, user receipt access forbidden, and refunds unchanged.

- [ ] **Step 10: Commit private idempotent payment evidence**

```powershell
git add backend/src/main/resources/db/migration/V32__withdrawal_payment_receipts.sql backend/src/main/java/com/example/horseracingtournamentsystem/wallet backend/src/main/java/com/example/horseracingtournamentsystem/filestorage backend/src/test
git commit -m "feat: require private receipt evidence for payouts"
```

### Task 4: Update frontend bank and payment contracts

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/src/types/wallet.ts`
- Modify: `frontend/src/api/walletApi.ts`
- Modify: `frontend/src/api/adminWalletApi.ts`
- Modify: `frontend/src/pages/wallet/banks.ts`
- Modify: `frontend/src/pages/wallet/SavedAccounts.tsx`
- Modify: `frontend/src/pages/wallet/WithdrawSheet.tsx`
- Modify: `frontend/src/pages/wallet/WalletPage.test.tsx`

- [ ] **Step 1: Update wallet tests for server-owned bank metadata**

Mock `walletApi.getBankDirectory()` and assert account creation sends no `bankName` or BIN:

```ts
expect(walletApi.addBankAccount).toHaveBeenCalledWith({
  bankCode: "VCB",
  accountNumber: "0123456789",
  accountHolder: "MAI TRAN",
  label: null,
});
```

Add assertions that the select options come from the mocked directory response.

- [ ] **Step 2: Run the wallet test and verify the old payload fails**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/wallet/WalletPage.test.tsx
```

Expected: FAIL because the current UI imports the full hardcoded bank list and sends `bankName`.

- [ ] **Step 3: Install only the two required browser dependencies**

```powershell
cd frontend
npm install qrcode.react tesseract.js
```

Expected: `package.json` and `package-lock.json` add only the QR renderer, OCR library, and their transitive dependencies.

- [ ] **Step 4: Add exact TypeScript contracts**

Add:

```ts
export interface BankDirectoryItem {
  code: string;
  bin: string;
  name: string;
  qrSupported: boolean;
}

export interface WithdrawalPaymentInstruction {
  available: boolean;
  unavailableReason: string | null;
  payload: string | null;
  transferContent: string;
  bankCode: string | null;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  amount: number;
}

export interface WithdrawalPaymentEvidence {
  transferReference: string;
  receiptUrl: string;
  checksum: string;
  paidAt: string;
}
```

Add nullable `paymentInstruction` and `paymentEvidence` to `AdminWithdrawalReview`. Add optional `transferReference` to `Withdrawal`.

Replace `MarkWithdrawalPaidBody` with:

```ts
export interface ConfirmWithdrawalPayment {
  transferReference: string;
  internalNote: string;
  mismatchAcknowledged: boolean;
  idempotencyKey: string;
  receipt: File;
}
```

- [ ] **Step 5: Update API methods**

Add `walletApi.getBankDirectory`. Change `addBankAccount` to omit `bankName`.

Build multipart without manually setting the boundary:

```ts
markPaid: async (id: number, body: ConfirmWithdrawalPayment) => {
  const data = new FormData();
  data.append("transferReference", body.transferReference);
  data.append("internalNote", body.internalNote);
  data.append("mismatchAcknowledged", String(body.mismatchAcknowledged));
  data.append("idempotencyKey", body.idempotencyKey);
  data.append("receipt", body.receipt);
  return (await httpClient.post<AdminWithdrawalReview>(
    `/admin/withdrawals/${id}/mark-paid`, data,
  )).data;
},
```

- [ ] **Step 6: Replace the duplicated bank data source**

Keep only branding helpers/colors in `banks.ts`. `SavedAccounts` and `WithdrawSheet` load directory values from `walletApi.getBankDirectory`, convert them to `BankSelect` options, and show a retry state if loading fails. Do not keep a second code/BIN/name array in frontend source.

- [ ] **Step 7: Run wallet tests and type-check**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/wallet/WalletPage.test.tsx
node node_modules/typescript/bin/tsc -b --force
```

Expected: PASS.

- [ ] **Step 8: Commit client contracts and trusted banks**

```powershell
git add frontend/package.json frontend/package-lock.json frontend/src/types/wallet.ts frontend/src/api frontend/src/pages/wallet
git commit -m "feat: add withdrawal payment client contracts"
```

### Task 5: Add local receipt OCR and deterministic extraction

**Files:**
- Create: `frontend/src/pages/admin/withdrawals/payment/receiptOcrConfig.ts`
- Create: `frontend/src/pages/admin/withdrawals/payment/receiptFieldExtractor.ts`
- Create: `frontend/src/pages/admin/withdrawals/payment/receiptOcr.ts`
- Create: `frontend/src/pages/admin/withdrawals/payment/receiptFieldExtractor.test.ts`

- [ ] **Step 1: Write failing pure extractor tests with synthetic text**

```ts
it("extracts a reference, amount, time and withdrawal content", () => {
  const result = extractReceiptFields(`
    GIAO DICH THANH CONG
    Ma giao dich: FT-20260723-001
    So tien: 250,000 VND
    Noi dung: WD000123
    Thoi gian: 23/07/2026 14:31
  `, 92);

  expect(result.referenceCandidates[0].value).toBe("FT-20260723-001");
  expect(result.amount).toBe(250_000);
  expect(result.transferContent).toBe("WD000123");
  expect(result.confidence).toBe("HIGH");
});

it("returns candidates instead of inventing a reference", () => {
  const result = extractReceiptFields("GIAO DICH THANH CONG 250,000 VND", 55);
  expect(result.referenceCandidates).toEqual([]);
  expect(result.confidence).toBe("LOW");
});
```

Add comparison tests for matching/mismatching expected amount and transfer content.

- [ ] **Step 2: Run tests and verify the extractor is missing**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/payment/receiptFieldExtractor.test.ts
```

Expected: FAIL because the extractor module does not exist.

- [ ] **Step 3: Add validated named OCR config**

```ts
function probability(name: string, fallback: number) {
  const parsed = Number(import.meta.env[name] ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`${name} must be between 0 and 1`);
  }
  return parsed;
}

export const receiptOcrConfig = {
  highConfidence: probability("VITE_RECEIPT_OCR_HIGH_CONFIDENCE", 0.85),
  mediumConfidence: probability("VITE_RECEIPT_OCR_MEDIUM_CONFIDENCE", 0.6),
};

if (receiptOcrConfig.highConfidence <= receiptOcrConfig.mediumConfidence) {
  throw new Error("OCR high confidence must exceed medium confidence");
}
```

- [ ] **Step 4: Implement one generic, pure extractor**

Normalize accents/case for labels but preserve original candidate values. Use named regex constants for transaction labels, amount, date/time, and `WD` transfer content. Return:

```ts
export interface ReceiptExtraction {
  rawText: string;
  referenceCandidates: Array<{ value: string; confidence: number }>;
  amount: number | null;
  transferContent: string | null;
  transactionTime: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}
```

Do not add one parser per bank in this task.

Use this concrete first-pass extraction shape:

```ts
const REFERENCE = /(?:ma\s*giao\s*dich|transaction\s*id|reference|ref\s*no)\s*[:#-]?\s*([A-Z0-9-]{6,40})/gi;
const AMOUNT = /([0-9][0-9.,\s]{3,})\s*(?:VND|VNĐ|DONG)/i;
const CONTENT = /\bWD\s*0*([0-9]{1,12})\b/i;
const TIME = /\b([0-3]?\d[\/-][01]?\d[\/-]20\d{2}\s+[0-2]?\d:[0-5]\d(?::[0-5]\d)?)\b/;

export function extractReceiptFields(text: string, ocrConfidence: number): ReceiptExtraction {
  const normalized = text.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replaceAll("Đ", "D")
    .replaceAll("đ", "d")
    .toUpperCase();
  const references = [...normalized.matchAll(REFERENCE)]
    .map((match) => match[1])
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3)
    .map((value, index) => ({ value, confidence: Math.max(0, ocrConfidence / 100 - index * 0.1) }));
  const amountMatch = text.match(AMOUNT);
  const digits = amountMatch?.[1].replace(/[^0-9]/g, "") ?? "";
  const contentMatch = normalized.match(CONTENT);
  const normalizedConfidence = ocrConfidence / 100;
  const confidence = references.length > 0 && normalizedConfidence >= receiptOcrConfig.highConfidence
    ? "HIGH"
    : references.length > 0 && normalizedConfidence >= receiptOcrConfig.mediumConfidence
      ? "MEDIUM"
      : "LOW";
  return {
    rawText: text,
    referenceCandidates: references,
    amount: digits ? Number(digits) : null,
    transferContent: contentMatch ? `WD${contentMatch[1].padStart(6, "0")}` : null,
    transactionTime: text.match(TIME)?.[1] ?? null,
    confidence,
  };
}

export function compareReceipt(
  extraction: ReceiptExtraction,
  expected: { amount: number; transferContent: string },
) {
  return {
    amount: extraction.amount == null ? null : extraction.amount === expected.amount,
    transferContent: extraction.transferContent == null
      ? null
      : extraction.transferContent === expected.transferContent,
  };
}
```

- [ ] **Step 5: Wrap Tesseract in a disposable browser worker**

Based on current Tesseract.js worker guidance, create once per open payment modal, reuse for replacement images, and terminate on close:

```ts
export async function createReceiptOcr(onProgress: (progress: number) => void) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng+vie", 1, {
    logger: (message) => {
      if (message.status === "recognizing text") onProgress(message.progress ?? 0);
    },
  });
  return {
    async recognize(file: File) {
      const result = await worker.recognize(file);
      return extractReceiptFields(result.data.text, result.data.confidence);
    },
    terminate: () => worker.terminate(),
  };
}
```

- [ ] **Step 6: Run extractor tests and type-check**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/payment/receiptFieldExtractor.test.ts
node node_modules/typescript/bin/tsc -b --force
```

Expected: PASS; Tesseract remains in a dynamically loaded chunk.

- [ ] **Step 7: Commit local OCR utilities**

```powershell
git add frontend/src/pages/admin/withdrawals/payment
git commit -m "feat: add local withdrawal receipt OCR"
```

### Task 6: Build the QR and receipt payment step

**Files:**
- Create: `frontend/src/pages/admin/withdrawals/payment/VietQrCard.tsx`
- Create: `frontend/src/pages/admin/withdrawals/payment/ReceiptUploader.tsx`
- Create: `frontend/src/pages/admin/withdrawals/payment/ReceiptOcrResult.tsx`
- Create: `frontend/src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.tsx`
- Create: `frontend/src/pages/admin/withdrawals/payment/useWithdrawalPayment.ts`
- Create: `frontend/src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx`

- [ ] **Step 1: Write failing component behavior tests**

Cover QR, mobile download, manual fallback, OCR autofill, mismatch note, and multipart submit:

```tsx
it("renders trusted QR and confirms a matched receipt", async () => {
  renderPayment({ review: approvedReview, extraction: matchedExtraction });
  expect(screen.getByLabelText(/vietqr for withdrawal 123/i)).toBeInTheDocument();
  expect(screen.getByText("WD000123")).toBeInTheDocument();

  await user.upload(screen.getByLabelText(/receipt image/i), syntheticReceipt);
  expect(await screen.findByDisplayValue("FT-20260723-001")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /confirm paid/i }));

  expect(adminWalletApi.markPaid).toHaveBeenCalledWith(123, expect.objectContaining({
    transferReference: "FT-20260723-001",
    receipt: syntheticReceipt,
    mismatchAcknowledged: false,
  }));
});

it("keeps manual transfer usable when QR is unavailable", () => {
  renderPayment({ review: approvedReviewWithoutQr });
  expect(screen.getByText(/qr unavailable/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /copy account number/i })).toBeEnabled();
});

it("rejects and refunds an approved request only after no-transfer confirmation", async () => {
  renderPayment({ review: approvedReviewWithoutQr });
  await user.click(screen.getByRole("button", { name: /cannot complete payment/i }));
  await user.type(screen.getByLabelText(/reason shown to user/i), "The destination account is invalid");
  await user.click(screen.getByRole("checkbox", { name: /no transfer was made/i }));
  await user.click(screen.getByRole("button", { name: /reject & refund/i }));
  expect(adminWalletApi.reject).toHaveBeenCalledWith(123, expect.objectContaining({
    publicReason: "The destination account is invalid",
  }));
});
```

- [ ] **Step 2: Run tests and verify components are absent**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/payment/WithdrawalPaymentStep.test.tsx
```

Expected: FAIL because payment components and hook do not exist.

- [ ] **Step 3: Implement `VietQrCard` using `QRCodeCanvas`**

Render only the backend payload. Keep the canvas ref and download PNG with the current `qrcode.react` ref API:

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);

function downloadQr() {
  const url = canvasRef.current?.toDataURL("image/png");
  if (!url) return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `withdrawal-${withdrawalId}-vietqr.png`;
  anchor.click();
}

<QRCodeCanvas
  ref={canvasRef}
  value={instruction.payload!}
  size={256}
  level="M"
  aria-label={`VietQR for withdrawal ${withdrawalId}`}
/>
```

Add copy buttons using `navigator.clipboard.writeText` with a visible live-region confirmation. When `available` is false, omit the QR and retain all manual fields/copy actions.

- [ ] **Step 4: Implement receipt selection and OCR result UI**

`ReceiptUploader` validates browser-side type/size, owns the object URL lifecycle, and presents an image preview. `ReceiptOcrResult` displays detected fields, candidate reference buttons, match badges, editable reference, mismatch acknowledgement, and required internal note on mismatch. Add a collapsed **Cannot complete payment** section with a public reason, required **No transfer was made** checkbox, and **Reject & refund** action that reuses the existing reject API.

- [ ] **Step 5: Implement the focused payment hook**

Use ordinary React state, not a state-machine library:

```ts
type PaymentBusyState = "IDLE" | "OCR" | "CONFIRMING";

const [busy, setBusy] = useState<PaymentBusyState>("IDLE");
const [receipt, setReceipt] = useState<File | null>(null);
const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null);
const [transferReference, setTransferReference] = useState("");
const idempotencyKey = useRef(crypto.randomUUID());
```

Create the OCR worker on first image selection, reuse it, and terminate it in effect cleanup. Keep the idempotency key stable across retries and regenerate it only after a confirmed success or when the selected withdrawal changes.

- [ ] **Step 6: Compose `WithdrawalPaymentStep`**

The component receives the authoritative approved review, renders `VietQrCard`, `ReceiptUploader`, and `ReceiptOcrResult`, and exposes `dirty`/`busy` to the parent modal through callbacks. Disable **Confirm paid** until receipt and reference exist, plus mismatch acknowledgement/note when applicable.

- [ ] **Step 7: Run payment component tests and type-check**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/payment
node node_modules/typescript/bin/tsc -b --force
```

Expected: PASS.

- [ ] **Step 8: Commit the payment step**

```powershell
git add frontend/src/pages/admin/withdrawals/payment
git commit -m "feat: add VietQR receipt payment step"
```

### Task 7: Integrate single-session review, approval, and payment

**Files:**
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalDecisionPanel.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx`
- Modify: `frontend/src/pages/admin/withdrawals/WithdrawalOperationsTable.tsx`
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx`

- [ ] **Step 1: Add failing modal lifecycle tests**

```tsx
it("stays open and advances to payment after approval", async () => {
  vi.mocked(adminWalletApi.getReview).mockResolvedValue(requestedReview);
  vi.mocked(adminWalletApi.approve).mockResolvedValue(approvedReviewWithQr);
  renderModal();

  await user.click(await screen.findByRole("button", { name: /approve & continue to payment/i }));

  expect(screen.getByRole("dialog", { name: /withdrawal 123 review/i })).toBeInTheDocument();
  expect(await screen.findByLabelText(/vietqr for withdrawal 123/i)).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});

it("opens an approved withdrawal directly on payment", async () => {
  vi.mocked(adminWalletApi.getReview).mockResolvedValue(approvedReviewWithQr);
  renderModal();
  expect(await screen.findByText(/payment details/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^approve/i })).not.toBeInTheDocument();
});
```

Add tests that a selected receipt triggers the dirty-close guard, confirming disables close, a `409` reloads authoritative detail, and a paid review shows receipt evidence but no QR action.

Add a page test proving requested rows expose **Review** but no **Quick approve** shortcut. Direct payment now requires details, QR, and evidence in one modal, so retaining quick approve would force a second modal open.

- [ ] **Step 2: Run tests and verify the current modal has no QR flow**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx src/pages/admin/AdminWithdrawalsPage.test.tsx
```

Expected: FAIL on the new lifecycle/payment assertions.

- [ ] **Step 3: Extract only the existing decision panel**

Move the current `ActionPanel` approve/reject UI into `WithdrawalDecisionPanel.tsx`. Keep its props typed and preserve high-risk validation. Rename the approve action label to **Approve & continue to payment**. Do not refactor unrelated review, risk, or timeline components.

- [ ] **Step 4: Remove the quick-approve path**

Delete `quickRow`, `quickBusy`, `quickApprove`, and the quick-approve confirmation dialog from `AdminWithdrawalsPage`. Simplify `WithdrawalOperationsTable` so every non-terminal request uses the Review action. This leaves one understandable operational path and prevents an approved request from requiring a second modal open.

- [ ] **Step 5: Switch modal content from status, not local guesses**

After approve returns `APPROVED`, set the returned review directly and render `WithdrawalPaymentStep`. On open, use `review.status`:

```tsx
{review.status === "REQUESTED" ? (
  <WithdrawalDecisionPanel review={review} onUpdated={setReview} />
) : review.status === "APPROVED" ? (
  <WithdrawalPaymentStep review={review} onPaid={handlePaid} onStateChange={setPaymentState} />
) : (
  <CompletedWithdrawalPanel review={review} />
)}
```

Merge payment dirty/busy state into the existing modal close guard. Do not close or remount after approval.

- [ ] **Step 6: Show private receipt only to admin in terminal state**

Use the existing authenticated private-file image component with `review.paymentEvidence.receiptUrl`. Do not create a public image URL or add receipt data to rows/user pages.

- [ ] **Step 7: Run modal, page, and wallet tests**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals src/pages/admin/AdminWithdrawalsPage.test.tsx src/pages/wallet/WalletPage.test.tsx --maxWorkers=2 --minWorkers=1
```

Expected: PASS, including modal staying open after approval.

- [ ] **Step 8: Commit single-session payment UX**

```powershell
git add frontend/src/pages/admin frontend/src/pages/wallet frontend/src/api frontend/src/types
git commit -m "feat: complete withdrawals in one admin modal"
```

### Task 8: Full verification, privacy review, and documentation sync

**Files:**
- Verify: `docs/superpowers/specs/2026-07-23-admin-withdrawal-direct-payment-design.md`
- Modify only if evidence requires: files changed in Tasks 1–7

- [ ] **Step 1: Run focused backend verification**

```powershell
cd backend
.\mvnw.cmd "-Dtest=VietQrServiceTest,WithdrawalPaymentIntegrationTest,AdminWithdrawalOperationsIntegrationTest,WithdrawalExportServiceTest" test
```

Expected: PASS with zero failures/errors.

- [ ] **Step 2: Run broader wallet and file-security verification**

```powershell
cd backend
.\mvnw.cmd "-Dtest=*Wallet*,*Withdrawal*,FileStorageSecurityIntegrationTest,FileStorageServiceS3Test" test
```

Expected: PASS; existing holds, refunds, exports, storage access, and notifications remain intact.

- [ ] **Step 3: Run frontend feature tests and production build**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals src/pages/admin/AdminWithdrawalsPage.test.tsx src/pages/wallet/WalletPage.test.tsx --maxWorkers=2 --minWorkers=1
node node_modules/typescript/bin/tsc -b --force
node node_modules/vite/bin/vite.js build
```

Expected: tests PASS, TypeScript exits zero, and Vite completes. Confirm Tesseract is emitted as a lazy chunk rather than included in the initial app bundle.

- [ ] **Step 4: Run the complete frontend suite**

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run
```

Expected: all frontend tests PASS.

- [ ] **Step 5: Verify migration and QR manually with synthetic data**

Apply Flyway through the normal local PostgreSQL startup. Create a synthetic VCB account, request 250,000 VND, approve it, and scan/download the QR. Confirm the banking app preview shows the synthetic account, 250,000 VND, and `WD` reference. Do not complete a real transfer.

- [ ] **Step 6: Verify modal accessibility and recovery**

At desktop and 390px mobile widths, verify keyboard-only review, approve, QR download, receipt selection, dirty close guard, OCR progress, retry, focus return, and no background scroll. Verify closing an approved withdrawal and reopening enters Payment directly.

- [ ] **Step 7: Review privacy and scope**

```powershell
git diff develop...HEAD --check
rg -n "paymentReceipt|receiptUrl|accountNumber|qrPayload|rawText" frontend/src backend/src/main/java/com/example/horseracingtournamentsystem/wallet
git diff develop...HEAD --stat
```

Expected: receipt URL appears only in admin review/payment code; raw OCR text never reaches backend; user responses contain no receipt URL/checksum; QR uses snapshot data; no unrelated subsystem refactor.

- [ ] **Step 8: Commit verification fixes only when necessary**

If verification required changes:

```powershell
git add -u -- backend frontend docs
git commit -m "fix: harden direct withdrawal payment flow"
```

If no files changed, do not create an empty commit.
