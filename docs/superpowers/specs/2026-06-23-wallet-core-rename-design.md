# Wallet Core Rename & Money-Safety — Design (Slice 1)

**Ngày:** 2026-06-23
**Plan cha:** [2026-06-23-wallet-payments-plan.md](../plans/2026-06-23-wallet-payments-plan.md) · **BA:** [2026-06-22-wallet-payments-ba.md](../../ba/2026-06-22-wallet-payments-ba.md)
**Tiền đề:** **Slice 0 đã xong** — `point_settings`, `user_blog_rewards`, `user_daily_point_limits` đã DROP; `PointSettingsService`/`FirstLoginBonusService`/`BlogRewardService`/`AdminPointSettingsController` đã xóa; bút toán `BLOG_REWARD`/`FIRST_LOGIN_BONUS` đã DELETE (migration `V11`). Slice 1 chỉ còn ledger thuần.

## Goal
Đổi sổ cái `point` (điểm ảo, `int`) thành sổ cái ví tiền `wallet` (VND, `BIGINT`) — rename + hợp thức hóa an toàn tiền, KHÔNG đổi hành vi quan sát được từ caller. Sau slice: đơn vị VND, idempotency DB-enforced, có `balance_after`, có `Wallet.status`, chống lost-update bằng pessimistic lock.

## Scope
**Trong:** rename bảng/entity/service/package ledger; widen `int→bigint`; thêm `wallets.status`, `wallet_transactions.balance_after`, UNIQUE index idempotency; đổi cơ chế `WalletService`. Migration `V12`.
**Ngoài:** field tiền `race_predictions` (Slice 2); VNPay (Slice 3); withdrawal (Slice 4); nhãn FE (Slice 2).

## Nguyên tắc an toàn tiền (hợp đồng `WalletService.adjust`)
1. Một `@Transactional` ghi đủ `wallet` + `wallet_transaction`.
2. Idempotency = UNIQUE index DB `(reference_type, reference_id, transaction_type)`; service check fast-path tránh lock thừa.
3. Chống double-spend = `@Lock(PESSIMISTIC_WRITE)` trên row ví (không `@Version`/`@Retryable`).
4. Guard không-âm trong entity + lưới đỡ DB.
5. `balance_after` ghi mỗi bút toán.
6. `Wallet.status == LOCKED` → chặn mutate.

---

## Migration — `backend/src/main/resources/db/migration/V12__wallet_core_rename.sql`
Thứ tự bắt buộc cho SQL Server:

