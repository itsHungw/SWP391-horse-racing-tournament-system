-- V12: point ledger -> wallet ledger (tiền thật VND). int -> BIGINT + money-safety primitives.
-- Tests dùng H2 (ddl-auto create-drop, flyway off) nên migration này chỉ chạy trên SQL Server.

-- 1) Drop CHECK (tên auto-generated) trên point_transactions.transaction_type — enum sẽ đổi.
DECLARE @ck sysname = (
    SELECT cc.name FROM sys.check_constraints cc
    JOIN sys.columns c ON c.object_id = cc.parent_object_id AND c.column_id = cc.parent_column_id
    WHERE cc.parent_object_id = OBJECT_ID('point_transactions') AND c.name = 'transaction_type'
);
IF @ck IS NOT NULL EXEC('ALTER TABLE point_transactions DROP CONSTRAINT ' + @ck);

-- 2) Rename tables.
EXEC sp_rename 'user_point_accounts', 'wallets';
EXEC sp_rename 'point_transactions',  'wallet_transactions';

-- 3) Rename money column + widen BIGINT (VND đồng).
EXEC sp_rename 'wallets.point_balance', 'balance', 'COLUMN';
ALTER TABLE wallets             ALTER COLUMN balance BIGINT NOT NULL;
ALTER TABLE wallet_transactions ALTER COLUMN amount  BIGINT NOT NULL;

-- 4) Cột mới: trạng thái ví + running balance cho audit.
ALTER TABLE wallets ADD status VARCHAR(20) NOT NULL CONSTRAINT DF_wallets_status DEFAULT 'ACTIVE';
ALTER TABLE wallets ADD CONSTRAINT CK_wallets_status CHECK (status IN ('ACTIVE', 'LOCKED'));
ALTER TABLE wallet_transactions ADD balance_after BIGINT NULL;

-- 5) Map enum cũ -> mới (BLOG_REWARD/FIRST_LOGIN_BONUS đã bị V11 xóa).
UPDATE wallet_transactions SET transaction_type = 'BET_PLACED' WHERE transaction_type = 'PREDICTION_ENTRY';
UPDATE wallet_transactions SET transaction_type = 'BET_PAYOUT' WHERE transaction_type = 'PREDICTION_REWARD';
UPDATE wallet_transactions SET transaction_type = 'BET_REFUND' WHERE transaction_type = 'RACE_CANCEL_REFUND';

-- 6) CHECK mới (enum đã trim).
ALTER TABLE wallet_transactions ADD CONSTRAINT CK_wallet_txn_type CHECK (
    transaction_type IN ('TOPUP', 'BET_PLACED', 'BET_PAYOUT', 'BET_REFUND',
                         'WITHDRAWAL_HOLD', 'WITHDRAWAL_REFUND', 'ADMIN_ADJUSTMENT')
);

-- 7) Idempotency được DB ép buộc (filtered vì reference_id có thể NULL).
CREATE UNIQUE INDEX UQ_wallet_txn_idem
    ON wallet_transactions (reference_type, reference_id, transaction_type)
    WHERE reference_id IS NOT NULL;
