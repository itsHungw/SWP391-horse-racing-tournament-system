package com.example.horseracingtournamentsystem.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class FinanceReportingMigrationTest {

    @Test
    void addsNarrowIndexesForFinanceDateAndFilterQueries() throws IOException {
        Path migrationPath = Path.of(
                "src/main/resources/db/migration/V35__finance_reporting_indexes.sql");
        assertThat(migrationPath).exists();
        String migration = Files.readString(migrationPath);

        assertThat(migration)
                .contains("idx_race_predictions_finance_evaluated")
                .contains("idx_streak_predictions_finance_evaluated")
                .contains("idx_wallet_transactions_finance_created")
                .contains("idx_topup_orders_finance_created")
                .contains("idx_withdrawal_requests_finance_paid");
    }

    @Test
    void addsLaterTopUpIndexesInANewMigrationWithoutChangingAppliedV35() throws IOException {
        Path appliedMigration = Path.of(
                "src/main/resources/db/migration/V35__finance_reporting_indexes.sql");
        Path followUpMigration = Path.of(
                "src/main/resources/db/migration/V36__finance_topup_reconciliation_indexes.sql");

        assertThat(followUpMigration).exists();
        assertThat(Files.readString(appliedMigration))
                .doesNotContain("idx_topup_orders_finance_paid")
                .doesNotContain("idx_topup_orders_vnpay_transaction_no");
        assertThat(Files.readString(followUpMigration))
                .contains("idx_topup_orders_finance_paid")
                .contains("idx_topup_orders_vnpay_transaction_no");
    }
}