```sql
-- V12__wallet_core_rename.sql
-- point ledger -> wallet ledger; int -> BIGINT (VND đồng); money-safety primitives.
-- (V11 đã gỡ gamification: point_settings, blog reward, first-login + bút toán cũ.)

-- 1) Drop auto-named CHECK trên point_transactions.transaction_type (enum sẽ đổi)
DECLARE @ck sysname = (
    SELECT cc.name FROM sys.check_constraints cc
    JOIN sys.columns c ON c.object_id = cc.parent_object_id AND c.column_id = cc.parent_column_id
    WHERE cc.parent_object_id = OBJECT_ID('point_transactions') AND c.name = 'transaction_type'
);
IF @ck IS NOT NULL EXEC('ALTER TABLE point_transactions DROP CONSTRAINT ' + @ck);

-- 2) Rename tables
EXEC sp_rename 'user_point_accounts', 'wallets';
EXEC sp_rename 'point_transactions',  'wallet_transactions';

-- 3) Rename money column + widen BIGINT
EXEC sp_rename 'wallets.point_balance', 'balance', 'COLUMN';
ALTER TABLE wallets             ALTER COLUMN balance BIGINT NOT NULL;
ALTER TABLE wallet_transactions ALTER COLUMN amount  BIGINT NOT NULL;

-- 4) New columns
ALTER TABLE wallets ADD status VARCHAR(20) NOT NULL
    CONSTRAINT DF_wallets_status DEFAULT 'ACTIVE';
ALTER TABLE wallets ADD CONSTRAINT CK_wallets_status CHECK (status IN ('ACTIVE','LOCKED'));
ALTER TABLE wallet_transactions ADD balance_after BIGINT NULL;  -- lịch sử cũ = NULL

-- 5) Map enum cũ -> mới (BET_*); BLOG_REWARD/FIRST_LOGIN_BONUS đã bị V11 xóa
UPDATE wallet_transactions SET transaction_type='BET_PLACED' WHERE transaction_type='PREDICTION_ENTRY';
UPDATE wallet_transactions SET transaction_type='BET_PAYOUT' WHERE transaction_type='PREDICTION_REWARD';
UPDATE wallet_transactions SET transaction_type='BET_REFUND' WHERE transaction_type='RACE_CANCEL_REFUND';

-- 6) CHECK mới (enum đã trim: không còn FIRST_LOGIN_BONUS, BLOG_REWARD)
ALTER TABLE wallet_transactions ADD CONSTRAINT CK_wallet_txn_type CHECK (
    transaction_type IN ('TOPUP','BET_PLACED','BET_PAYOUT','BET_REFUND',
                         'WITHDRAWAL_HOLD','WITHDRAWAL_REFUND','ADMIN_ADJUSTMENT')
);

-- 7) Idempotency DB-enforced (filtered vì reference_id có thể NULL)
CREATE UNIQUE INDEX UQ_wallet_txn_idem
    ON wallet_transactions (reference_type, reference_id, transaction_type)
    WHERE reference_id IS NOT NULL;
```
> FK `wallet_transactions.user_id` và PK không đổi khi `sp_rename` bảng. UNIQUE index lỗi nếu trùng dữ liệu cũ → dedupe (dev reseed nên sạch).

---

## Entity & Service

### `wallet/entity/Wallet.java` (từ `UserPointAccount`)
- `@Table("wallets")`; `userId` PK + `@MapsId`; `long balance`; `updatedAt`.
- `@Enumerated(STRING) WalletStatus status` (default `ACTIVE`).
- `create(User)` → ACTIVE, balance 0. `add(long)` (guard >0). `adjust(long)`:
```java
public void adjust(long amount) {
    long next = this.balance + amount;
    if (next < 0) throw new IllegalArgumentException(
        "Insufficient wallet balance (has: " + balance + ", attempted: " + amount + ")");
    this.balance = next;
    this.updatedAt = LocalDateTime.now();
}
public boolean isLocked() { return status == WalletStatus.LOCKED; }
```

### `wallet/entity/WalletStatus.java` (mới)
```java
public enum WalletStatus { ACTIVE, LOCKED }
```

### `wallet/entity/WalletTransaction.java` (từ `PointTransaction`)
- `@Table("wallet_transactions")`; `long amount`; thêm `Long balanceAfter`.
- REF constants: giữ `REF_RACE_PREDICTION`, `REF_STREAK_PREDICTION`; bỏ `REF_BLOG` (blog reward đã gỡ); thêm `REF_TOPUP_ORDER`, `REF_WITHDRAWAL` cho slice sau.
- `create(user, amount, type, refType, refId, desc, balanceAfter)`.

### `wallet/entity/WalletTransactionType.java` (từ `PointTransactionType`)
`TOPUP, BET_PLACED, BET_PAYOUT, BET_REFUND, WITHDRAWAL_HOLD, WITHDRAWAL_REFUND, ADMIN_ADJUSTMENT`.

