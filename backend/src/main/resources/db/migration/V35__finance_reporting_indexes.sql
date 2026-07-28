CREATE INDEX IF NOT EXISTS idx_race_predictions_finance_evaluated
    ON race_predictions (evaluated_at, status);

CREATE INDEX IF NOT EXISTS idx_streak_predictions_finance_evaluated
    ON streak_predictions (evaluated_at, status);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_finance_created
    ON wallet_transactions (created_at, transaction_type, user_id);

CREATE INDEX IF NOT EXISTS idx_topup_orders_finance_created
    ON topup_orders (created_at, status, user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_finance_paid
    ON withdrawal_requests (paid_at, status);
