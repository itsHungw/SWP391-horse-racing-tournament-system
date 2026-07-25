CREATE INDEX IF NOT EXISTS idx_topup_orders_finance_paid
    ON topup_orders (paid_at, status);

CREATE INDEX IF NOT EXISTS idx_topup_orders_vnpay_transaction_no
    ON topup_orders (vnpay_transaction_no);