### `wallet/repository/WalletRepository.java` (từ `UserPointAccountRepository`)
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select w from Wallet w where w.userId = :userId")
Optional<Wallet> lockByUserId(@Param("userId") Long userId);
```

### `wallet/service/WalletService.java` (từ `PointAccountService`) — cơ chế mới
```java
@Transactional
public long adjust(User user, long amount, WalletTransactionType type,
                   String refType, Long refId, String description) {
    if (isIdempotent(refType, refId, type)) return getBalance(user.getId());   // 1
    getOrCreateAccount(user);                                                   // 2
    Wallet wallet = walletRepo.lockByUserId(user.getId())                       // 3 FOR UPDATE
        .orElseThrow(() -> new IllegalStateException("Wallet missing after create"));
    if (wallet.isLocked())                                                      // 4
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Wallet is locked");
    wallet.adjust(amount);                                                      // 5 guard âm
    long balanceAfter = wallet.getBalance();
    walletRepo.save(wallet);
    walletTxnRepo.save(WalletTransaction.create(                               // 6 UNIQUE = lưới đỡ
        user, amount, type, refType, refId, description, balanceAfter));
    return balanceAfter;
}
```
- `credit(...)` delegate `adjust`. `getBalance/getExistingBalanceOrZero` → `long`. `initializeAccount(User, long)`.
- `isIdempotent` giữ làm fast-path; đúng đắn cuối do UNIQUE index — race lọt B1 → `DataIntegrityViolationException` → rollback (không double-credit), job/IPN thấy "đã xong" vòng kế.

---

## Danh sách file đổi (Slice 1)
**Rename + sửa nội dung:**
- `point/entity/UserPointAccount.java` → `wallet/entity/Wallet.java` (+status, +adjust/isLocked)
- `point/entity/PointTransaction.java` → `wallet/entity/WalletTransaction.java` (+balanceAfter, long, bỏ REF_BLOG)
- `point/entity/PointTransactionType.java` → `wallet/entity/WalletTransactionType.java` (enum trim)
- `point/repository/UserPointAccountRepository.java` → `wallet/repository/WalletRepository.java` (+lockByUserId)
- `point/repository/PointTransactionRepository.java` → `wallet/repository/WalletTransactionRepository.java`
- `point/service/PointAccountService.java` → `wallet/service/WalletService.java` (cơ chế mới)

**Mới:** `wallet/entity/WalletStatus.java`.

**Chỉ đổi import (consumer còn lại sau Slice 0):** `prediction/service/PredictionService.java`, `prediction/scheduler/PredictionSettlementScheduler.java`, `prediction/service/StreakPredictionService.java`, `leaderboard/service/LeaderboardService.java`. *(`PointTransactionType.X` → `WalletTransactionType.X`: `PREDICTION_ENTRY→BET_PLACED`, `PREDICTION_REWARD→BET_PAYOUT`, `RACE_CANCEL_REFUND→BET_REFUND`; `int` literal auto-widen `long`.)*

**Test:** `prediction/service/StreakPointAccountingIntegrationTest.java` → đổi import + tên type. *(`AdminPointSettingsIntegrationTest` đã xóa ở Slice 0.)*

**Data:** `demo_data_script.sql` — `user_point_accounts→wallets`, `point_balance→balance`, `point_transactions→wallet_transactions`, map transaction_type.

---

## Verification
1. `./mvnw test` xanh (H2 build schema từ JPA `ddl-auto`, không chạy migration — kiểm tra entity mapping khớp cột mới).
2. Test regression an toàn tiền:
   - `adjust` cùng `(refType,refId,type)` 2 lần → balance đổi đúng **một** lần; bút toán thứ 2 không sinh.
   - `adjust` làm âm → exception, balance & ledger không đổi.
   - Ví `LOCKED` → `adjust` bị chặn (403).
   - `balance_after` = balance sau khi áp dụng.
3. Boot dev (SQL Server): `docker compose down -v` → up → backend chạy `V11`+`V12` trên DB sạch; kiểm tra `wallets`/`wallet_transactions` (UNIQUE index, CHECK, status) tồn tại; `point_settings`/blog-reward tables đã biến mất.
4. Smoke: luồng prediction/leaderboard không đổi hành vi so với trước rename.

## Rủi ro Slice 1
- `ALTER COLUMN` fail nếu còn DEFAULT/CHECK chưa drop → đã xử lý `transaction_type`; `balance` không default nên OK.
- H2 hỗ trợ `PESSIMISTIC_WRITE` (phần lớn no-op) — test idempotency/guard không phụ thuộc lock thật.
- IDE refactor sót import → dựa `./mvnw test` đỏ để bắt; không sửa tay.
