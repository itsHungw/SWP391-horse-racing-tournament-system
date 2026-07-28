package com.example.horseracingtournamentsystem.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class WithdrawalFinancialInvariantMigrationTest {

    @Test
    void legacyDuplicateEvidenceIsQuarantinedWithoutDeletingHistory() throws IOException {
        Path migrationPath = Path.of(
                "src/main/resources/db/migration/V34__strengthen_withdrawal_evidence_uniqueness.sql");
        assertThat(migrationPath).exists();
        String migration = Files.readString(migrationPath);

        assertThat(migration)
                .contains("transfer_reference_unique_enforced")
                .contains("receipt_checksum_unique_enforced")
                .containsPattern("(?s)ROW_NUMBER\\(\\) OVER\\s*\\(\\s*PARTITION BY UPPER\\(transfer_reference\\)")
                .containsPattern("(?s)ROW_NUMBER\\(\\) OVER\\s*\\(\\s*PARTITION BY payment_receipt_checksum")
                .contains("AND transfer_reference_unique_enforced")
                .contains("AND receipt_checksum_unique_enforced");
        assertThat(migration).doesNotContain("DELETE FROM withdrawal_requests");
    }
}
