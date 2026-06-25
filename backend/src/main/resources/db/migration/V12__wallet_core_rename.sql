-- V12: point ledger -> wallet ledger (tiền thật VND). int -> BIGINT + money-safety primitives.
-- Dialect: PostgreSQL. (Tests dùng H2 create-drop, flyway off, nên migration chỉ chạy trên Postgres.)

-- 1) Drop CHECK trên point_transactions.transaction_type — enum sẽ đổi.
--    Postgres tự đặt tên check inline 1-cột là <table>_<column>_check; drop theo tên đó.
ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS point_transactions_transaction_type_check;

-- 2) Rename tables (T-SQL sp_rename -> Postgres ALTER TABLE ... RENAME TO).
ALTER TABLE user_point_accounts RENAME TO wallets;
ALTER TABLE point_transactions  RENAME TO wallet_transactions;

-- 3) Rename money column + widen BIGINT (VND đồng).
--    T-SQL "ALTER COLUMN x BIGINT" -> Postgres "ALTER COLUMN x TYPE bigint".
ALTER TABLE wallets RENAME COLUMN point_balance TO balance;
ALTER TABLE wallets             ALTER COLUMN balance TYPE bigint;
ALTER TABLE wallet_transactions ALTER COLUMN amount  TYPE bigint;

-- 4) Cột mới: trạng thái ví + running balance cho audit.
ALTER TABLE wallets ADD COLUMN status varchar(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE wallets ADD CONSTRAINT CK_wallets_status CHECK (status IN ('ACTIVE', 'LOCKED'));
ALTER TABLE wallet_transactions ADD COLUMN balance_after bigint;

-- 5) Map enum cũ -> mới (BLOG_REWARD/FIRST_LOGIN_BONUS đã bị V11 xóa).
UPDATE wallet_transactions SET transaction_type = 'BET_PLACED' WHERE transaction_type = 'PREDICTION_ENTRY';
UPDATE wallet_transactions SET transaction_type = 'BET_PAYOUT' WHERE transaction_type = 'PREDICTION_REWARD';
UPDATE wallet_transactions SET transaction_type = 'BET_REFUND' WHERE transaction_type = 'RACE_CANCEL_REFUND';

-- 6) CHECK mới (enum đã trim).
ALTER TABLE wallet_transactions ADD CONSTRAINT CK_wallet_txn_type CHECK (
    transaction_type IN ('TOPUP', 'BET_PLACED', 'BET_PAYOUT', 'BET_REFUND',
                         'WITHDRAWAL_HOLD', 'WITHDRAWAL_REFUND', 'ADMIN_ADJUSTMENT')
);

-- 7) Idempotency được DB ép buộc (partial vì reference_id có thể NULL).
CREATE UNIQUE INDEX UQ_wallet_txn_idem
    ON wallet_transactions (reference_type, reference_id, transaction_type)
    WHERE reference_id IS NOT NULL;
